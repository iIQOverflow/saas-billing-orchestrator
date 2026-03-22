package com.jyf.sbo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class InvoiceService {

    @SuppressWarnings("checkstyle:Indentation")
    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);

    // Paste your unique API Gateway URL here
    private final String INVOICE_LAMBDA_URL = "https://n8ic2tyko1.execute-api.ap-southeast-2.amazonaws.com/default/saas-billing-orchestrator-invoice-generator";

    public void triggerInvoiceGeneration() {
        try {
            logger.info("--- Contacting AWS Lambda to generate invoice... ---");

            // RestTemplate is Spring Boot's built-in tool for calling external URLs
            RestTemplate restTemplate = new RestTemplate();

            // We send a simple GET request to your Lambda URL
            String lambdaResponse = restTemplate.getForObject(INVOICE_LAMBDA_URL, String.class);

            logger.info("--- Success! Lambda says: ---");
            logger.info(lambdaResponse);

        } catch (Exception e) {
            logger.info("Failed to reach Lambda: ", e);
        }
    }
}