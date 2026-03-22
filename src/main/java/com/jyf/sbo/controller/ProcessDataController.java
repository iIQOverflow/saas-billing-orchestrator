package com.jyf.sbo.controller;

import com.jyf.sbo.dto.ProcessDataRequest;
import com.jyf.sbo.dto.ProcessDataResponse;
import com.jyf.sbo.metering.RequestAttributes;
import com.jyf.sbo.service.ProcessDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProcessDataController {

    private final ProcessDataService processDataService;

    public ProcessDataController(ProcessDataService processDataService) {
        this.processDataService = processDataService;
    }

    @PostMapping("/process-data")
    public ResponseEntity<ProcessDataResponse> processData(@Valid @RequestBody ProcessDataRequest request,
                                                           HttpServletRequest httpServletRequest) {

        Long tenantId = (Long) httpServletRequest.getAttribute(RequestAttributes.TENANT_ID);
        Long remainingQuota = (Long) httpServletRequest.getAttribute(RequestAttributes.REMAINING_QUOTA);

        ProcessDataResponse response = processDataService.process(tenantId, request, remainingQuota);
        return ResponseEntity.ok(response);
    }
}
