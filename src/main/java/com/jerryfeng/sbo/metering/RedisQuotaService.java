package com.jerryfeng.sbo.metering;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class RedisQuotaService {

    public static final long QUOTA_EXHAUSTED = -1L;
    public static final long QUOTA_NOT_INITIALIZED = -2L;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> consumeQuotaScript;

    public RedisQuotaService(StringRedisTemplate redisTemplate, DefaultRedisScript<Long> consumeQuotaScript) {
        this.redisTemplate = redisTemplate;
        this.consumeQuotaScript = consumeQuotaScript;
    }

    public Optional<Long> getTenantIdByApiKey(String tenantApiKey) {
        String value = redisTemplate.opsForValue().get(RedisKeys.authKey(tenantApiKey));
        return toLong(value);
    }

    public void cacheTenantApiKey(String tenantApiKey, Long tenantId, Duration ttl) {
        redisTemplate.opsForValue().set(RedisKeys.authKey(tenantApiKey), String.valueOf(tenantId), ttl);
    }

    public Optional<Long> getQuota(Long tenantId) {
        String quota = redisTemplate.opsForValue().get(RedisKeys.quotaKey(tenantId));
        return toLong(quota);
    }

    public void initializeQuotaIfMissing(Long tenantId, Long quota) {
        redisTemplate.opsForValue().setIfAbsent(RedisKeys.quotaKey(tenantId), String.valueOf(quota));
    }

    public void setQuota(Long tenantId, Long quota) {
        redisTemplate.opsForValue().set(RedisKeys.quotaKey(tenantId), String.valueOf(quota));
        markTenantQuotaDirty(tenantId);
    }

    public long consumeQuota(Long tenantId) {
        Long result = redisTemplate.execute(
            consumeQuotaScript,
            List.of(RedisKeys.quotaKey(tenantId), RedisKeys.QUOTA_DIRTY_SET),
            String.valueOf(tenantId)
        );

        return result == null ? QUOTA_NOT_INITIALIZED : result;
    }

    public Set<Long> getDirtyTenantIds() {
        Set<String> members = redisTemplate.opsForSet().members(RedisKeys.QUOTA_DIRTY_SET);
        if (members == null || members.isEmpty()) {
            return Collections.emptySet();
        }

        return members.stream()
            .map(this::toLong)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toSet());
    }

    public void removeDirtyTenantIds(Set<Long> tenantIds) {
        if (tenantIds.isEmpty()) {
            return;
        }

        Object[] ids = tenantIds.stream().map(String::valueOf).toArray();
        redisTemplate.opsForSet().remove(RedisKeys.QUOTA_DIRTY_SET, ids);
    }

    public void markTenantQuotaDirty(Long tenantId) {
        redisTemplate.opsForSet().add(RedisKeys.QUOTA_DIRTY_SET, String.valueOf(tenantId));
    }

    private Optional<Long> toLong(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }
}
