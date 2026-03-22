package com.jerryfeng.sbo.service;

import com.jerryfeng.sbo.domain.PaymentEvent;
import com.jerryfeng.sbo.domain.Subscription;
import com.jerryfeng.sbo.repository.PaymentEventRepository;
import com.stripe.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class PaymentIdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(PaymentIdempotencyService.class);
    private final PaymentEventRepository paymentEventRepository;

    public PaymentIdempotencyService(PaymentEventRepository paymentEventRepository) {
        this.paymentEventRepository = paymentEventRepository;
    }

    // STRICT ISOLATION: This transaction is completely decoupled from the caller.
    // If it fails, it will not corrupt the parent Hibernate Session.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean acquireLock(Event event, Subscription subscription) {
        PaymentEvent paymentEvent = new PaymentEvent();
        paymentEvent.setStripeEventId(event.getId());
        paymentEvent.setTenant(subscription.getTenant());
        paymentEvent.setEventType(event.getType());
        paymentEvent.setStatus("PROCESSED");
        paymentEvent.setProcessedAt(LocalDateTime.now());

        try {
            paymentEventRepository.saveAndFlush(paymentEvent);
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.info("Idempotency Lock Active: Duplicate webhook blocked safely. stripeEventId={}", event.getId());
            return false;
        }
    }
}