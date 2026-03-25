package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.metering.RedisQuotaService;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StripeWebhookService {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookService.class);
    private static final String INVOICE_PAID_EVENT = "invoice.paid";
    private static final String PLAN_CODE_METADATA_KEY = "planCode";

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final RedisQuotaService redisQuotaService;
    private final PaymentIdempotencyService idempotencyService; // Inject the barrier
    private final PlanCatalogService planCatalogService;

    public StripeWebhookService(SubscriptionRepository subscriptionRepository,
                                TenantRepository tenantRepository,
                                RedisQuotaService redisQuotaService,
                                PaymentIdempotencyService idempotencyService,
                                PlanCatalogService planCatalogService) {
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.redisQuotaService = redisQuotaService;
        this.idempotencyService = idempotencyService;
        this.planCatalogService = planCatalogService;
    }

    @Transactional
    public void handleEvent(Event event) {
        if (!INVOICE_PAID_EVENT.equals(event.getType())) {
            return;
        }

        Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new IllegalArgumentException("Unable to deserialize payload"));

        PlanCode purchasedPlanCode = resolvePurchasedPlanCode(invoice);
        Long canonicalQuotaTotal = resolveCanonicalQuotaTotal(purchasedPlanCode);

        Subscription subscription = subscriptionRepository.findByStripeCustomerId(invoice.getCustomer())
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        // 1. Attempt to acquire the database lock
        if (!idempotencyService.acquireLock(event, subscription)) {
            // Lock failed (duplicate). Return gracefully so the Controller sends 200 OK.
            return;
        }

        // 2. Lock acquired (first time seeing this event). Safely update the money.
        applyCanonicalPlanValues(subscription, purchasedPlanCode, canonicalQuotaTotal);
    }

    private PlanCode resolvePurchasedPlanCode(Invoice invoice) {
        Map<String, String> metadata = extractSubscriptionMetadata(invoice);
        String rawPlanCode = metadata.get(PLAN_CODE_METADATA_KEY);
        if (rawPlanCode == null || rawPlanCode.isBlank()) {
            throw new IllegalStateException("Missing Stripe subscription metadata planCode");
        }

        try {
            return PlanCode.fromRequest(rawPlanCode);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Invalid Stripe subscription metadata planCode: " + rawPlanCode, ex);
        }
    }

    private Map<String, String> extractSubscriptionMetadata(Invoice invoice) {
        Invoice.Parent parent = invoice.getParent();
        if (parent == null || parent.getSubscriptionDetails() == null || parent.getSubscriptionDetails().getMetadata() == null) {
            throw new IllegalStateException("Missing Stripe subscription metadata planCode");
        }

        return parent.getSubscriptionDetails().getMetadata();
    }

    private Long resolveCanonicalQuotaTotal(PlanCode purchasedPlanCode) {
        if (purchasedPlanCode == PlanCode.FREE) {
            throw new IllegalStateException("FREE plan is invalid for paid Stripe fulfillment");
        }

        return planCatalogService.getQuotaTotal(purchasedPlanCode);
    }

    private void applyCanonicalPlanValues(Subscription subscription, PlanCode purchasedPlanCode, Long canonicalQuotaTotal) {
        Tenant tenant = subscription.getTenant();

        subscription.setPlanCode(purchasedPlanCode);
        subscription.setQuotaTotal(canonicalQuotaTotal);
        subscription.setQuotaUsed(0L);
        subscription.setStatus("ACTIVE");
        tenant.setQuotaBalance(canonicalQuotaTotal);

        tenantRepository.save(tenant);
        subscriptionRepository.save(subscription);

        redisQuotaService.setQuota(tenant.getId(), canonicalQuotaTotal);
        log.info(
            "Invoice fulfillment completed. tenantId={} planCode={} quota={}",
            tenant.getId(),
            purchasedPlanCode,
            canonicalQuotaTotal
        );
    }
}
