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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MeControllerIT {

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
    void getMeReturnsExpectedJsonForValidJwt() throws Exception {
        String token = createToken("admin@acme.com", "Acme Inc");

        mockMvc.perform(get("/api/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("admin@acme.com"))
            .andExpect(jsonPath("$.companyName").value("Acme Inc"));
    }

    @Test
    void getMeReturnsUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized());
    }

    private String createToken(String email, String companyName) {
        Tenant tenant = new Tenant();
        tenant.setCompanyName(companyName);
        tenant.setTenantApiKey("tenant-key-" + System.nanoTime());
        tenant.setQuotaBalance(8750L);
        Tenant savedTenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("not-used-in-this-test");
        user.setTenant(savedTenant);
        User savedUser = userRepository.save(user);

        return jwtTokenService.generateToken(savedUser);
    }
}
