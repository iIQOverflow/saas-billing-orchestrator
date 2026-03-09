package com.jerryfeng.sbo.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Enterprise Configuration for the Stripe SDK.
 * Binds environment variables to the global Stripe context on application startup.
 */
@Configuration
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @PostConstruct
    public void initStripe() {
        // 1. Fail-Fast Validation: Never let the app start if the financial engine is broken
        if (stripeApiKey == null || stripeApiKey.isBlank() || stripeApiKey.contains("YOUR_TEST_KEY")) {
            log.error("CRITICAL FATAL: Stripe API Key is missing or invalid.");
            log.error("The application cannot process B2B transactions. Shutting down.");
            throw new IllegalStateException("Invalid Stripe API Key configured in environment.");
        }

        // 2. Global SDK Initialization
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe SDK Initialized Successfully. B2B Financial Engine is active.");
    }
}