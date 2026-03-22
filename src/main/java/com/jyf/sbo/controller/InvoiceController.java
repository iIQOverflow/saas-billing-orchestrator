package com.jyf.sbo.controller;

import com.jyf.sbo.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @PostMapping("/api/invoice/send")
    public String sendInvoice() {

        // 1. Offload the heavy invoice generation to AWS Lambda (Asynchronous!)
        invoiceService.triggerInvoiceGeneration();

        // 2. Immediately respond to the user without making them wait
        return "Invoice will be sent to you email.";
    }
}
