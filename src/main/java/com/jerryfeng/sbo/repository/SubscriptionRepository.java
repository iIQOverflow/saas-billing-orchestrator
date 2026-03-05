package com.jerryfeng.sbo.repository;

import com.jerryfeng.sbo.domain.Subscription;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    // Core B2B lookup: Find the subscription details for a specific company
    Optional<Subscription> findByTenantId(Long tenantId);

    // Webhook lookup: When Stripe sends a payment event, find the subscription by Stripe's ID
    Optional<Subscription> findByStripeCustomerId(String stripeCustomerId);
}