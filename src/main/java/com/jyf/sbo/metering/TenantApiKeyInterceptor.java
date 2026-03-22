package com.jyf.sbo.metering;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.io.IOException;

@Component
public class TenantApiKeyInterceptor implements HandlerInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private final M2MGatewayService gatewayService;

    public TenantApiKeyInterceptor(M2MGatewayService gatewayService) {
        this.gatewayService = gatewayService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith(BEARER_PREFIX) || header.length() <= BEARER_PREFIX.length()) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing or invalid API key");
            return false;
        }

        String tenantApiKey = header.substring(BEARER_PREFIX.length()).trim();

        // 1. Resolve Identity
        Long tenantId = gatewayService.resolveTenantId(tenantApiKey).orElse(null);
        if (tenantId == null) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid API key");
            return false;
        }

        // 2. Thread-Safe Quota Consumption
        long remainingQuota;
        try {
            remainingQuota = gatewayService.consumeQuotaSafely(tenantId);
        } catch (Exception ex) {
            response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Quota service unavailable");
            return false;
        }

        // 3. Rate Limit Enforcement
        if (remainingQuota == RedisQuotaService.QUOTA_EXHAUSTED) {
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), "Quota exhausted");
            return false;
        }

        // 4. Request Decoration
        request.setAttribute(RequestAttributes.TENANT_ID, tenantId);
        request.setAttribute(RequestAttributes.REMAINING_QUOTA, remainingQuota);
        return true;
    }
}