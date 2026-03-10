# Multi-Tenant SaaS Billing Orchestrator

Production-focused Spring Boot backend for multi-tenant SaaS billing, Stripe-based subscription fulfillment, and Redis-backed API quota enforcement.

## Implemented Architecture

- Tenant-scoped data model (`tenants`, `users`, `subscriptions`, `payment_events`)
- Flyway-managed schema migrations (no runtime schema mutation in dev/prod)
- JWT auth for human endpoints (`/api/auth/**`, `/api/checkout/**`)
- API-key interceptor for machine endpoints (`/api/v1/**`)
- Redis atomic quota decrement via Lua script
- Idempotent Stripe webhook processing (`invoice.paid`) using DB unique constraint
- Scheduled Redis -> PostgreSQL quota reconciliation

## Tech Stack

- Java 17
- Spring Boot 3.5
- Spring Data JPA + PostgreSQL
- Spring Security + JWT (jjwt)
- Redis (Spring Data Redis)
- Flyway
- Stripe Java SDK

## Prerequisites

- Java 17+
- Maven 3.9+
- Docker Desktop
- Stripe test account keys

## Local Setup

1. Start dependencies:

```bash
docker-compose up -d
```

2. Export environment variables:

```bash
set SPRING_PROFILES_ACTIVE=dev
set BILLING_DB_URL=jdbc:postgresql://localhost:5432/sbo_dev
set BILLING_DB_USERNAME=sbo_admin
set BILLING_DB_PASS=password
set REDIS_HOST=localhost
set REDIS_PORT=6379
set STRIPE_SECRET_KEY=sk_test_xxx
set STRIPE_WEBHOOK_SECRET=whsec_xxx
set APP_JWT_SECRET=replace-with-at-least-32-characters
```

3. Run app:

```bash
mvn spring-boot:run
```

Flyway auto-runs migration from `src/main/resources/db/migration/V1__baseline_schema.sql` on startup.

## Seed Data (Dev)

Use SQL to create a tenant/user/subscription for local testing:

```sql
INSERT INTO tenants(company_name, tenant_api_key, quota_balance, create_time, update_time)
VALUES ('Acme Inc', 'acme_prod_demo_key', 10000, now(), now());

INSERT INTO subscriptions(tenant_id, stripe_customer_id, plan_tier, quota_total, quota_used, status, create_time, update_time)
VALUES (
  (SELECT id FROM tenants WHERE tenant_api_key = 'acme_prod_demo_key'),
  'cus_test_acme_001',
  'PRO',
  10000,
  0,
  'ACTIVE',
  now(),
  now()
);

-- Generate BCrypt hash locally (example password: P@ssw0rd!)
INSERT INTO users(tenant_id, email, password_hash, create_time, update_time)
VALUES (
  (SELECT id FROM tenants WHERE tenant_api_key = 'acme_prod_demo_key'),
  'admin@acme.com',
  '<BCrypt_HASH_FOR_YOUR_PASSWORD>',
  now(),
  now()
);
```

## API Quick Checks

### 1) Login (`/api/auth/login`)

```bash
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@acme.com\",\"password\":\"P@ssw0rd!\"}"
```

### 2) Create Checkout Session (`/api/checkout/create-session`)

```bash
curl -X POST http://localhost:8080/api/checkout/create-session ^
  -H "Authorization: Bearer <JWT_TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"priceId\":\"price_xxx\",\"successUrl\":\"https://example.com/success\",\"cancelUrl\":\"https://example.com/cancel\"}"
```

### 3) M2M API (`/api/v1/process-data`)

```bash
curl -X POST http://localhost:8080/api/v1/process-data ^
  -H "Authorization: Bearer acme_prod_demo_key" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"analyze\",\"dataPayload\":{\"text\":\"hello\"}}"
```

## Stripe Webhook Test

1. Start Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:8080/api/webhooks/stripe
```

2. Copy generated webhook secret into `STRIPE_WEBHOOK_SECRET`.

3. Trigger test event:

```bash
stripe trigger invoice.paid
```

The webhook is idempotent by `payment_events.stripe_event_id` unique constraint.

## Testing

Run tests:

```bash
mvn test
```

`application-test.properties` uses in-memory H2 and disables scheduling to keep tests deterministic.

## Notes on Secrets

- Do not commit real Stripe keys.
- `.env` is ignored by git; keep only local/dev test values there.
- Use environment variables or secret manager values in production.

