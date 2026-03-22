package com.jyf.sbo.security;

import com.jyf.sbo.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final Key signingKey;
    private final long expirationSeconds;

    public JwtTokenService(
        @Value("${app.jwt.secret}") String rawSecret,
        @Value("${app.jwt.expiration-seconds}") long expirationSeconds) {

        byte[] secretBytes = rawSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes");
        }

        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + expirationSeconds * 1000);

        return Jwts.builder()
            .setSubject(user.getEmail())
            .claim("uid", user.getId())
            .claim("tid", user.getTenant().getId())
            .setIssuedAt(issuedAt)
            .setExpiration(expiration)
            .signWith(signingKey, SignatureAlgorithm.HS256)
            .compact();
    }

    public AuthenticatedUser parse(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(signingKey)
            .build()
            .parseClaimsJws(token)
            .getBody();

        Number userId = claims.get("uid", Number.class);
        Number tenantId = claims.get("tid", Number.class);
        String email = claims.getSubject();

        if (userId == null || tenantId == null || email == null || email.isBlank()) {
            throw new IllegalArgumentException("Invalid token payload");
        }

        return new AuthenticatedUser(userId.longValue(), tenantId.longValue(), email);
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
