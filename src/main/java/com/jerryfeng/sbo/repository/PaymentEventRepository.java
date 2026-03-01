package com.jerryfeng.sbo.repository;
import com.jerryfeng.sbo.domain.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, Long> {
    boolean existsByStripeEventId(String stripeEventId);
}