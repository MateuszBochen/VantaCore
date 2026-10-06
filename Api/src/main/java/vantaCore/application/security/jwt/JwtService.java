package vantaCore.application.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vantaCore.application.user.domain.vo.UserId;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtService {

    private static final String RESOURCES_CLAIM = "resources";

    private final SecretKey key;
    private final long expirationMillis;

    public JwtService(
        @Value("${spring.security.jwt.secret}") String secret,
        @Value("${spring.security.jwt.expiration}") long expirationMillis
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(UserId userId, Set<String> resourceCodes) {
        Instant now = Instant.now();

        return Jwts.builder()
            .subject(userId.toString())
            .claim(RESOURCES_CLAIM, List.copyOf(resourceCodes))
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(expirationMillis)))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String refreshToken(String token) throws JwtException {
        Claims claims = parse(token);

        UserId userId = new UserId(UUID.fromString(claims.getSubject()));
        List<?> rawResources = claims.get(RESOURCES_CLAIM, List.class);
        Set<String> resourceCodes = rawResources.stream()
            .map(Object::toString)
            .collect(Collectors.toSet());

        return generateToken(userId, resourceCodes);
    }
}