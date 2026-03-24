package com.jyf.sbo.controller;

import com.jyf.sbo.dto.DemoUsageConsumeResponse;
import com.jyf.sbo.security.AuthenticatedUser;
import com.jyf.sbo.service.DemoUsageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo/usage")
public class DemoController {

    private final DemoUsageService demoUsageService;

    public DemoController(DemoUsageService demoUsageService) {
        this.demoUsageService = demoUsageService;
    }

    @PostMapping("/consume")
    public ResponseEntity<DemoUsageConsumeResponse> consume(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(demoUsageService.consume(user.getTenantId()));
    }
}
