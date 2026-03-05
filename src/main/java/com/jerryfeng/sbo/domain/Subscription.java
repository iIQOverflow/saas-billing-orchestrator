package com.jerryfeng.sbo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "subscriptions")
public class Subscription extends BaseEntity {

    // B2B Standard: The company owns the subscription, not the user.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;

    @Column(nullable = false)
    private String stripeCustomerId; // Links the company to their Stripe profile

    @Column(nullable = false)
    private String planTier;

    @Column(nullable = false)
    private Long quotaTotal;

    @Column(nullable = false)
    private Long quotaUsed;

    @Column(nullable = false)
    private String status;

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public String getStripeCustomerId() {
        return stripeCustomerId;
    }

    public void setStripeCustomerId(String stripeCustomerId) {
        this.stripeCustomerId = stripeCustomerId;
    }

    public String getPlanTier() {
        return planTier;
    }

    public void setPlanTier(String planTier) {
        this.planTier = planTier;
    }

    public Long getQuotaTotal() {
        return quotaTotal;
    }

    public void setQuotaTotal(Long quotaTotal) {
        this.quotaTotal = quotaTotal;
    }

    public Long getQuotaUsed() {
        return quotaUsed;
    }

    public void setQuotaUsed(Long quotaUsed) {
        this.quotaUsed = quotaUsed;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}