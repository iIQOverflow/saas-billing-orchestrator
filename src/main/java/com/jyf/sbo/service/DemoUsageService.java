package com.jyf.sbo.service;

import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.dto.DashboardSummaryResponse;
import com.jyf.sbo.dto.DemoUsageConsumeResponse;
import com.jyf.sbo.exception.QuotaExceededException;
import com.jyf.sbo.metering.M2MGatewayService;
import com.jyf.sbo.metering.RedisQuotaService;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoUsageService {

    private final M2MGatewayService gatewayService;
    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;

    public DemoUsageService(M2MGatewayService gatewayService,
                            TenantRepository tenantRepository,
                            SubscriptionRepository subscriptionRepository) {
        this.gatewayService = gatewayService;
        this.tenantRepository = tenantRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional
    public DemoUsageConsumeResponse consume(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found for tenant"));

        long remainingQuota = gatewayService.consumeQuotaSafely(tenantId);
        if (remainingQuota == RedisQuotaService.QUOTA_EXHAUSTED) {
            throw new QuotaExceededException("Quota exhausted");
        }
        if (remainingQuota < 0L) {
            throw new IllegalStateException("Unexpected remaining quota state: " + remainingQuota);
        }

        tenant.setQuotaBalance(remainingQuota);
        subscription.setQuotaUsed(calculateUsed(subscription.getQuotaTotal(), remainingQuota));

        tenantRepository.save(tenant);
        subscriptionRepository.save(subscription);

        return new DemoUsageConsumeResponse(
            "success",
            buildQuotaSummary(subscription.getQuotaTotal(), remainingQuota)
        );
    }

    private DashboardSummaryResponse.QuotaSummary buildQuotaSummary(long total, long remaining) {
        long used = calculateUsed(total, remaining);
        int usagePercent = total <= 0 ? 0 : (int) ((used * 100.0d) / total);

        return new DashboardSummaryResponse.QuotaSummary(total, remaining, used, usagePercent);
    }

    private long calculateUsed(long total, long remaining) {
        return Math.max(0L, total - remaining);
    }
}
