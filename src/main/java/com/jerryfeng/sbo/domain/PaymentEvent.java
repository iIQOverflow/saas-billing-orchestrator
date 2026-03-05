package com.jerryfeng.sbo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_events")
public class PaymentEvent extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String stripeEventId;

    // Audit Trail: Which company generated this payment event?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String status;
}