package com.jyf.sbo.dto;

public record ProcessDataResponse(
    String status,
    String processedId,
    Long remainingQuota
) {
}
