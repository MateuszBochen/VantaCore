package vantaCore.ui.http.ws;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;
import vantaCore.application.security.jwt.JwtService;

import java.util.Map;
import java.util.UUID;

// Browsers can't set an Authorization header on a WebSocket handshake request, so the same JWT used
// for REST auth is instead passed as a query param (wss://host/ws-api?token=...) and validated here
// with the exact same JwtService.parse(...) call JwtAuthenticationFilter uses. Runs before the HTTP
// upgrade completes, so an invalid/missing token gets a real 401 instead of an accepted-then-closed socket.
@Component
public class WebSocketHandshakeAuthInterceptor implements HandshakeInterceptor {

    static final String USER_ID_ATTRIBUTE = "userId";
    private static final String TOKEN_PARAM = "token";

    private final JwtService jwtService;

    public WebSocketHandshakeAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Map<String, Object> attributes
    ) {
        String token = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams().getFirst(TOKEN_PARAM);
        UUID userId = authenticate(token);

        if (userId == null) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        attributes.put(USER_ID_ATTRIBUTE, userId);

        return true;
    }

    @Override
    public void afterHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Exception exception
    ) {
        // no-op
    }

    private UUID authenticate(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        try {
            Claims claims = this.jwtService.parse(token);
            return UUID.fromString(claims.getSubject());
        } catch (JwtException | IllegalArgumentException exception) {
            return null;
        }
    }
}
