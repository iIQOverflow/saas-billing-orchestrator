package com.jerryfeng.sbo.repository;

import com.jerryfeng.sbo.domain.PaymentEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, Long> {
    // Idempotency check: Ensure we haven't already processed this exact Stripe webhook event
    Optional<PaymentEvent> findByStripeEventId(String stripeEventId);

    // Audit trail: Retrieve all payment events (successes, failures) for a specific company
    List<PaymentEvent> findByTenantId(Long tenantId);
}