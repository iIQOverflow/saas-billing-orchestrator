package com.jyf.sbo.dto;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(
    @NotBlank(message = "planCode is required")
    String planCode,

    @NotBlank(message = "successUrl is required")
    String successUrl,

    @NotBlank(message = "cancelUrl is required")
    String cancelUrl
) {
}
