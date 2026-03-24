package com.jyf.sbo.service;

import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.DashboardSummaryResponse;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import com.jyf.sbo.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Spy
    private PlanCatalogService planCatalogService;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getSummaryHandlesZeroTotalQuota() {
        User user = createUser(100L, 10L, "admin@acme.com");
        Tenant tenant = createTenant(10L, "Acme Inc", "tenant-key", 250L);
        Subscription subscription = createSubscription("FREE", "ACTIVE", 0L, 999L, tenant);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(tenantRepository.findById(10L)).thenReturn(Optional.of(tenant));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));

        DashboardSummaryResponse response = dashboardService.getSummary(100L, 10L);

        assertThat(response.quota().total()).isZero();
        assertThat(response.quota().remaining()).isEqualTo(250L);
        assertThat(response.quota().used()).isZero();
        assertThat(response.quota().usagePercent()).isZero();
        assertThat(response.subscription().planCode()).isEqualTo("FREE");
        assertThat(response.plans())
            .extracting(plan -> plan.planCode() + ":" + plan.current())
            .containsExactly("FREE:true", "PRO:false");
    }

    @Test
    void getSummaryRejectsTenantMismatch() {
        User user = createUser(100L, 99L, "admin@acme.com");

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> dashboardService.getSummary(100L, 10L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User tenant mismatch");

        verifyNoInteractions(tenantRepository, subscriptionRepository);
    }

    private User createUser(Long userId, Long tenantId, String email) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        User user = new User();
        user.setId(userId);
        user.setEmail(email);
        user.setPasswordHash("password-hash");
        user.setTenant(tenant);
        return user;
    }

    private Tenant createTenant(Long tenantId, String companyName, String tenantApiKey, Long quotaBalance) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setCompanyName(companyName);
        tenant.setTenantApiKey(tenantApiKey);
        tenant.setQuotaBalance(quotaBalance);
        return tenant;
    }

    private Subscription createSubscription(String planTier,
                                            String status,
                                            Long quotaTotal,
                                            Long quotaUsed,
                                            Tenant tenant) {
        Subscription subscription = new Subscription();
        subscription.setTenant(tenant);
        subscription.setStripeCustomerId("cus_123");
        subscription.setPlanTier(planTier);
        subscription.setQuotaTotal(quotaTotal);
        subscription.setQuotaUsed(quotaUsed);
        subscription.setStatus(status);
        return subscription;
    }
}
