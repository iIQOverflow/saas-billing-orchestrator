package com.jyf.sbo.dto;

import java.util.List;

public record DashboardSummaryResponse(
    TenantSummary tenant,
    SubscriptionSummary subscription,
    QuotaSummary quota,
    List<PlanCatalogItemResponse> plans
) {

    public record TenantSummary(
        String companyName
    ) {
    }

    public record SubscriptionSummary(
        String planCode,
        String status
    ) {
    }

    public record QuotaSummary(
        long total,
        long remaining,
        long used,
        int usagePercent
    ) {
    }
}
