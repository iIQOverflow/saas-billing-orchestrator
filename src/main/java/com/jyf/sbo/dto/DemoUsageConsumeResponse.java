package com.jyf.sbo.dto;

public record DemoUsageConsumeResponse(
    String status,
    DashboardSummaryResponse.QuotaSummary quota
) {
}
