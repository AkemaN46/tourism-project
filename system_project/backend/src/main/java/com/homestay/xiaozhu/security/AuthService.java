package com.homestay.xiaozhu.security;

import com.homestay.xiaozhu.entity.Admin;
import com.homestay.xiaozhu.entity.User;
import com.homestay.xiaozhu.repository.AdminRepository;
import com.homestay.xiaozhu.repository.UserRepository;
import com.homestay.xiaozhu.util.TokenUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class AuthService {
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.user-expiration-ms:604800000}")
    private long userExpirationMs;

    @Value("${app.jwt.admin-expiration-ms:28800000}")
    private long adminExpirationMs;

    public AuthService(AdminRepository adminRepository, UserRepository userRepository) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
    }

    public String issueUserToken(Long userId) {
        return issueToken(userId, "USER", userExpirationMs);
    }

    public String issueAdminToken(Long adminId) {
        return issueToken(adminId, "ADMIN", adminExpirationMs);
    }

    private String issueToken(Long id, String role, long expirationMs) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(String.valueOf(id))
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMs))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    public AuthPrincipal authenticate(String authorizationHeader, String tokenHeader) {
        String token = TokenUtil.extractActualToken(authorizationHeader, tokenHeader);
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        try {
            Claims claims = Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
            Long id = Long.valueOf(claims.getSubject());
            String role = claims.get("role", String.class);
            if ("USER".equals(role)) {
                User user = userRepository.findById(id).orElse(null);
                return user != null && Integer.valueOf(1).equals(user.getStatus())
                        ? new AuthPrincipal(id, role) : null;
            }
            if ("ADMIN".equals(role)) {
                Admin admin = adminRepository.findById(id).orElse(null);
                return admin != null && Integer.valueOf(1).equals(admin.getStatus())
                        ? new AuthPrincipal(id, role) : null;
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }
}
