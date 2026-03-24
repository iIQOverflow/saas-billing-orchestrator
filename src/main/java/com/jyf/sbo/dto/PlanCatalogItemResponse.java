package com.jyf.sbo.dto;

public record PlanCatalogItemResponse(
    String planCode,
    String displayName,
    String monthlyPriceLabel,
    long quotaTotal,
    boolean current
) {
}
