# Multi-Tenant SaaS API Orchestrator

An enterprise-grade, B2B backend engine designed to power SaaS platforms. This system orchestrates tenant data isolation, automated subscription lifecycles, and real-time API usage metering.

Built with an "Evolutionary Architecture" mindset, the foundation is strictly multi-tenant. It solves the core challenges of modern B2B products: financial data integrity, high-concurrency rate limiting, and cross-tenant security.

## Core Product Features

* **B2B Multi-Tenancy:** The database schema inherently separates identity (`User`) from billing (`Tenant`), ensuring strict data isolation across different corporate clients.
* **Idempotent Billing Engine:** Integrates with Stripe webhooks using robust database constraints to guarantee "exactly-once" payment processing during network retries, completely eliminating duplicate billing risks.
* **High-Throughput Usage Metering:** Utilizes a Redis-backed Spring `HandlerInterceptor` to track and enforce API quotas in milliseconds, protecting system compute resources from abuse.
* **Event-Driven Audit Trails:** Every payment state change is recorded as an immutable `PaymentEvent`, linked directly to the `Tenant` for strict financial compliance.

## Technical Stack

**Core Backend:**
* **Language:** Java 17
* **Framework:** Spring Boot 3 (Web, Data JPA)
* **Database:** PostgreSQL 15 (Relational Data & Idempotency Locks)
* **Caching & Metering:** Redis (In-Memory Rate Limiting)

**External Integrations:**
* **Billing Gateway:** Stripe Java SDK & Webhooks

**Infrastructure:**
* **Containerization:** Docker & Docker Compose

## Architectural Highlights

1. **The "Tenant" as the Source of Truth:**
   Unlike simple B2C applications, subscriptions and API Keys are owned by the `Tenant` (Company), not the individual `User`. This allows seamless scaling as a client adds more employees to their workspace.
2. **Defeating the "Double Charge" (Idempotency):**
   If Stripe sends duplicate `payment_intent.succeeded` events due to network timeouts, the system relies on PostgreSQL unique constraints on the `stripe_event_id` to safely reject the duplicate, returning an `HTTP 200 OK` without double-crediting the tenant's quota.

## Local Development Setup

This project uses Docker Compose to instantly provision the required backing databases.

### Prerequisites
* Java 17+ & Maven
* Docker Desktop
* Stripe Test Account Keys

### Quick Start

1. **Provision Infrastructure:**
   ```bash
   docker-compose up -d