package com.jerryfeng.sbo.metering;

import com.jerryfeng.sbo.domain.Tenant;
import com.jerryfeng.sbo.repository.TenantRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class M2MGatewayService {

    private final RedisQuotaService redisQuotaService;
    private final TenantRepository tenantRepository;

    // Local JVM Lock to prevent the Cache Stampede
    private final ConcurrentHashMap<Long, Object> tenantLocks = new ConcurrentHashMap<>();

    public M2MGatewayService(RedisQuotaService redisQuotaService, TenantRepository tenantRepository) {
        this.redisQuotaService = redisQuotaService;
        this.tenantRepository = tenantRepository;
    }

    public Optional<Long> resolveTenantId(String apiKey) {
        return redisQuotaService.getTenantIdByApiKey(apiKey)
                .or(() -> loadAndCacheTenant(apiKey));
    }

    private Optional<Long> loadAndCacheTenant(String apiKey) {
        return tenantRepository.findByTenantApiKey(apiKey).map(tenant -> {
            redisQuotaService.cacheTenantApiKey(apiKey, tenant.getId(), java.time.Duration.ofMinutes(60));
            return tenant.getId();
        });
    }

    public long consumeQuotaSafely(Long tenantId) {
        long result = redisQuotaService.consumeQuota(tenantId);

        if (result == RedisQuotaService.QUOTA_NOT_INITIALIZED) {
            // Anti-Stampede Mechanism: Only ONE thread per tenant is allowed to hit Postgres
            Object lock = tenantLocks.computeIfAbsent(tenantId, k -> new Object());
            synchronized (lock) {
                // Double-checked locking
                result = redisQuotaService.consumeQuota(tenantId);
                if (result == RedisQuotaService.QUOTA_NOT_INITIALIZED) {
                    Tenant tenant = tenantRepository.findById(tenantId)
                            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
                    redisQuotaService.initializeQuotaIfMissing(tenantId, tenant.getQuotaBalance());
                    result = redisQuotaService.consumeQuota(tenantId);
                }
            }
            // Free the lock reference to prevent memory leaks
            tenantLocks.remove(tenantId);
        }
        return result;
    }
}