package com.jerryfeng.sbo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "subscriptions")
public class Subscription extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String planTier; // e.g., BASIC, PRO, ENTERPRISE

    @Column(nullable = false)
    private Long quotaTotal; // e.g., 10000 API calls

    @Column(nullable = false)
    private Long quotaUsed; // Tracks current usage

    @Column(nullable = false)
    private String status; // e.g., ACTIVE, PAST_DUE, CANCELED

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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