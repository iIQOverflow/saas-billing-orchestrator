# SaaS Billing Orchestrator

**Production-minded multi-tenant billing system with a substantial Spring Boot backend and a thin Next.js frontend MVP in the same repository.**

It demonstrates browser-safe product flows on top of a backend that owns billing rules, quota behavior, and canonical subscription fulfillment.

## Demo preview

**Live demo:** deployment coming next

**Demo flow**
![Demo flow GIF](resources/demo/demo-flow.gif)

**Dashboard main**
![Dashboard Main](resources/screenshots/dashboard-main.png)

**Change plan**
![Dashboard Change Plan](resources/screenshots/dashboard-change-plan.png)

---

## Project summary

**SaaS Billing Orchestrator** is a backend-centered billing system with a thin frontend MVP for demo and interview use.

The backend is the core of the project. It owns contracts, billing rules, subscription fulfillment, quota behavior, and browser-safe product flows. The frontend under `/frontend` is intentionally thin and backend-driven: it exists to demonstrate real user flows such as login, dashboard-driven quota visibility, usage consumption, and paid plan change through Stripe checkout.

A key hardening step in the project was introducing **canonical `PlanCode`-based fulfillment**. The browser sends `planCode`, the backend resolves Stripe `priceId` privately, checkout stores the purchased `planCode` in Stripe subscription metadata, and `invoice.paid` fulfillment updates persisted subscription and quota state from that canonical plan identity. This fixed a real drift bug where persisted plan identity and quota totals could diverge.

---

## What is implemented

Current implemented product flow:

1. login
2. dashboard loads backend-driven data
3. usage consumption works from the UI
4. quota refresh works
5. plan-change / checkout redirect works
6. Stripe success/cancel return works
7. dashboard reflects refreshed backend state after return

Browser-safe backend endpoints implemented for the frontend MVP:

- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/dashboard/summary`
- `POST /api/demo/usage/consume`
- `POST /api/checkout/create-session`

Current frontend MVP status:

- implemented under `/frontend`
- thin and backend-driven
- Next.js + TypeScript + App Router + plain `fetch`
- no Redux / React Query / Axios
- Final QA passed for login, protected dashboard access, dashboard load, usage consume flow, quota refresh, checkout redirect, success/cancel return, and logout behavior.

---

## Architecture at a glance

The project is intentionally backend-centered: the frontend stays thin, while the backend owns contracts, billing rules, and fulfillment behavior.
### Backend

- Spring Boot backend remains the source of truth for contracts and business behavior
- PostgreSQL stores tenant, subscription, and billing state
- Redis supports quota-related backend behavior
- Stripe handles paid checkout and subscription fulfillment
- JWT secures browser-safe authenticated flows

### Frontend (`/frontend`)

- Next.js
- TypeScript
- App Router
- plain `fetch`
- minimal proxy/BFF-style layer for browser-safe backend calls
- JWT handled through HttpOnly cookie flow, not `localStorage` or `sessionStorage`

### Boundary design

- browser uses only browser-safe endpoints
- browser does **not** use `/api/v1/**`
- browser-safe responses do **not** expose:
  - `tenantApiKey`
  - `stripeCustomerId`
  - Stripe `priceId`
  - machine-facing secrets

---

## Key engineering decisions

### 1. Added browser-safe endpoints instead of reusing machine-facing APIs

The frontend uses product-shaped endpoints such as `/api/me` and `/api/dashboard/summary` rather than consuming `/api/v1/**`. This keeps browser contracts safer and avoids leaking machine-facing identifiers into the UI.

### 2. Made `PlanCode` the canonical application plan identity

The application plan model is:

- `FREE`
- `PLUS`
- `PRO`

This separates business plan identity from Stripe-specific commercial identifiers.

### 3. Browser sends `planCode`, not Stripe `priceId`

Checkout validates `planCode` strictly, rejects `FREE` for Stripe checkout, and resolves Stripe `priceId` privately on the backend.

### 4. Canonicalized fulfillment from `PlanCode`

Checkout writes the purchased `planCode` into Stripe subscription metadata. `invoice.paid` reads that metadata back and updates persisted subscription and quota state canonically. This fixed the drift bug where plan identity and quota totals could diverge.

### 5. Cleaned up persisted naming from `plan_tier` to `plan_code`

The persistence model was aligned through Flyway. Persistence remains string-backed for now.

---

## Demo flow

Recommended reviewer / interviewer flow:

1. **Log in** through the frontend using the browser-safe authentication flow.
2. **Load the dashboard** and verify that subscription and quota data come from the backend.
3. **Consume usage** from the UI to exercise the browser-safe usage path.
4. **Refresh quota** and confirm updated backend state is reflected in the dashboard.
5. **Start a paid plan change** from the dashboard. The browser sends `planCode`; the backend handles Stripe mapping privately.
6. **Return from Stripe** through either the success or cancel path.
7. **Verify refreshed state** after return on the dashboard.

The point of the demo is not frontend complexity. It is that the frontend is thin while the backend owns billing logic, fulfillment behavior, and browser-safe product contracts.

---

## Repository structure

```text
.
├── frontend/                    # Next.js frontend MVP
├── resources/demo/             # demo GIF
├── resources/screenshots/      # README screenshots
├── src/main/java/...           # Spring Boot backend source
├── src/main/resources/         # app config + Flyway migrations
├── docker-compose.yml
└── pom.xml
```


The frontend and backend live in the same repository, but the backend remains the source of truth for contracts and business behavior.

---

## Local run instructions

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- Docker Desktop
- Stripe test keys for checkout testing

### 1. Start local infrastructure

From the repository root:

```bash
docker-compose up -d
```

This starts local PostgreSQL and Redis.

### 2. Configure backend environment

#### Environment variables

```bash
# --- Spring Boot Profile ---
SPRING_PROFILES_ACTIVE=dev
# --- JWT ---
APP_JWT_SECRET=replace-with-at-least-32-characters
APP_JWT_EXPIRATION_SECONDS=3600
# --- PostgreSQL ---
BILLING_DB_URL=jdbc:postgresql://localhost:5432/sbo_dev
BILLING_DB_USERNAME=sbo_admin
BILLING_DB_PASS=password
# --- Redis ---
REDIS_HOST=localhost
REDIS_PORT=6379
QUOTA_RECONCILIATION_DELAY_MS=300000
# --- Stripe ---
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PLUS=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx
```

#### Stripe configuration (Sandbox)
1. Create a test customer in Stripe.
2. Create two products/prices in Stripe for:
  - Plus
  - Pro
3. Copy the resulting Stripe price IDs into:
  - `STRIPE_PRICE_ID_PLUS`
  - `STRIPE_PRICE_ID_PRO`

### 3. Run the backend

From the repository root:

```bash
./mvnw spring-boot:run
```

Flyway auto-runs migrations from `src/main/resources/db/migration/` on startup.

### 4. Seed local dev data

Use SQL to create a tenant, user, and subscription for local testing:

```sql
INSERT INTO tenants(company_name, tenant_api_key, quota_balance, create_time, update_time)
VALUES ('Acme Inc', 'acme_prod_demo_key', 10000, now(), now());

INSERT INTO subscriptions(tenant_id, stripe_customer_id, plan_code, quota_total, quota_used, status, create_time, update_time)
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

-- Generate a BCrypt hash locally and replace the placeholder before inserting the user row.
INSERT INTO users(tenant_id, email, password_hash, create_time, update_time)
VALUES (
  (SELECT id FROM tenants WHERE tenant_api_key = 'acme_prod_demo_key'),
  'admin@acme.com',
  '<BCrypt_HASH_FOR_YOUR_PASSWORD>',
  now(),
  now()
);
```
After inserting the seeded user, log in with:

- email: admin@acme.com
- password: the plain-text password you used when generating the BCrypt hash

### 5. Run the frontend

From the `/frontend` directory:

```bash
npm install
npm run dev
```

### 6. Open the app

Open the frontend URL shown by Next.js in your browser and follow the core demo flow:

1. log in
2. load the dashboard
3. consume usage
4. refresh quota
5. start checkout
6. return from Stripe success/cancel flow

### 7. Optional Stripe webhook testing

Start Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:8080/api/webhooks/stripe
```

Copy the generated webhook secret into `STRIPE_WEBHOOK_SECRET`, then trigger a test event:

```bash
stripe trigger invoice.paid
```

---

## Scope and boundaries

This project is intentionally strong in backend behavior and intentionally thin in frontend architecture.

Scope:

- substantial, production-minded backend
- thin frontend MVP accepted for interview/demo use
- dashboard-centered product flow
- simple success/cancel return pages

Boundaries:

- backend remains the source of truth
- browser uses only browser-safe APIs
- `/api/v1/**` remains machine-facing
- browser-safe responses do not expose machine-facing values
- `plan_code` persistence remains string-backed for now

The current priority is packaging, demo clarity, and interview readiness rather than expanding project scope.

---

## Trade-offs and deferred work

- The frontend is intentionally thin and backend-driven; it is not designed as a frontend-heavy architecture exercise.
- Browser-safe APIs remain separate from machine-facing `/api/v1/**`.
- `subscriptions.plan_code` remains string-backed for now; direct JPA enum mapping is deferred.
- Success/cancel pages are intentionally simple.
- Broader billing policy changes, frontend architecture expansion, and new library adoption are explicitly deferred until after packaging and demo readiness.

---