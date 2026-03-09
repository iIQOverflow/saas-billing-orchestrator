package com.jerryfeng.sbo.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
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

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
        @RequestHeader("Stripe-Signature") String sigHeader,
        @RequestBody String payload) { // MUST be a raw String for cryptographic hashing

        Event event;

        try {
            // 1. Strict Cryptographic Verification
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            log.error("CRITICAL SECURITY: Invalid Stripe signature detected. Possible spoofing attack.", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        } catch (Exception e) {
            log.error("CRITICAL FATAL: Webhook payload parsing failed.", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        // 2. Event Routing
        log.info("Secure Webhook received! Type: {}", event.getType());

        if ("checkout.session.completed".equals(event.getType())) {
            // Deserialize the nested object safely
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);

            if (session != null) {
                log.info("B2B Payment Authorized for Session ID: {}", session.getId());
                log.info("Customer ID: {}", session.getCustomer());

                // ARCHITECTURAL PLACEHOLDER: The Idempotency Lock
                // Here is where we will write the PostgreSQL INSERT ON CONFLICT logic
                // to update the Tenant's quota securely.
            }
        } else {
            log.info("Unhandled event type: {}", event.getType());
        }

        // 3. Mandatory Fast Acknowledgment (Prevent Retry Storms)
        return ResponseEntity.ok("Success");
    }
}