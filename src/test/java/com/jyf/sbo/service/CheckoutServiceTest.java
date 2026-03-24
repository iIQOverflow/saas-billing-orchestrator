package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.CheckoutRequest;
import com.jyf.sbo.dto.CheckoutResponse;
import com.jyf.sbo.repository.SubscriptionRepository;
import com.jyf.sbo.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    private static final String TEST_PLUS_PRICE_ID = "price_plus_test";
    private static final String TEST_PRO_PRICE_ID = "price_pro_test";
    private static final String CHECKOUT_URL = "https://checkout.stripe.test/session_123";

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private StripeCheckoutService stripeCheckoutService;

    @Spy
    private PlanCatalogService planCatalogService = new PlanCatalogService(TEST_PLUS_PRICE_ID, TEST_PRO_PRICE_ID);

    @InjectMocks
    private CheckoutService checkoutService;

    @Test
    void createCheckoutSessionForPlusResolvesPrivateStripePriceId() {
        User user = createUser(100L, 10L);
        Subscription subscription = createSubscription(10L, PlanCode.FREE);
        CheckoutRequest request = createRequest("PLUS");
        CheckoutResponse expectedResponse = new CheckoutResponse(CHECKOUT_URL);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));
        when(stripeCheckoutService.createCheckoutSession(request, TEST_PLUS_PRICE_ID, "cus_123", 10L, PlanCode.PLUS))
            .thenReturn(expectedResponse);

        CheckoutResponse response = checkoutService.createCheckoutSession(100L, 10L, request);

        assertThat(response).isSameAs(expectedResponse);
        verify(planCatalogService).getRequiredStripePriceId(PlanCode.PLUS);
        verify(stripeCheckoutService).createCheckoutSession(request, TEST_PLUS_PRICE_ID, "cus_123", 10L, PlanCode.PLUS);
    }

    @Test
    void createCheckoutSessionForProResolvesPrivateStripePriceId() {
        User user = createUser(100L, 10L);
        Subscription subscription = createSubscription(10L, PlanCode.PLUS);
        CheckoutRequest request = createRequest("PRO");
        CheckoutResponse expectedResponse = new CheckoutResponse(CHECKOUT_URL);

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));
        when(subscriptionRepository.findByTenantId(10L)).thenReturn(Optional.of(subscription));
        when(stripeCheckoutService.createCheckoutSession(request, TEST_PRO_PRICE_ID, "cus_123", 10L, PlanCode.PRO))
            .thenReturn(expectedResponse);

        CheckoutResponse response = checkoutService.createCheckoutSession(100L, 10L, request);

        assertThat(response).isSameAs(expectedResponse);
        verify(planCatalogService).getRequiredStripePriceId(PlanCode.PRO);
        verify(stripeCheckoutService).createCheckoutSession(request, TEST_PRO_PRICE_ID, "cus_123", 10L, PlanCode.PRO);
    }

    @Test
    void createCheckoutSessionRejectsFreeBeforeStripeCheckout() {
        CheckoutRequest request = createRequest("FREE");

        assertThatThrownBy(() -> checkoutService.createCheckoutSession(100L, 10L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("FREE plan does not use Stripe checkout");

        verifyNoInteractions(userRepository, subscriptionRepository, planCatalogService, stripeCheckoutService);
    }

    @Test
    void createCheckoutSessionRejectsInvalidPlanCode() {
        CheckoutRequest request = createRequest("ENTERPRISE");

        assertThatThrownBy(() -> checkoutService.createCheckoutSession(100L, 10L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Unknown planCode")
            .hasMessageContaining("ENTERPRISE");

        verifyNoInteractions(userRepository, subscriptionRepository, planCatalogService, stripeCheckoutService);
    }

    @Test
    void createCheckoutSessionRejectsInvalidSuccessUrl() {
        CheckoutRequest request = new CheckoutRequest("PLUS", "not-a-url", "https://app.example.com/cancel");

        assertThatThrownBy(() -> checkoutService.createCheckoutSession(100L, 10L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("successUrl must be a valid absolute URL");

        verifyNoInteractions(userRepository, subscriptionRepository, planCatalogService, stripeCheckoutService);
    }

    @Test
    void createCheckoutSessionRejectsInvalidCancelUrl() {
        CheckoutRequest request = new CheckoutRequest("PLUS", "https://app.example.com/success", "/relative/cancel");

        assertThatThrownBy(() -> checkoutService.createCheckoutSession(100L, 10L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("cancelUrl must be a valid absolute URL");

        verifyNoInteractions(userRepository, subscriptionRepository, planCatalogService, stripeCheckoutService);
    }

    @Test
    void createCheckoutSessionRejectsUserTenantMismatch() {
        User user = createUser(100L, 99L);
        CheckoutRequest request = createRequest("PLUS");

        when(userRepository.findById(100L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> checkoutService.createCheckoutSession(100L, 10L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User tenant mismatch");

        verifyNoInteractions(subscriptionRepository, stripeCheckoutService);
    }

    private CheckoutRequest createRequest(String planCode) {
        return new CheckoutRequest(
            planCode,
            "https://app.example.com/success",
            "https://app.example.com/cancel"
        );
    }

    private User createUser(Long userId, Long tenantId) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        User user = new User();
        user.setId(userId);
        user.setEmail("admin@acme.com");
        user.setPasswordHash("password-hash");
        user.setTenant(tenant);
        return user;
    }

    private Subscription createSubscription(Long tenantId, PlanCode currentPlanCode) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        Subscription subscription = new Subscription();
        subscription.setTenant(tenant);
        subscription.setStripeCustomerId("cus_123");
        subscription.setPlanCode(currentPlanCode);
        subscription.setQuotaTotal(100L);
        subscription.setQuotaUsed(10L);
        subscription.setStatus("ACTIVE");
        return subscription;
    }
}
