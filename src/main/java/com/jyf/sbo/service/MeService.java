package com.jyf.sbo.service;

import com.jyf.sbo.domain.Tenant;
import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.MeResponse;
import com.jyf.sbo.repository.TenantRepository;
import com.jyf.sbo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MeService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    public MeService(UserRepository userRepository, TenantRepository tenantRepository) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
    }

    public MeResponse getMe(Long userId, Long tenantId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!tenantId.equals(user.getTenant().getId())) {
            throw new IllegalArgumentException("User tenant mismatch");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        return new MeResponse(user.getEmail(), tenant.getCompanyName());
    }
}
