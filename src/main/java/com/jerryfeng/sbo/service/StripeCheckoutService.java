package com.jerryfeng.sbo.service;

import com.jerryfeng.sbo.dto.CheckoutRequest;
import com.jerryfeng.sbo.dto.CheckoutResponse;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class StripeCheckoutService {

    private static final Logger log = LoggerFactory.getLogger(StripeCheckoutService.class);

    // Injected Dependency: No static global state
    private final StripeClient stripeClient;

    public StripeCheckoutService(StripeClient stripeClient) {
        this.stripeClient = stripeClient;
    }

    public CheckoutResponse createCheckoutSession(CheckoutRequest request) {
        try {
            // The modern Builder pattern for Stripe payloads
            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPrice(request.priceId())
                        .build()
                )
                .build();

            // Using the new Service-Based SDK Pattern
            Session session = stripeClient.v1().checkout().sessions().create(params);

            log.info("Successfully generated Thread-Safe Stripe Checkout Session: {}", session.getId());
            return new CheckoutResponse(session.getUrl());

        } catch (StripeException e) {
            log.error("CRITICAL: Failed to communicate with Stripe API", e);
            throw new RuntimeException("Payment service is currently unavailable.", e);
        }
    }
}