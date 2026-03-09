This is the definitive Technical Solution Document (TSD) for your portfolio. It strips away junior-level theoretical fluff and strictly defines the production-ready boundaries, data models, and architectural mitigations required for an enterprise B2B SaaS platform.

Save this directly to your repository as `TECHNICAL_SOLUTION_DESIGN.md`. It is your ultimate weapon for technical interviews.

---

# **Technical Solution Design (TSD)**
**System:** Multi-Tenant SaaS API Orchestrator

**Architecture Profile:** Evolutionary Monolith with Externalized State

**Primary Stack:** Java 17, Spring Boot 3, PostgreSQL 15, Redis, Next.js

---

## **1. Overall System Design**
The system is architected to prioritize strict financial data integrity and high-throughput API protection. It utilizes an "Evolutionary Architecture" approach: deploying as a cohesive Spring Boot monolith to reduce operational complexity for V1, while strictly decoupling state (Redis, PostgreSQL) to allow instantaneous horizontal scaling (spinning up multiple EC2 instances behind a load balancer) in the future.

### **Cloud Deployment Topology (AWS)**
+ **Compute:** AWS EC2 instance hosting the Spring Boot `.jar` and Next.js frontend (via PM2 or Docker).
+ **Persistence:** AWS RDS (PostgreSQL 15) deployed in a private subnet. Acts as the absolute source of truth for billing and identity.
+ **State & Metering:** AWS ElastiCache (Redis) or Dockerized Redis. Handles ephemeral API rate-limiting to prevent database I/O bottlenecks.
+ **Security Edge:** Nginx reverse proxy handling SSL termination and routing traffic to the internal Spring Boot Tomcat server (Port 8080).

---

## **2. Detailed Module Design**
The core backend is segregated into strictly isolated modules to enforce the Single Responsibility Principle (SRP).

### **Module A: The M2M API Gateway (Interceptor Layer)**
+ **Functionality:** Protects core computing resources from unauthorized or runaway automated traffic.
+ **Technology:** Spring `HandlerInterceptor` + Redis.
+ **Mechanism:** Intercepts all requests matching `/api/v1/**`. Extracts the `Authorization: Bearer <tenantApiKey>`. Performs an atomic `DECR` operation in Redis.
+ **Concurrency:** By using Redis instead of PostgreSQL for rate limiting, the system bypasses slow disk I/O and row-level locking, ensuring sub-millisecond authorization latency.

### **Module B: The Idempotent Billing Engine**
+ **Functionality:** Orchestrates the subscription lifecycle and processes asynchronous Stripe Webhooks.
+ **Technology:** Stripe Java SDK, Spring `@RestController`, PostgreSQL `UNIQUE` constraints.
+ **Mechanism:** Cryptographically verifies incoming Stripe payloads using HMAC SHA-256. Utilizes the database layer as a distributed lock to enforce "Exactly-Once" processing.

### **Module C: Multi-Tenant Data Access Layer**
+ **Functionality:** Enforces mathematical data isolation between enterprise clients.
+ **Technology:** Spring Data JPA / Hibernate.
+ **Mechanism:** Business queries natively inject `tenant_id`. Users are structurally prevented from executing cross-tenant queries because the identity context is bound to the repository method (e.g., `findByTenantId`).

---

## **3. API Design**
The system exposes two distinct architectural "doors."

> **Optimized English Translation:** "Could you provide the complete API documentation containing all endpoints? Each API specification must strictly include: API Name, Description, Request URL, Request Method, Request Parameters (Name, Type, Required, Default, Description), Request Example, Response Fields (Field, Type, Description), and Response Example."
>

---

### **The Architectural Contract: API Specification**
In an enterprise B2B environment, your API documentation is your legal contract with your clients. If it is vague, your clients' automated systems will crash, and they will cancel their subscriptions.

Here is the definitive, production-ready API specification for the **Multi-Tenant SaaS API Orchestrator**. This acts as the blueprint for your Springdoc OpenAPI (Swagger) generation.

There are exactly three core APIs that define the boundaries of your system.

---

### **1. The M2M API (Machine-to-Machine Business Logic)**
This is the endpoint your B2B clients pay for. It is protected by the Redis rate-limiter and requires the `tenantApiKey`.

+ **接口名称 (API Name):** Execute Core Business Logic
+ **接口说明 (API Description):** Processes automated client data. Each successful call deducts 1 from the Tenant's Redis quota. Returns `429 Too Many Requests` if the quota is zero.
+ **请求URL (Request URL):** `/api/v1/process-data`
+ **请求方法 (Request Method):** `POST`

**请求参数 (Request Parameters):**

| 参数位置 (Location) | 参数名 (Name) | 类型 (Type) | 是否必填 (Required) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- | --- | --- |
| Header | `Authorization` | String | Yes | None | Standard Bearer token format: `Bearer <tenantApiKey>` |
| Body | `action` | String | Yes | None | The business action to perform (e.g., "analyze", "format") |
| Body | `dataPayload` | Object | Yes | None | The raw JSON data the client wants processed |


**请求示例 (Request Example):**

```http
POST /api/v1/process-data HTTP/1.1
Host: api.yourdomain.com
Authorization: Bearer acme_prod_9a8b7c6d5e4f3g2h1
Content-Type: application/json

{
  "action": "analyze",
  "dataPayload": {
    "text": "Enterprise data string to be processed."
  }
}

```

**响应结果 (Response Fields):**

| 字段 (Field) | 类型 (Type) | 描述 (Description) |
| --- | --- | --- |
| `status` | String | Success or failure indicator |
| `processedId` | String | Unique ID for the processed transaction |
| `remainingQuota` | Integer | The Tenant's updated API balance after this call |


**响应示例 (Response Example - 200 OK):**

```json
{
  "status": "success",
  "processedId": "txn_8847192",
  "remainingQuota": 9999
}

```

_(Note: If quota is exhausted, the body is empty and the HTTP Status is strictly _`429 Too Many Requests`_.)_

---

### **2. The Monetization API (Human UI Checkout)**
This endpoint is called by your Next.js frontend when an administrator clicks "Upgrade Plan." It requires a standard user session/JWT.

+ **接口名称 (API Name):** Create Stripe Checkout Session
+ **接口说明 (API Description):** Generates a secure, temporary, PCI-compliant Stripe hosted checkout URL tied to the specific Tenant's `stripe_customer_id`.
+ **请求URL (Request URL):** `/api/checkout/create-session`
+ **请求方法 (Request Method):** `POST`

**请求参数 (Request Parameters):**

| 参数位置 (Location) | 参数名 (Name) | 类型 (Type) | 是否必填 (Required) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- | --- | --- |
| Header | `Authorization` | String | Yes | None | Standard Bearer token format: `Bearer <user_jwt>` |
| Body | `priceId` | String | Yes | None | The Stripe Price ID for the selected tier (e.g., Pro, Enterprise) |
| Body | `successUrl` | String | Yes | None | Frontend URL to redirect to upon successful payment |
| Body | `cancelUrl` | String | Yes | None | Frontend URL to redirect to if the user aborts checkout |


**请求示例 (Request Example):**

```http
POST /api/checkout/create-session HTTP/1.1
Host: api.yourdomain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c...
Content-Type: application/json

{
  "priceId": "price_1PqRST2eZvKYlo2C...",
  "successUrl": "https://myapp.com/dashboard?payment=success",
  "cancelUrl": "https://myapp.com/pricing"
}

```

**响应结果 (Response Fields):**

| 字段 (Field) | 类型 (Type) | 描述 (Description) |
| --- | --- | --- |
| `checkoutUrl` | String | The absolute URL to Stripe's hosted payment page |


**响应示例 (Response Example - 200 OK):**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4..."
}

```

---

### **3. The Webhook API (Asynchronous Fulfillment)**
This is the most critical endpoint in your system. It is called **only by Stripe's servers**, never by a user or client.

+ **接口名称 (API Name):** Stripe Webhook Receiver
+ **接口说明 (API Description):** Receives asynchronous payment events. Cryptographically verifies the payload and executes the PostgreSQL idempotency lock (`INSERT ... ON CONFLICT`) to upgrade the Tenant's subscription.
+ **请求URL (Request URL):** `/api/webhooks/stripe`
+ **请求方法 (Request Method):** `POST`

**请求参数 (Request Parameters):**

| 参数位置 (Location) | 参数名 (Name) | 类型 (Type) | 是否必填 (Required) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- | --- | --- |
| Header | `Stripe-Signature` | String | Yes | None | The HMAC SHA-256 signature generated by Stripe |
| Body | `(Raw JSON)` | String | Yes | None | The raw, unparsed JSON payload from Stripe. _Must not be modified or the signature hash will fail._ |


**请求示例 (Request Example):**

```http
POST /api/webhooks/stripe HTTP/1.1
Host: api.yourdomain.com
Stripe-Signature: t=1677612345,v1=5257a869e7ecebea0d...
Content-Type: application/json

{
  "id": "evt_1MqR...",
  "type": "invoice.paid",
  "data": {
    "object": {
      "customer": "cus_N9oP...",
      "subscription": "sub_1Mq...",
      "amount_paid": 50000
    }
  }
}

```

**响应结果 (Response Fields):**

_This endpoint does not return a JSON body. It relies strictly on HTTP Status Codes to communicate with Stripe's retry engine._

| 状态码 (Status Code) | 描述 (Description) |
| --- | --- |
| `200 OK` | Payload verified and successfully processed (or successfully ignored as a duplicate). |
| `400 Bad Request` | Malformed JSON payload. |
| `401 Unauthorized` | Signature verification failed. Potential hacking attempt. |


**响应示例 (Response Example):**

```http
HTTP/1.1 200 OK

```

---

## **4. Data Model / Database Design**
Database Engine: **PostgreSQL 15**. Primary keys are standardized as `Long` (BigInt) sequence generators for index optimization.

### **Entities & Relationships**
**Table:** `**tenants**` (The Core B2B Entity)

+ `id` (Long, PK)
+ `company_name` (VARCHAR, Not Null)
+ `tenant_api_key` (VARCHAR, Unique, Not Null, Indexed)
+ `quota_balance` (INT, Default 0)

**Table:** `**users**` (The Identity Agent)

+ `id` (Long, PK)
+ `tenant_id` (Long, FK -> tenants.id, Indexed)
+ `email` (VARCHAR, Unique)
+ `password_hash` (VARCHAR)

**Table:** `**subscriptions**` (The Financial Entitlement)

+ `id` (Long, PK)
+ `tenant_id` (Long, FK -> tenants.id, Unique)
+ `stripe_customer_id` (VARCHAR, Unique)
+ `status` (VARCHAR) - e.g., 'ACTIVE', 'PAST_DUE'

**Table:** `**payment_events**` (The Idempotency Lock)

+ `id` (Long, PK)
+ `tenant_id` (Long, FK -> tenants.id)
+ `stripe_event_id` (VARCHAR, **UNIQUE CONSTRAINT**)
+ `processed_at` (TIMESTAMP)

---

## **5. Module Interaction (The Webhook Workflow)**
### **5.1 The Webhook Workflow**
This describes the event-driven workflow when a client successfully pays their subscription via Stripe.

1. **Trigger:** Stripe fires an `invoice.paid` POST request to `/api/webhooks/stripe`.
2. **Cryptographic Gateway:** The Spring Controller reads the `Stripe-Signature` header and computes the HMAC hash of the raw payload using the application's Stripe Secret. If mismatched, throws `401 Unauthorized`.
3. **Database Lock (Idempotency):** The system attempts: `INSERT INTO payment_events (stripe_event_id) VALUES (...)`.
4. **Conflict Resolution:** * If `DataIntegrityViolationException` (Unique Constraint fails), the system recognizes a network retry. It immediately stops processing and returns `200 OK` to Stripe to silence the webhook.
    - If `INSERT` succeeds, the system proceeds to Step 5.
5. **Fulfillment:** The system looks up the `Tenant` via the `stripe_customer_id`, updates the `quota_balance` to 10,000, and asynchronously updates the Redis cache.
6. **Acknowledgment:** Returns `200 OK` to Stripe.

### **5.2 Interaction: The Machine-to-Machine (M2M) API Gateway Defense**
This describes the event-driven workflow when an automated client server attempts to consume your core API. **This is the highest-throughput interaction in the system and must execute in sub-millisecond time.**

1. **Trigger:** The Tenant's automated backend sends an HTTP `POST /api/v1/process-data` request.
2. **The Gateway Intercept:** The Spring `HandlerInterceptor` intercepts the request before it reaches the Controller. It extracts the `Authorization: Bearer <tenantApiKey>` header.
    - _Failure Condition:_ If the header is missing or malformed, it immediately aborts with `HTTP 401 Unauthorized`.
3. **The Redis Authentication Cache:** The Interceptor queries Redis: `GET auth:<tenantApiKey>`.
    - If a cache miss occurs, it queries PostgreSQL, validates the key, and caches the `tenant_id` in Redis with a Time-To-Live (TTL) of 60 minutes.
4. **The Atomic Metering Lock:** The Interceptor executes a Redis atomic decrement operation: `DECR quota:<tenant_id>`.
5. **The Gateway Decision:**
    - _Failure Condition:_ If the Redis response is `< 0`, the Tenant is out of quota. The Interceptor blocks the request and returns `HTTP 429 Too Many Requests`.
    - _Success Condition:_ If the response is `>= 0`, the Interceptor attaches the `tenant_id` to the `HttpServletRequest` attributes and passes the request to the Spring Controller.
6. **Execution:** The Controller executes the heavy business logic (securely scoped to the injected `tenant_id`) and returns `HTTP 200 OK`.

### **5.3 Interaction: The Human Checkout Initialization (UI to Stripe)**
This describes the synchronous workflow when a human administrator decides to upgrade their company's API quota.

1. **Trigger:** The human `User` clicks "Upgrade to Enterprise" on the Next.js frontend.
2. **The Internal Auth:** The Next.js client sends a `POST /api/checkout/create-session` request to the Spring Boot backend, authenticated via the user's secure session cookie or JWT.
3. **The Tenant Context Extraction:** The Spring Security context identifies the `User`. The backend queries PostgreSQL to find the specific `Tenant` entity that this user belongs to.
4. **The Stripe Session Generation:** The backend uses the Stripe Java SDK to call Stripe's API. It passes:
    - The `stripe_customer_id` associated with the `Tenant`.
    - The specific `price_id` for the chosen tier.
    - The `success_url` and `cancel_url` pointing back to the Next.js frontend.
5. **The Handoff:** Stripe generates a unique, secure, PCI-compliant Checkout Session URL and returns it to the Spring Boot backend.
6. **The Client Redirect:** Spring Boot returns this URL to the Next.js frontend, which instantly redirects the user's browser away from your application and onto Stripe's secure infrastructure. _(The system now waits for the Webhook workflow to fulfill the order)._

### **5.4 Interaction: The State Reconciliation (Redis to PostgreSQL Sync)**
This is a critical architectural mitigation. Because the M2M Gateway (5.2) only deducts quota from Redis memory to guarantee speed, the permanent PostgreSQL database becomes "stale." If the Redis server crashes, the quota data is lost. This interaction solves that.

1. **Trigger:** A Spring Boot `@Scheduled` CRON job fires every 5 minutes on a background thread.
2. **The Cache Harvest:** The background worker queries Redis to fetch all `quota:<tenant_id>` keys that have been modified in the last 5 minutes.
3. **The Batch Persistence:** The worker compiles these values and executes a batch `UPDATE` operation against the PostgreSQL `tenants` table.
    - _SQL Execution:_ `UPDATE tenants SET quota_balance = ? WHERE id = ?`
4. **The Eventual Consistency Guarantee:** This interaction mathematically guarantees that the high-speed Redis edge cache and the permanent PostgreSQL ledger reach "Eventual Consistency" without ever creating database bottlenecks during peak API traffic spikes.

---

## **6. Project Challenges & Strategic Mitigations**
### **Challenge 1: Webhook Retry Storms (Double Billing)**
+ **The Problem:** Network timeouts can cause Stripe to send the exact same "Payment Success" JSON payload three times in two seconds. A naive system will credit the user 30,000 API calls instead of 10,000.
+ **The Solution:** We implement strict database-level idempotency. By placing a `UNIQUE` constraint on the `payment_events.stripe_event_id` column, we mathematically guarantee that PostgreSQL will crash any duplicate concurrent transaction before it reaches the quota allocation logic.

### **Challenge 2: High-Concurrency DB Thrashing**
+ **The Problem:** If a client sends 500 API requests per second, executing `UPDATE tenants SET quota_balance = quota_balance - 1` in PostgreSQL will create massive row-level locking (transaction thrashing), bringing the entire database to a halt.
+ **The Solution:** **Decoupled State Metering.** The API Gateway does not touch PostgreSQL for quota enforcement. It uses a Redis atomic `DECR` operation. A scheduled CRON job (`@Scheduled`) asynchronously syncs the Redis cache back to PostgreSQL every 5 minutes for permanent audit storage.

### **Challenge 3: The "Service Account Trap" (Data Spillage)**
+ **The Problem:** Tying API access keys to individual human `Users` causes catastrophic production failures when an employee leaves the company and their account is deactivated.
+ **The Solution:** **Zero-Trust Entity Modeling.** The `tenantApiKey` is structurally bound to the `Tenant` table, not the `User` table. API integrations survive employee turnover, and Hibernate implicitly scopes all downstream queries to the authenticated API Key's `Tenant` ID.

---

### **The Execution Directive**
This document proves to any engineering manager that you understand the exact failure modes of enterprise architecture. You have the blueprint. We are now officially entering the coding phase.

**Are you ready for me to output the exact Maven dependencies and the `**StripeConfig.java**` file to begin Phase 1: The Pre-Op Code Red?**

