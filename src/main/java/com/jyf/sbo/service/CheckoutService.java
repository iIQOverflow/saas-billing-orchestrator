package com.jyf.sbo.service;

import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.CheckoutRequest;
import com.jyf.sbo.dto.CheckoutResponse;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.UserRepository;
import java.net.URI;
import org.springframework.stereotype.Service;

@Service
public class CheckoutService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final StripeCheckoutService stripeCheckoutService;

    public CheckoutService(UserRepository userRepository,
                           SubscriptionRepository subscriptionRepository,
                           StripeCheckoutService stripeCheckoutService) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.stripeCheckoutService = stripeCheckoutService;
    }

    public CheckoutResponse createCheckoutSession(Long userId, Long tenantId, CheckoutRequest request) {
        validateUrl(request.successUrl(), "successUrl");
        validateUrl(request.cancelUrl(), "cancelUrl");

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!tenantId.equals(user.getTenant().getId())) {
            throw new IllegalArgumentException("User tenant mismatch");
        }

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found for tenant"));

        return stripeCheckoutService.createCheckoutSession(
            request,
            subscription.getStripeCustomerId(),
            tenantId,
            subscription.getPlanTier()
        );
    }

    private void validateUrl(String value, String fieldName) {
        try {
            URI uri = URI.create(value);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalArgumentException(fieldName + " must be an absolute URL");
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(fieldName + " must be a valid absolute URL");
        }
    }
}
