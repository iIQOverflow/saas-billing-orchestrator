package com.jerryfeng.sbo.service;

import com.jerryfeng.sbo.domain.PaymentEvent;
import com.jerryfeng.sbo.domain.Subscription;
import com.jerryfeng.sbo.domain.Tenant;
import com.jerryfeng.sbo.metering.RedisQuotaService;
import com.jerryfeng.sbo.repository.PaymentEventRepository;
import com.jerryfeng.sbo.repository.SubscriptionRepository;
import com.jerryfeng.sbo.repository.TenantRepository;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeWebhookService {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookService.class);
    private static final String INVOICE_PAID_EVENT = "invoice.paid";

    private final PaymentEventRepository paymentEventRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final RedisQuotaService redisQuotaService;

    public StripeWebhookService(PaymentEventRepository paymentEventRepository,
                                SubscriptionRepository subscriptionRepository,
                                TenantRepository tenantRepository,
                                RedisQuotaService redisQuotaService) {
        this.paymentEventRepository = paymentEventRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.redisQuotaService = redisQuotaService;
    }

    @Transactional
    public void handleEvent(Event event) {
        if (!INVOICE_PAID_EVENT.equals(event.getType())) {
            log.info("Webhook ignored. type={}", event.getType());
            return;
        }

        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
            .getObject()
            .orElseThrow(() -> new IllegalArgumentException("Unable to deserialize invoice payload"));

        String customerId = invoice.getCustomer();
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Invoice is missing Stripe customer id");
        }

        Subscription subscription = subscriptionRepository.findByStripeCustomerId(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found for Stripe customer"));

        if (registerPaymentEvent(event, subscription)) {
            applyQuotaReset(subscription);
        }
    }

    private boolean registerPaymentEvent(Event event, Subscription subscription) {
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
            log.info("Duplicate webhook ignored. stripeEventId={}", event.getId());
            return false;
        }
    }

    private void applyQuotaReset(Subscription subscription) {
        Tenant tenant = subscription.getTenant();
        Long updatedQuota = subscription.getQuotaTotal();

        tenant.setQuotaBalance(updatedQuota);
        subscription.setStatus("ACTIVE");
        subscription.setQuotaUsed(0L);

        tenantRepository.save(tenant);
        subscriptionRepository.save(subscription);

        redisQuotaService.setQuota(tenant.getId(), updatedQuota);

        log.info("Invoice fulfillment completed. tenantId={} quota={}", tenant.getId(), updatedQuota);
    }
}
