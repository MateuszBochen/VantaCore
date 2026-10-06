package vantaCore.application.sso.infrastructure.persistence.login;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.sso.domain.login.SsoLoginState;
import vantaCore.application.sso.domain.login.SsoLoginStateRepositoryInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/** Native SQL rather than an entity - the one operation that matters, consume(), has to be a single
 atomic DELETE ... RETURNING so two racing callbacks with the same state can't both succeed (a
 find-then-delete through JPA could, since command/query handlers don't run in a transaction). */
@Repository
public class JpaSsoLoginStateRepositoryAdapter implements SsoLoginStateRepositoryInterface {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void save(SsoLoginState state, Instant now) {
        this.entityManager.createNativeQuery("DELETE FROM sso_login_states WHERE expires_at < ?1")
            .setParameter(1, now)
            .executeUpdate();

        this.entityManager.createNativeQuery(
                "INSERT INTO sso_login_states (state, provider, redirect_uri, code_verifier, nonce, expires_at) " +
                "VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
            )
            .setParameter(1, state.state())
            .setParameter(2, state.provider().name())
            .setParameter(3, state.redirectUri())
            .setParameter(4, state.codeVerifier())
            .setParameter(5, state.nonce())
            .setParameter(6, state.expiresAt())
            .executeUpdate();
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public Optional<SsoLoginState> consume(String state) {
        List<Object[]> rows = this.entityManager.createNativeQuery(
                "DELETE FROM sso_login_states WHERE state = ?1 " +
                "RETURNING state, provider, redirect_uri, code_verifier, nonce, expires_at"
            )
            .setParameter(1, state)
            .getResultList();

        return rows.stream().findFirst().map(row -> new SsoLoginState(
            (String) row[0],
            SsoProvider.valueOf((String) row[1]),
            (String) row[2],
            (String) row[3],
            (String) row[4],
            toInstant(row[5])
        ));
    }

    private Instant toInstant(Object value) {
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }
        return ((Timestamp) value).toInstant();
    }
}
