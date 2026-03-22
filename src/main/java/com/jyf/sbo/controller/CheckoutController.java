package com.jyf.sbo.controller;

import com.jyf.sbo.dto.CheckoutRequest;
import com.jyf.sbo.dto.CheckoutResponse;
import com.jyf.sbo.security.AuthenticatedUser;
import com.jyf.sbo.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/create-session")
    public ResponseEntity<CheckoutResponse> createSession(@Valid @RequestBody CheckoutRequest request,
                                                          @AuthenticationPrincipal AuthenticatedUser user) {

        CheckoutResponse response = checkoutService.createCheckoutSession(
            user.getUserId(),
            user.getTenantId(),
            request
        );

        return ResponseEntity.ok(response);
    }
}
