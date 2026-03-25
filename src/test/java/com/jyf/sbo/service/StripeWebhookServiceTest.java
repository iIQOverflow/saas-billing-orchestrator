package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.metering.RedisQuotaService;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StripeWebhookServiceTest {

    private static final String TEST_PLUS_PRICE_ID = "price_plus_test";
    private static final String TEST_PRO_PRICE_ID = "price_pro_test";

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private RedisQuotaService redisQuotaService;

    @Mock
    private PaymentIdempotencyService idempotencyService;

    private StripeWebhookService stripeWebhookService;

    @BeforeEach
    void setUp() {
        PlanCatalogService planCatalogService = new PlanCatalogService(TEST_PLUS_PRICE_ID, TEST_PRO_PRICE_ID);
        stripeWebhookService = new StripeWebhookService(
            subscriptionRepository,
            tenantRepository,
            redisQuotaService,
            idempotencyService,
            planCatalogService
        );
    }

    @Test
    void handleEventInvoicePaidWithPlusMetadataCanonicalizesPersistedValues() {
        Subscription subscription = createSubscription(PlanCode.PRO, 10L, 7L, 3L);
        Event event = createInvoicePaidEvent(createInvoice("cus_123", Map.of("planCode", "PLUS")));

        when(subscriptionRepository.findByStripeCustomerId("cus_123")).thenReturn(Optional.of(subscription));
        when(idempotencyService.acquireLock(event, subscription)).thenReturn(true);

        stripeWebhookService.handleEvent(event);

        assertThat(subscription.getPlanCode()).isEqualTo(PlanCode.PLUS);
        assertThat(subscription.getQuotaTotal()).isEqualTo(100L);
        assertThat(subscription.getQuotaUsed()).isZero();
        assertThat(subscription.getStatus()).isEqualTo("ACTIVE");
        assertThat(subscription.getTenant().getQuotaBalance()).isEqualTo(100L);
        verify(tenantRepository).save(subscription.getTenant());
        verify(subscriptionRepository).save(subscription);
        verify(redisQuotaService).setQuota(subscription.getTenant().getId(), 100L);
    }

    @Test
    void handleEventInvoicePaidWithProMetadataCanonicalizesPersistedValues() {
        Subscription subscription = createSubscription(PlanCode.PLUS, 100L, 55L, 40L);
        Event event = createInvoicePaidEvent(createInvoice("cus_123", Map.of("planCode", "PRO")));

        when(subscriptionRepository.findByStripeCustomerId("cus_123")).thenReturn(Optional.of(subscription));
        when(idempotencyService.acquireLock(event, subscription)).thenReturn(true);

        stripeWebhookService.handleEvent(event);

        assertThat(subscription.getPlanCode()).isEqualTo(PlanCode.PRO);
        assertThat(subscription.getQuotaTotal()).isEqualTo(1000L);
        assertThat(subscription.getQuotaUsed()).isZero();
        assertThat(subscription.getStatus()).isEqualTo("ACTIVE");
        assertThat(subscription.getTenant().getQuotaBalance()).isEqualTo(1000L);
        verify(tenantRepository).save(subscription.getTenant());
        verify(subscriptionRepository).save(subscription);
        verify(redisQuotaService).setQuota(subscription.getTenant().getId(), 1000L);
    }

    @Test
    void handleEventInvoicePaidMissingPlanCodeMetadataFailsClearly() {
        Event event = createInvoicePaidEvent(createInvoice("cus_123", Map.of()));

        assertThatThrownBy(() -> stripeWebhookService.handleEvent(event))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Missing Stripe subscription metadata planCode");

        verifyNoInteractions(subscriptionRepository, tenantRepository, redisQuotaService, idempotencyService);
    }

    @Test
    void handleEventInvoicePaidInvalidPlanCodeMetadataFailsClearly() {
        Event event = createInvoicePaidEvent(createInvoice("cus_123", Map.of("planCode", "ENTERPRISE")));

        assertThatThrownBy(() -> stripeWebhookService.handleEvent(event))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Invalid Stripe subscription metadata planCode")
            .hasMessageContaining("ENTERPRISE");

        verifyNoInteractions(subscriptionRepository, tenantRepository, redisQuotaService, idempotencyService);
    }

    @Test
    void handleEventInvoicePaidFreePlanCodeMetadataFailsClearly() {
        Event event = createInvoicePaidEvent(createInvoice("cus_123", Map.of("planCode", "FREE")));

        assertThatThrownBy(() -> stripeWebhookService.handleEvent(event))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("FREE")
            .hasMessageContaining("paid Stripe fulfillment");

        verifyNoInteractions(subscriptionRepository, tenantRepository, redisQuotaService, idempotencyService);
    }

    private Event createInvoicePaidEvent(Invoice invoice) {
        Event event = mock(Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);

        when(event.getType()).thenReturn("invoice.paid");
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(invoice));

        return event;
    }

    private Invoice createInvoice(String stripeCustomerId, Map<String, String> metadata) {
        Invoice invoice = new Invoice();
        invoice.setId("in_123");
        invoice.setCustomer(stripeCustomerId);

        Invoice.Parent parent = new Invoice.Parent();
        Invoice.Parent.SubscriptionDetails subscriptionDetails = new Invoice.Parent.SubscriptionDetails();
        subscriptionDetails.setMetadata(metadata);
        parent.setSubscriptionDetails(subscriptionDetails);
        invoice.setParent(parent);

        return invoice;
    }

    private Subscription createSubscription(PlanCode localPlanCode,
                                            Long quotaTotal,
                                            Long quotaUsed,
                                            Long quotaBalance) {
        Tenant tenant = new Tenant();
        tenant.setId(10L);
        tenant.setCompanyName("Acme");
        tenant.setTenantApiKey("tenant-key");
        tenant.setQuotaBalance(quotaBalance);

        Subscription subscription = new Subscription();
        subscription.setTenant(tenant);
        subscription.setStripeCustomerId("cus_123");
        subscription.setPlanCode(localPlanCode);
        subscription.setQuotaTotal(quotaTotal);
        subscription.setQuotaUsed(quotaUsed);
        subscription.setStatus("PAST_DUE");
        return subscription;
    }
}
