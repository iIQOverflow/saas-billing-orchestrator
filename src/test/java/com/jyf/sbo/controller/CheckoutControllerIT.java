package com.jyf.sbo.controller;

import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.repository.TenantRepository;
import com.jyf.sbo.repository.UserRepository;
import com.jyf.sbo.security.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckoutControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    @Test
    void createSessionReturnsUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(post("/api/checkout/create-session")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "planCode": "PLUS",
                      "successUrl": "https://app.example.com/success",
                      "cancelUrl": "https://app.example.com/cancel"
                    }
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void createSessionReturnsBadRequestWhenPlanCodeIsMissing() throws Exception {
        String token = createToken();

        mockMvc.perform(post("/api/checkout/create-session")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "priceId": "price_test_123",
                      "successUrl": "https://app.example.com/success",
                      "cancelUrl": "https://app.example.com/cancel"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.details[0]").value("planCode is required"));
    }

    private String createToken() {
        Tenant tenant = new Tenant();
        tenant.setCompanyName("Acme Inc");
        tenant.setTenantApiKey("tenant-key-" + System.nanoTime());
        tenant.setQuotaBalance(100L);
        Tenant savedTenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail("admin@acme.com");
        user.setPasswordHash("not-used-in-this-test");
        user.setTenant(savedTenant);
        User savedUser = userRepository.save(user);

        return jwtTokenService.generateToken(savedUser);
    }
}
