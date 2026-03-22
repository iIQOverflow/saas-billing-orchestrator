package com.jyf.sbo.controller;

import com.jyf.sbo.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    private final StripeWebhookService stripeWebhookService;

    public WebhookController(StripeWebhookService stripeWebhookService) {
        this.stripeWebhookService = stripeWebhookService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<Void> handleStripeWebhook(
        @RequestHeader("Stripe-Signature") String sigHeader,
        @RequestBody String payload) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            log.error("Invalid Stripe webhook signature", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Failed to parse Stripe webhook payload", e);
            return ResponseEntity.badRequest().build();
        }

        stripeWebhookService.handleEvent(event);
        return ResponseEntity.ok().build();
    }
}
