package com.jerryfeng.sbo.dto;

public record ProcessDataResponse(
    String status,
    String processedId,
    Long remainingQuota
) {
}
