package com.jerryfeng.sbo.config;

import com.stripe.StripeClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    @Value("${stripe.secret.key}")
    private String stripeApiKey;

    @Bean
    public StripeClient stripeClient() {
        // Fail-Fast: Block publishable keys (pk_) and nulls before the server even starts
        if (stripeApiKey == null || stripeApiKey.isBlank() || stripeApiKey.startsWith("pk_")) {
            log.error("CRITICAL FATAL: Stripe Secret Key is missing or a Frontend Publishable Key was provided.");
            throw new IllegalStateException("Invalid Stripe API Key configured in environment.");
        }

        log.info("StripeClient Bean Initialized Successfully. Thread-Safe B2B Financial Engine is active.");
        return new StripeClient(stripeApiKey);
    }
}