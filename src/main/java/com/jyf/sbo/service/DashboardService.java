package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.DashboardSummaryResponse;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import com.jyf.sbo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanCatalogService planCatalogService;

    public DashboardService(UserRepository userRepository,
                            TenantRepository tenantRepository,
                            SubscriptionRepository subscriptionRepository,
                            PlanCatalogService planCatalogService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planCatalogService = planCatalogService;
    }

    public DashboardSummaryResponse getSummary(Long userId, Long tenantId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!tenantId.equals(user.getTenant().getId())) {
            throw new IllegalArgumentException("User tenant mismatch");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found for tenant"));

        long total = subscription.getQuotaTotal();
        long remaining = tenant.getQuotaBalance();
        long used = Math.max(0L, total - remaining);
        int usagePercent = total <= 0 ? 0 : (int) ((used * 100.0d) / total);
        PlanCode currentPlan = subscription.getPlanCode();

        return new DashboardSummaryResponse(
            new DashboardSummaryResponse.TenantSummary(tenant.getCompanyName()),
            new DashboardSummaryResponse.SubscriptionSummary(currentPlan.name(), subscription.getStatus()),
            new DashboardSummaryResponse.QuotaSummary(total, remaining, used, usagePercent),
            planCatalogService.getPlans(currentPlan)
        );
    }
}
