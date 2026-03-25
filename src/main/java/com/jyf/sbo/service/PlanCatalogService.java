package com.jyf.sbo.service;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.dto.PlanCatalogItemResponse;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PlanCatalogService {

    private static final List<PlanCode> PLAN_ORDER = List.of(PlanCode.FREE, PlanCode.PLUS, PlanCode.PRO);
    private final Map<PlanCode, PlanDefinition> planDefinitions;

    public PlanCatalogService(@Value("${stripe.price-id.plus:}") String plusPriceId,
                              @Value("${stripe.price-id.pro:}") String proPriceId) {
        this.planDefinitions = createPlanDefinitions(plusPriceId, proPriceId);
    }

    public List<PlanCatalogItemResponse> getPlans(PlanCode currentPlanCode) {
        return PLAN_ORDER.stream()
            .map(this::getPlanDefinition)
            .map(plan -> plan.toResponse(currentPlanCode))
            .toList();
    }

    public boolean isPurchasable(PlanCode planCode) {
        return findStripePriceId(planCode).isPresent();
    }

    public Optional<String> findStripePriceId(PlanCode planCode) {
        return Optional.ofNullable(getPlanDefinition(planCode).stripePriceId());
    }

    public String getRequiredStripePriceId(PlanCode planCode) {
        return findStripePriceId(planCode)
            .orElseThrow(() -> new IllegalStateException("Stripe priceId is not configured for planCode=" + planCode));
    }

    public long getQuotaTotal(PlanCode planCode) {
        return getPlanDefinition(planCode).quotaTotal();
    }

    private static Map<PlanCode, PlanDefinition> createPlanDefinitions(String plusPriceId, String proPriceId) {
        EnumMap<PlanCode, PlanDefinition> definitions = new EnumMap<>(PlanCode.class);
        definitions.put(PlanCode.FREE, new PlanDefinition(PlanCode.FREE, "Free", "$0", 10L, null));
        definitions.put(
            PlanCode.PLUS,
            new PlanDefinition(PlanCode.PLUS, "Plus", "$9", 100L, requirePriceId(plusPriceId, "STRIPE_PRICE_ID_PLUS"))
        );
        definitions.put(
            PlanCode.PRO,
            new PlanDefinition(PlanCode.PRO, "Pro", "$29", 1000L, requirePriceId(proPriceId, "STRIPE_PRICE_ID_PRO"))
        );
        return Map.copyOf(definitions);
    }

    private static String requirePriceId(String priceId, String envVarName) {
        if (priceId == null || priceId.isBlank()) {
            throw new IllegalStateException(envVarName + " must be configured for purchasable plans");
        }

        return priceId;
    }

    private PlanDefinition getPlanDefinition(PlanCode planCode) {
        PlanDefinition definition = planDefinitions.get(planCode);
        if (definition == null) {
            throw new IllegalArgumentException("No plan definition found for " + planCode);
        }

        return definition;
    }

    private record PlanDefinition(PlanCode planCode,
                                  String displayName,
                                  String monthlyPriceLabel,
                                  long quotaTotal,
                                  String stripePriceId) {

        private PlanCatalogItemResponse toResponse(PlanCode currentPlanCode) {
            return new PlanCatalogItemResponse(
                planCode.name(),
                displayName,
                monthlyPriceLabel,
                quotaTotal,
                planCode == currentPlanCode
            );
        }
    }
}
