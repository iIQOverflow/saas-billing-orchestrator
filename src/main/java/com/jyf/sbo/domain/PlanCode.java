package com.jyf.sbo.domain;

public enum PlanCode {
    FREE,
    PLUS,
    PRO;

    public static PlanCode fromPersistence(String raw) {
        if (raw == null) {
            throw new IllegalStateException("Subscription planTier is null");
        }

        if (raw.isBlank()) {
            throw new IllegalStateException("Subscription planTier is blank");
        }

        try {
            return PlanCode.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Unknown subscription planTier: " + raw, ex);
        }
    }
}
