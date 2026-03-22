package com.jyf.sbo.metering;

import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.repository.TenantRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!test")
public class TenantQuotaReconciliationScheduler {

    private static final Logger log = LoggerFactory.getLogger(TenantQuotaReconciliationScheduler.class);

    private final RedisQuotaService redisQuotaService;
    private final TenantRepository tenantRepository;

    public TenantQuotaReconciliationScheduler(RedisQuotaService redisQuotaService,
                                              TenantRepository tenantRepository) {
        this.redisQuotaService = redisQuotaService;
        this.tenantRepository = tenantRepository;
    }

    @Scheduled(fixedDelayString = "${quota.reconciliation.fixed-delay-ms:300000}")
    @Transactional
    public void reconcileDirtyTenantQuotas() {
        Set<Long> dirtyTenantIds = redisQuotaService.getDirtyTenantIds();
        if (dirtyTenantIds.isEmpty()) {
            return;
        }

        List<Tenant> tenantsToSave = new ArrayList<>();
        Set<Long> reconciledIds = new HashSet<>();

        for (Tenant tenant : tenantRepository.findAllById(dirtyTenantIds)) {
            Optional<Long> quota = redisQuotaService.getQuota(tenant.getId());
            if (quota.isEmpty()) {
                continue;
            }

            tenant.setQuotaBalance(quota.get());
            tenantsToSave.add(tenant);
            reconciledIds.add(tenant.getId());
        }

        if (!tenantsToSave.isEmpty()) {
            tenantRepository.saveAll(tenantsToSave);
        }

        redisQuotaService.removeDirtyTenantIds(reconciledIds);
        log.info("Quota reconciliation completed. syncedTenants={}", reconciledIds.size());
    }
}
