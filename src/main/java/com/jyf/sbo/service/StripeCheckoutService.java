package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.dto.CheckoutRequest;
import com.jyf.sbo.dto.CheckoutResponse;
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
    private static final String PLAN_CODE_METADATA_KEY = "planCode";

    private final StripeClient stripeClient;

    public StripeCheckoutService(StripeClient stripeClient) {
        this.stripeClient = stripeClient;
    }

    public CheckoutResponse createCheckoutSession(CheckoutRequest request,
                                                  String stripePriceId,
                                                  String stripeCustomerId,
                                                  Long tenantId,
                                                  PlanCode planCode) {
        try {
            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(stripeCustomerId)
                .setSuccessUrl(request.successUrl())
                .setCancelUrl(request.cancelUrl())
                .setLocale(SessionCreateParams.Locale.EN)
                .putMetadata("tenantId", String.valueOf(tenantId))
                .setSubscriptionData(
                    SessionCreateParams.SubscriptionData.builder()
                        .putMetadata(PLAN_CODE_METADATA_KEY, planCode.name())
                        .build()
                )
                .addLineItem(
                    SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPrice(stripePriceId)
                        .build()
                )
                .build();

            Session session = stripeClient.v1().checkout().sessions().create(params);

            log.info("Checkout session created. sessionId={} tenantId={}", session.getId(), tenantId);
            return new CheckoutResponse(session.getUrl());

        } catch (StripeException e) {
            log.error("Failed to create Stripe checkout session for tenantId={}", tenantId, e);
            throw new IllegalStateException("Payment service is currently unavailable", e);
        }
    }
}
