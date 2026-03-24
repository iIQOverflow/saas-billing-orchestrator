package com.jyf.sbo.controller;

import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.repository.SubscriptionRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        subscriptionRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    @Test
    void getDashboardSummaryReturnsExpectedJsonForValidJwt() throws Exception {
        String token = createTokenWithSubscription();

        mockMvc.perform(get("/api/dashboard/summary")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tenant.companyName").value("Acme Inc"))
            .andExpect(jsonPath("$.subscription.planCode").value("PRO"))
            .andExpect(jsonPath("$.subscription.status").value("ACTIVE"))
            .andExpect(jsonPath("$.quota.total").value(10000))
            .andExpect(jsonPath("$.quota.remaining").value(8750))
            .andExpect(jsonPath("$.quota.used").value(1250))
            .andExpect(jsonPath("$.quota.usagePercent").value(12))
            .andExpect(jsonPath("$.plans", hasSize(2)))
            .andExpect(jsonPath("$.plans[0].planCode").value("FREE"))
            .andExpect(jsonPath("$.plans[0].displayName").value("Free"))
            .andExpect(jsonPath("$.plans[0].monthlyPriceLabel").value("$0"))
            .andExpect(jsonPath("$.plans[0].quotaTotal").value(1000))
            .andExpect(jsonPath("$.plans[0].current").value(false))
            .andExpect(jsonPath("$.plans[1].planCode").value("PRO"))
            .andExpect(jsonPath("$.plans[1].displayName").value("Pro"))
            .andExpect(jsonPath("$.plans[1].monthlyPriceLabel").value("$29"))
            .andExpect(jsonPath("$.plans[1].quotaTotal").value(10000))
            .andExpect(jsonPath("$.plans[1].current").value(true))
            .andExpect(jsonPath("$..tenantApiKey").doesNotExist())
            .andExpect(jsonPath("$..stripeCustomerId").doesNotExist())
            .andExpect(content().string(not(containsString("tenantApiKey"))))
            .andExpect(content().string(not(containsString("stripeCustomerId"))));
    }

    @Test
    void getDashboardSummaryReturnsUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
            .andExpect(status().isUnauthorized());
    }

    private String createTokenWithSubscription() {
        Tenant tenant = new Tenant();
        tenant.setCompanyName("Acme Inc");
        tenant.setTenantApiKey("tenant-key-" + System.nanoTime());
        tenant.setQuotaBalance(8750L);
        Tenant savedTenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail("admin@acme.com");
        user.setPasswordHash("not-used-in-this-test");
        user.setTenant(savedTenant);
        User savedUser = userRepository.save(user);

        Subscription subscription = new Subscription();
        subscription.setTenant(savedTenant);
        subscription.setStripeCustomerId("cus_test_123");
        subscription.setPlanTier("PRO");
        subscription.setQuotaTotal(10000L);
        subscription.setQuotaUsed(999L);
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);

        return jwtTokenService.generateToken(savedUser);
    }
}
