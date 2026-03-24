package com.jyf.sbo.domain;

public enum PlanCode {
    FREE,
    PLUS,
    PRO;

    private static final String REQUEST_ALLOWED_VALUES = "FREE, PLUS, PRO";

    public static PlanCode fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("planCode is required");
        }

        try {
            return PlanCode.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                "Unknown planCode: " + raw + ". Allowed values: " + REQUEST_ALLOWED_VALUES,
                ex
            );
        }
    }

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
