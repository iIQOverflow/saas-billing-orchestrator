package com.jerryfeng.sbo.security;

import java.security.Principal;

public class AuthenticatedUser implements Principal {

    private final Long userId;
    private final Long tenantId;
    private final String email;

    public AuthenticatedUser(Long userId, Long tenantId, String email) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String getName() {
        return email;
    }
}
