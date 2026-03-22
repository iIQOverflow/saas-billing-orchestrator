package com.jyf.sbo.metering;

public final class RedisKeys {

    public static final String AUTH_PREFIX = "auth:";
    public static final String QUOTA_PREFIX = "quota:";
    public static final String QUOTA_DIRTY_SET = "quota:dirty";

    private RedisKeys() {
    }

    public static String authKey(String tenantApiKey) {
        return AUTH_PREFIX + tenantApiKey;
    }

    public static String quotaKey(Long tenantId) {
        return QUOTA_PREFIX + tenantId;
    }
}
