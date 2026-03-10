package com.jerryfeng.sbo.metering;

import com.jerryfeng.sbo.domain.Tenant;
import com.jerryfeng.sbo.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TenantApiKeyInterceptor implements HandlerInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final Duration AUTH_CACHE_TTL = Duration.ofMinutes(60);

    private final TenantRepository tenantRepository;
    private final RedisQuotaService redisQuotaService;

    public TenantApiKeyInterceptor(TenantRepository tenantRepository, RedisQuotaService redisQuotaService) {
        this.tenantRepository = tenantRepository;
        this.redisQuotaService = redisQuotaService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith(BEARER_PREFIX) || header.length() <= BEARER_PREFIX.length()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing or invalid API key");
            return false;
        }

        String tenantApiKey = header.substring(BEARER_PREFIX.length()).trim();
        Long tenantId = resolveTenantId(tenantApiKey).orElse(null);
        if (tenantId == null) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid API key");
            return false;
        }

        long remainingQuota;
        try {
            remainingQuota = consumeQuotaWithBootstrap(tenantId);
        } catch (RuntimeException ex) {
            response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Quota service unavailable");
            return false;
        }

        if (remainingQuota == RedisQuotaService.QUOTA_EXHAUSTED) {
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), "Quota exhausted");
            return false;
        }

        if (remainingQuota == RedisQuotaService.QUOTA_NOT_INITIALIZED) {
            response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Quota cache unavailable");
            return false;
        }

        request.setAttribute(RequestAttributes.TENANT_ID, tenantId);
        request.setAttribute(RequestAttributes.REMAINING_QUOTA, remainingQuota);
        return true;
    }

    private Optional<Long> resolveTenantId(String tenantApiKey) {
        Optional<Long> cachedTenantId = redisQuotaService.getTenantIdByApiKey(tenantApiKey);
        if (cachedTenantId.isPresent()) {
            return cachedTenantId;
        }

        Optional<Tenant> tenant = tenantRepository.findByTenantApiKey(tenantApiKey);
        tenant.ifPresent(value ->
            redisQuotaService.cacheTenantApiKey(tenantApiKey, value.getId(), AUTH_CACHE_TTL)
        );

        return tenant.map(Tenant::getId);
    }

    private long consumeQuotaWithBootstrap(Long tenantId) {
        long result = redisQuotaService.consumeQuota(tenantId);

        if (result == RedisQuotaService.QUOTA_NOT_INITIALIZED) {
            Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found for id " + tenantId));

            redisQuotaService.initializeQuotaIfMissing(tenantId, tenant.getQuotaBalance());
            result = redisQuotaService.consumeQuota(tenantId);
        }

        return result;
    }
}
