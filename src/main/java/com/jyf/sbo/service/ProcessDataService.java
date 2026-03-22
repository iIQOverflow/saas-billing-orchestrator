package com.jyf.sbo.service;

import com.jyf.sbo.dto.ProcessDataRequest;
import com.jyf.sbo.dto.ProcessDataResponse;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProcessDataService {

    public ProcessDataResponse process(Long tenantId, ProcessDataRequest request, Long remainingQuota) {
        String processedId = "txn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        return new ProcessDataResponse(
            "success",
            processedId,
            remainingQuota
        );
    }
}
