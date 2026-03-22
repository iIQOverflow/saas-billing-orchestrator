package com.jyf.sbo.config;

import com.jyf.sbo.metering.TenantApiKeyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final TenantApiKeyInterceptor tenantApiKeyInterceptor;

    public WebMvcConfig(TenantApiKeyInterceptor tenantApiKeyInterceptor) {
        this.tenantApiKeyInterceptor = tenantApiKeyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantApiKeyInterceptor)
            .addPathPatterns("/api/v1/**");
    }
}
