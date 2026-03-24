package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.dto.DemoUsageConsumeResponse;
import com.jyf.sbo.exception.QuotaExceededException;
import com.jyf.sbo.metering.M2MGatewayService;
import com.jyf.sbo.metering.RedisQuotaService;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoUsageServiceTest {

    @Mock
    private M2MGatewayService gatewayService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private DemoUsageService demoUsageService;

    @Test
    void consumeDecrementsRemainingQuotaByExactlyOne() {
        Tenant tenant = createTenant(10L, 1000L);
        Subscription subscription = createSubscription(tenant, 1000L, 0L);

        when(tenantRepository.findById(10L)).thenReturn(Optional.of(tenant));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));
        when(gatewayService.consumeQuotaSafely(10L)).thenReturn(999L);

        DemoUsageConsumeResponse response = demoUsageService.consume(10L);

        assertThat(response.status()).isEqualTo("success");
        assertThat(response.quota().remaining()).isEqualTo(999L);
        assertThat(response.quota().used()).isEqualTo(1L);
        assertThat(tenant.getQuotaBalance()).isEqualTo(999L);
        assertThat(subscription.getQuotaUsed()).isEqualTo(1L);
        verify(tenantRepository).save(tenant);
        verify(subscriptionRepository).save(subscription);
    }

    @Test
    void consumeReturnsQuotaSummaryAlignedWithDashboardMath() {
        Tenant tenant = createTenant(10L, 876L);
        Subscription subscription = createSubscription(tenant, 1000L, 124L);

        when(tenantRepository.findById(10L)).thenReturn(Optional.of(tenant));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));
        when(gatewayService.consumeQuotaSafely(10L)).thenReturn(875L);

        DemoUsageConsumeResponse response = demoUsageService.consume(10L);

        assertThat(response.quota().total()).isEqualTo(1000L);
        assertThat(response.quota().remaining()).isEqualTo(875L);
        assertThat(response.quota().used()).isEqualTo(125L);
        assertThat(response.quota().usagePercent()).isEqualTo(12);
    }

    @Test
    void consumeRejectsExhaustedQuota() {
        Tenant tenant = createTenant(10L, 0L);
        Subscription subscription = createSubscription(tenant, 1000L, 1000L);

        when(tenantRepository.findById(10L)).thenReturn(Optional.of(tenant));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));
        when(gatewayService.consumeQuotaSafely(10L)).thenReturn(RedisQuotaService.QUOTA_EXHAUSTED);

        assertThatThrownBy(() -> demoUsageService.consume(10L))
            .isInstanceOf(QuotaExceededException.class)
            .hasMessage("Quota exhausted");

        verify(tenantRepository, never()).save(tenant);
        verify(subscriptionRepository, never()).save(subscription);
    }

    private Tenant createTenant(Long tenantId, Long quotaBalance) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setCompanyName("Acme Inc");
        tenant.setTenantApiKey("tenant-key");
        tenant.setQuotaBalance(quotaBalance);
        return tenant;
    }

    private Subscription createSubscription(Tenant tenant, Long quotaTotal, Long quotaUsed) {
        Subscription subscription = new Subscription();
        subscription.setTenant(tenant);
        subscription.setStripeCustomerId("cus_123");
        subscription.setPlanCode(PlanCode.PRO);
        subscription.setQuotaTotal(quotaTotal);
        subscription.setQuotaUsed(quotaUsed);
        subscription.setStatus("ACTIVE");
        return subscription;
    }
}
