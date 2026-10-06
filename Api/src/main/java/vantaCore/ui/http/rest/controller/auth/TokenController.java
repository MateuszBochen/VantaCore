package vantaCore.ui.http.rest.controller.auth;

import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.security.jwt.JwtService;
import vantaCore.application.security.jwt.RefreshedToken;
import vantaCore.application.shared.application.exception.InvalidTokenException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

@RestController
@RequestMapping("/api/auth")
final public class TokenController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    TokenController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/refresh")
    public OpenApiResponse<Single<RefreshedToken>> refresh(
        @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new InvalidTokenException();
        }

        String token = authorizationHeader.substring(BEARER_PREFIX.length());

        try {
            RefreshedToken result = new RefreshedToken(jwtService.refreshToken(token));
            return OpenApiResponse.one(Item.fromPayload("token", result), HttpStatus.OK);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidTokenException();
        }
    }
}