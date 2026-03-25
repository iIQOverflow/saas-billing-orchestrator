package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.dto.CheckoutRequest;
import com.stripe.StripeClient;
import com.stripe.model.checkout.Session;
import com.stripe.net.ApiRequest;
import com.stripe.net.StripeResponseGetter;
import java.lang.reflect.Type;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StripeCheckoutServiceTest {

    @Mock
    private StripeResponseGetter responseGetter;

    @Test
    void createCheckoutSessionWritesRequestedPlanCodeToSubscriptionMetadata() throws Exception {
        StripeCheckoutService stripeCheckoutService = new StripeCheckoutService(new StripeClient(responseGetter));
        CheckoutRequest request = new CheckoutRequest(
            "PLUS",
            "https://app.example.com/success",
            "https://app.example.com/cancel"
        );
        Session session = new Session();
        session.setUrl("https://checkout.stripe.test/session_123");

        when(responseGetter.request(any(ApiRequest.class), any(Type.class))).thenReturn(session);

        stripeCheckoutService.createCheckoutSession(request, "price_plus_test", "cus_123", 10L, PlanCode.PLUS);

        ArgumentCaptor<ApiRequest> requestCaptor = ArgumentCaptor.forClass(ApiRequest.class);
        verify(responseGetter).request(requestCaptor.capture(), any(Type.class));

        Object metadataObject = requestCaptor.getValue().getParams().get("metadata");
        assertThat(metadataObject).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, String> sessionMetadata = (Map<String, String>) metadataObject;
        assertThat(sessionMetadata)
            .containsEntry("tenantId", "10")
            .doesNotContainKey("planTier");

        Object subscriptionData = requestCaptor.getValue().getParams().get("subscription_data");
        assertThat(subscriptionData).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> subscriptionDataMap = (Map<String, Object>) subscriptionData;
        assertThat(subscriptionDataMap).containsKey("metadata");

        @SuppressWarnings("unchecked")
        Map<String, String> metadata = (Map<String, String>) subscriptionDataMap.get("metadata");
        assertThat(metadata).containsEntry("planCode", PlanCode.PLUS.name());
    }
}
