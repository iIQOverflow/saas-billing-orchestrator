package com.jyf.sbo.dto;

public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    Long userId,
    Long tenantId
) {
}
