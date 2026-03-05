package com.jerryfeng.sbo.repository;

import com.jerryfeng.sbo.domain.Tenant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // Critical for the Redis Rate Limiter: Identify the company by their API Key
    Optional<Tenant> findByTenantApiKey(String tenantApiKey);

    // Useful for admin dashboards
    Optional<Tenant> findByCompanyName(String companyName);
}