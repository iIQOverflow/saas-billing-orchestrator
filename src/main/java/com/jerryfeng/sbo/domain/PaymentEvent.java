package com.jerryfeng.sbo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_events")
public class PaymentEvent extends BaseEntity {

    // This unique constraint is the secret weapon for Idempotency
    @Column(nullable = false, unique = true)
    private String stripeEventId;

    @Column(nullable = false)
    private String eventType; // e.g., invoice.payment_succeeded

    @Column(nullable = false)
    private String status; // PROCESSED, FAILED

    public String getStripeEventId() {
        return stripeEventId;
    }

    public void setStripeEventId(String stripeEventId) {
        this.stripeEventId = stripeEventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}