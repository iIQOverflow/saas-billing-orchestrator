package com.jyf.sbo.repository;

import com.jyf.sbo.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    // Standard identity lookup
    Optional<User> findByEmail(String email);

    // Multi-tenant lookup: Find all employees/users belonging to a specific company
    List<User> findByTenantId(Long tenantId);
}