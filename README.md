# SaaS Billing Orchestrator (Full-Stack)

A complete, cloud-native full-stack application designed to manage subscription lifecycles, real-time API rate limiting, and asynchronous payment processing for B2B SaaS platforms.

This project demonstrates an end-to-end product architecture: a modern, interactive frontend dashboard powered by a mission-critical Spring Boot backend. It focuses heavily on financial data integrity, high-concurrency safeguards, and cloud-readiness.

## 🚀 Core Product Features

* **Strict Payment Idempotency (Backend):** Implements unique database constraints to guarantee "Exactly-Once" processing for asynchronous Stripe webhooks, absolutely preventing duplicate billing during network retries.
* **Interactive Quota Simulation (Frontend):** A dynamic UI dashboard allowing users to trigger test API requests, visually demonstrating real-time quota deduction and access denial.
* **High-Throughput Rate Limiter (Backend):** Utilizes Redis to intercept incoming requests and manage API quotas in-memory, ensuring users cannot exceed their purchased compute limits.
* **Event-Driven Decoupling (Backend):** Decouples core billing logic from downstream notification systems (e.g., quota depletion alerts) using message queues to ensure low-latency API responses.

## 🛠️ Technical Stack

**Backend (The Engine):**
* **Language:** Java 17
* **Framework:** Spring Boot 3 (Web, Data JPA, Validation)
* **Database:** PostgreSQL 15
* **Caching & Queues:** Redis, RabbitMQ

**Frontend (The Interface):**
* **Framework:** Vue.js / React (Modern SPA)
* **Styling:** Tailwind CSS / Modern UI Components
* **Integration:** Stripe Elements / Checkout

**DevOps & Infrastructure:**
* **Containerization:** Docker & Docker Compose
* **Cloud Platform:** AWS (EC2, RDS)
* **CI/CD:** GitHub Actions

## 🧠 Architectural Highlights

1. **Handling Stripe Webhooks Safely:**
   Network retries can cause Stripe to send the same `payment_intent.succeeded` event multiple times. This backend uses the `stripe_event_id` as a unique, indexed constraint in PostgreSQL. Duplicate events are safely rejected at the database level, allowing the API to return a `200 OK` without double-crediting the user.
2. **Redis-Backed Interceptors:**
   Instead of querying the SQL database for every single user API request to check their quota, the system caches the remaining quota in Redis. A Spring `HandlerInterceptor` checks this cache in milliseconds, returning an `HTTP 429 Too Many Requests` if the limit is reached.

## 💻 Local Development Setup

This project uses Docker Compose to provision the local infrastructure (Databases and Message Brokers).

### Prerequisites
* Java 17+ & Maven
* Node.js & npm (For Frontend)
* Docker Desktop
* Stripe Test Account

### Quick Start (Backend)

1. **Start the Infrastructure:**
   ```bash
   docker-compose up -d