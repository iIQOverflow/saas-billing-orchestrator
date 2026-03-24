package com.jyf.sbo.service;

import com.jyf.sbo.dto.PlanCatalogItemResponse;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class PlanCatalogService {

    private static final List<PlanDefinition> PLAN_DEFINITIONS = List.of(
        new PlanDefinition("FREE", "Free", "$0", 1000L),
        new PlanDefinition("PRO", "Pro", "$29", 10000L)
    );

    public List<PlanCatalogItemResponse> getPlans(String currentPlanCode) {
        return PLAN_DEFINITIONS.stream()
            .map(plan -> plan.toResponse(currentPlanCode))
            .toList();
    }

    private record PlanDefinition(String planCode, String displayName, String monthlyPriceLabel, long quotaTotal) {

        private PlanCatalogItemResponse toResponse(String currentPlanCode) {
            return new PlanCatalogItemResponse(
                planCode,
                displayName,
                monthlyPriceLabel,
                quotaTotal,
                Objects.equals(planCode, currentPlanCode)
            );
        }
    }
}
