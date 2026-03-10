package com.jerryfeng.sbo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tenants")
public class Tenant extends BaseEntity {

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false, unique = true, updatable = false)
    private String tenantApiKey;

    @Column(nullable = false)
    private Long quotaBalance = 0L;

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

    public Long getQuotaBalance() {
        return quotaBalance;
    }

    public void setQuotaBalance(Long quotaBalance) {
        this.quotaBalance = quotaBalance;
    }
}
