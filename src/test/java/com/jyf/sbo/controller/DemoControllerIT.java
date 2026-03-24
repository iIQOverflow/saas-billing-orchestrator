package com.jyf.sbo.controller;

import com.jyf.sbo.domain.PlanCode;
import com.jyf.sbo.domain.Subscription;
import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.metering.M2MGatewayService;
import com.jyf.sbo.metering.RedisQuotaService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DemoControllerIT {

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

    @MockitoBean
    private M2MGatewayService gatewayService;

    @BeforeEach
    void setUp() {
        subscriptionRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    @Test
    void consumeUsageReturnsUpdatedQuotaSummaryForValidJwt() throws Exception {
        TestFixture fixture = createFixture(1000L, 0L);
        when(gatewayService.consumeQuotaSafely(fixture.tenantId())).thenReturn(999L);

        mockMvc.perform(post("/api/demo/usage/consume")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + fixture.token()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("success"))
            .andExpect(jsonPath("$.quota.total").value(1000))
            .andExpect(jsonPath("$.quota.remaining").value(999))
            .andExpect(jsonPath("$.quota.used").value(1))
            .andExpect(jsonPath("$.quota.usagePercent").value(0))
            .andExpect(jsonPath("$..tenantApiKey").doesNotExist())
            .andExpect(jsonPath("$..stripeCustomerId").doesNotExist());

        Tenant updatedTenant = tenantRepository.findById(fixture.tenantId()).orElseThrow();
        Subscription updatedSubscription = subscriptionRepository.findByTenantId(fixture.tenantId()).orElseThrow();

        assertThat(updatedTenant.getQuotaBalance()).isEqualTo(999L);
        assertThat(updatedSubscription.getQuotaUsed()).isEqualTo(1L);
    }

    @Test
    void consumeUsageReturnsUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(post("/api/demo/usage/consume"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void consumeUsageReturnsTooManyRequestsWhenQuotaIsExhausted() throws Exception {
        TestFixture fixture = createFixture(1000L, 1000L);
        when(gatewayService.consumeQuotaSafely(fixture.tenantId())).thenReturn(RedisQuotaService.QUOTA_EXHAUSTED);

        mockMvc.perform(post("/api/demo/usage/consume")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + fixture.token()))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.status").value(429))
            .andExpect(jsonPath("$.error").value("Too Many Requests"))
            .andExpect(jsonPath("$.message").value("Quota exhausted"))
            .andExpect(jsonPath("$.path").value("/api/demo/usage/consume"));
    }

    private TestFixture createFixture(Long quotaTotal, Long quotaUsed) {
        long remainingQuota = Math.max(0L, quotaTotal - quotaUsed);

        Tenant tenant = new Tenant();
        tenant.setCompanyName("Acme Inc");
        tenant.setTenantApiKey("tenant-key-" + System.nanoTime());
        tenant.setQuotaBalance(remainingQuota);
        Tenant savedTenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail("admin@acme.com");
        user.setPasswordHash("not-used-in-this-test");
        user.setTenant(savedTenant);
        User savedUser = userRepository.save(user);

        Subscription subscription = new Subscription();
        subscription.setTenant(savedTenant);
        subscription.setStripeCustomerId("cus_test_123");
        subscription.setPlanCode(PlanCode.PRO);
        subscription.setQuotaTotal(quotaTotal);
        subscription.setQuotaUsed(quotaUsed);
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);

        return new TestFixture(savedTenant.getId(), jwtTokenService.generateToken(savedUser));
    }

    private record TestFixture(Long tenantId, String token) {
    }
}
