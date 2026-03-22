package com.jyf.sbo.service;

import com.jyf.sbo.domain.User;
import com.jyf.sbo.dto.LoginRequest;
import com.jyf.sbo.dto.LoginResponse;
import com.jyf.sbo.repository.UserRepository;
import com.jyf.sbo.security.JwtTokenService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtTokenService.generateToken(user);

        return new LoginResponse(
            token,
            "Bearer",
            jwtTokenService.getExpirationSeconds(),
            user.getId(),
            user.getTenant().getId()
        );
    }
}
