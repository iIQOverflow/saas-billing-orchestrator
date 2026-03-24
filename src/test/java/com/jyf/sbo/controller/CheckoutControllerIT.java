package com.jyf.sbo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckoutControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createSessionReturnsUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(post("/api/checkout/create-session")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "priceId": "price_test_123",
                      "successUrl": "https://app.example.com/success",
                      "cancelUrl": "https://app.example.com/cancel"
                    }
                    """))
            .andExpect(status().isUnauthorized());
    }
}
