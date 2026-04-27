package com.allalarticle.backend.auth;

import com.allalarticle.backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties props;

    public String generateToken(long userId, String email, String type,
                                String tenantSchema, String roleCode) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("type", type)             // "platform" | "tenant"
                .claim("schema", tenantSchema)   // null for platform users
                .claim("roleCode", roleCode)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + props.expirationMs()))
                .signWith(key())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }
}
