package com.jyf.sbo.controller;

import com.jyf.sbo.dto.DashboardSummaryResponse;
import com.jyf.sbo.security.AuthenticatedUser;
import com.jyf.sbo.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> summary(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(dashboardService.getSummary(user.getUserId(), user.getTenantId()));
    }
}
