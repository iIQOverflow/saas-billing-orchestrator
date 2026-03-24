package com.jyf.sbo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.dto.PlanCatalogItemResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PlanCatalogServiceTest {

    private static final String TEST_PLUS_PRICE_ID = "price_plus_test";
    private static final String TEST_PRO_PRICE_ID = "price_pro_test";

    private final PlanCatalogService planCatalogService = new PlanCatalogService(TEST_PLUS_PRICE_ID, TEST_PRO_PRICE_ID);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void getPlansReturnsEveryPlanWithDefinedCatalogMetadataExactlyOnce() {
        List<PlanCatalogItemResponse> plans = planCatalogService.getPlans(PlanCode.PRO);

        assertThat(plans)
            .extracting(PlanCatalogItemResponse::planCode)
            .containsExactly("FREE", "PLUS", "PRO");
        assertThat(plans)
            .extracting(PlanCatalogItemResponse::planCode)
            .doesNotHaveDuplicates();
        assertThat(plans.get(0).displayName()).isEqualTo("Free");
        assertThat(plans.get(0).monthlyPriceLabel()).isEqualTo("$0");
        assertThat(plans.get(0).quotaTotal()).isEqualTo(10L);
        assertThat(plans.get(1).displayName()).isEqualTo("Plus");
        assertThat(plans.get(1).monthlyPriceLabel()).isEqualTo("$9");
        assertThat(plans.get(1).quotaTotal()).isEqualTo(100L);
        assertThat(plans.get(2).displayName()).isEqualTo("Pro");
        assertThat(plans.get(2).monthlyPriceLabel()).isEqualTo("$29");
        assertThat(plans.get(2).quotaTotal()).isEqualTo(1000L);
    }

    @Test
    void getPlansMarksCurrentPlanUsingEnumEqualityForPlus() {
        List<PlanCatalogItemResponse> plans = planCatalogService.getPlans(PlanCode.PLUS);

        assertThat(plans)
            .extracting(plan -> plan.planCode() + ":" + plan.current())
            .containsExactly("FREE:false", "PLUS:true", "PRO:false");
    }

    @Test
    void getPlansDoesNotExposePriceIdInBrowserSafeJson() throws Exception {
        String json = objectMapper.writeValueAsString(planCatalogService.getPlans(PlanCode.PRO));

        assertThat(json).doesNotContain("priceId");
    }

    @Test
    void internalStripeMappingMarksFreeAsNonPurchasable() {
        assertThat(planCatalogService.isPurchasable(PlanCode.FREE)).isFalse();
        assertThat(planCatalogService.findStripePriceId(PlanCode.FREE)).isEmpty();
    }

    @Test
    void internalStripeMappingUsesEnvBackedPriceIdsForPurchasablePlans() {
        assertThat(planCatalogService.isPurchasable(PlanCode.PLUS)).isTrue();
        assertThat(planCatalogService.findStripePriceId(PlanCode.PLUS)).contains(TEST_PLUS_PRICE_ID);
        assertThat(planCatalogService.isPurchasable(PlanCode.PRO)).isTrue();
        assertThat(planCatalogService.findStripePriceId(PlanCode.PRO)).contains(TEST_PRO_PRICE_ID);
    }

    @Test
    void constructorRejectsMissingPlusPriceId() {
        assertThatThrownBy(() -> new PlanCatalogService(" ", TEST_PRO_PRICE_ID))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("STRIPE_PRICE_ID_PLUS");
    }

    @Test
    void constructorRejectsMissingProPriceId() {
        assertThatThrownBy(() -> new PlanCatalogService(TEST_PLUS_PRICE_ID, " "))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("STRIPE_PRICE_ID_PRO");
    }
}
