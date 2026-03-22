package com.jyf.sbo.service;

import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.metering.RedisQuotaService;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeWebhookService {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookService.class);
    private static final String INVOICE_PAID_EVENT = "invoice.paid";

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final RedisQuotaService redisQuotaService;
    private final PaymentIdempotencyService idempotencyService; // Inject the barrier

    public StripeWebhookService(SubscriptionRepository subscriptionRepository,
                                TenantRepository tenantRepository,
                                RedisQuotaService redisQuotaService,
                                PaymentIdempotencyService idempotencyService) {
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.redisQuotaService = redisQuotaService;
        this.idempotencyService = idempotencyService;
    }

    @Transactional
    public void handleEvent(Event event) {
        if (!INVOICE_PAID_EVENT.equals(event.getType())) {
            return;
        }

        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new IllegalArgumentException("Unable to deserialize payload"));

        Subscription subscription = subscriptionRepository.findByStripeCustomerId(invoice.getCustomer())
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        // 1. Attempt to acquire the database lock
        if (!idempotencyService.acquireLock(event, subscription)) {
            // Lock failed (duplicate). Return gracefully so the Controller sends 200 OK.
            return;
        }

        // 2. Lock acquired (first time seeing this event). Safely update the money.
        applyQuotaReset(subscription);
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