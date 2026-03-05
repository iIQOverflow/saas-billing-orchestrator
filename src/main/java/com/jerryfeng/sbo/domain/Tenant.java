package com.jerryfeng.sbo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tenants")
public class Tenant extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String companyName;

    // The API key the company uses to access your service
    @Column(nullable = false, unique = true, updatable = false)
    private String tenantApiKey;

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getTenantApiKey() {
        return tenantApiKey;
    }

    public void setTenantApiKey(String tenantApiKey) {
        this.tenantApiKey = tenantApiKey;
    }
}