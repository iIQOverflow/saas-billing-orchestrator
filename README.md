# SaaS Billing Orchestrator

A cloud-native, event-driven billing and quota management engine designed for B2B SaaS platforms. This service bridges the gap between raw system usage and financial reconciliation, ensuring that API calls are metered and payments are processed with strict idempotency.

## 🚀 Core Features

* **Strict Idempotency:** Implements unique database constraints and distributed locking to guarantee "Exactly-Once" processing for asynchronous Stripe payment webhooks, preventing duplicate billing.
* **High-Throughput Quota Engine:** Manages subscription tiers and API rate limits, ensuring users cannot exceed their purchased compute/API allowances.
* **Event-Driven Architecture:** Decouples core billing logic from downstream notification systems (e.g., email alerts for low quotas) using message queues to ensure high availability and low latency.
* **Cloud-Native Ready:** Fully containerized for seamless deployment to AWS (EC2/ECS) with managed RDS.

## 🛠️ Tech Stack

* **Language:** Java 17
* **Framework:** Spring Boot 3 (Web, Data JPA, Validation)
* **Database:** PostgreSQL 15
* **Messaging/Caching:** RabbitMQ / Redis (Local), AWS SQS / ElastiCache (Production)
* **External Integrations:** Stripe API (Billing & Subscriptions)
* **DevOps:** Docker, Docker Compose, GitHub Actions

## 🧠 Key Engineering Decisions

1. **Why PostgreSQL?** Financial transactions and subscription states require strict ACID compliance. PostgreSQL provides the necessary transactional guarantees and robust constraint checking required for the webhook idempotency layer.
2. **Handling Stripe Webhooks Safely:**
   Network retries can cause Stripe to send the same `payment_intent.succeeded` event multiple times. This system uses the `stripe_event_id` as a unique, indexed constraint in the database. If a duplicate event arrives, the database rejects the insertion, allowing the API to safely return a `200 OK` to Stripe without double-crediting the user's account.
3. **Decoupling via Message Queues:**
   When a payment fails or a quota runs low, the system does not block the main thread to send an email. Instead, it publishes a `QuotaLowEvent` to a message broker. A separate consumer handles the third-party email API, significantly improving the response time of the primary orchestrator.

## 💻 Local Development Setup

This project uses Docker Compose to provision the local infrastructure, eliminating the need for manual database installations.

### Prerequisites
* Java 17+
* Maven 3.8+
* Docker Desktop

### Quick Start

1. **Start the Infrastructure:**
   Run the following command in the project root to spin up PostgreSQL, Redis, and RabbitMQ.
   `docker-compose up -d`

2. **Configure Environment:**
   Ensure your `src/main/resources/application.properties` points to the local Docker instances (default configuration is provided).

3. **Run the Application:**
   `./mvnw spring-boot:run`

The application will start on `http://localhost:8080`.

## 🧪 Testing

Test coverage focuses heavily on the Service layer and Webhook controllers to ensure financial logic remains intact.

`./mvnw test`