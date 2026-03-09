package com.jerryfeng.sbo.controller;

import com.jerryfeng.sbo.dto.CheckoutRequest;
import com.jerryfeng.sbo.dto.CheckoutResponse;
import com.jerryfeng.sbo.service.StripeCheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final StripeCheckoutService checkoutService;

    // Constructor Injection (Strictly preferred over @Autowired field injection)
    public CheckoutController(StripeCheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/create-session")
    public ResponseEntity<CheckoutResponse> createSession(@RequestBody CheckoutRequest request) {
        // Basic input validation
        if (request.priceId() == null || request.priceId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        CheckoutResponse response = checkoutService.createCheckoutSession(request);
        return ResponseEntity.ok(response);
    }
}
