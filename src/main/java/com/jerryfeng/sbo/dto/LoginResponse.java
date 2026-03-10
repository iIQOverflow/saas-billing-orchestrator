package com.jerryfeng.sbo.dto;

public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    Long userId,
    Long tenantId
) {
}
