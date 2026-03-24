package com.jyf.sbo.controller;

import com.jyf.sbo.dto.MeResponse;
import com.jyf.sbo.security.AuthenticatedUser;
import com.jyf.sbo.service.MeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MeController {

    private final MeService meService;

    public MeController(MeService meService) {
        this.meService = meService;
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(meService.getMe(user.getUserId(), user.getTenantId()));
    }
}
