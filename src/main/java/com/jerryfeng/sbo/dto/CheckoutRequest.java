package com.jerryfeng.sbo.dto;

public record CheckoutRequest(
    String priceId,
    String successUrl,
    String cancelUrl
) {}