package vantaCore.application.documentation.search.infrastructure.persistence;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.documentation.search.domain.DocumentationChunk;
import vantaCore.application.documentation.search.domain.repository.DocumentationChunkRepositoryInterface;
import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

// Plain JDBC rather than JPA/@Entity - a pgvector `vector` column has no first-class Hibernate
// mapping without pulling in the separate pgvector-java library, and the two operations this
// module actually needs (bulk replace, ORDER BY cosine distance LIMIT n) are naturally raw SQL
// anyway, not idiomatic entity CRUD - same "drop to native SQL for a special-case persistence
// operation" precedent as TicketAggregateRepositoryInterface.incrementTimeSpent.
//
// The vector value itself is passed as a Postgres array-literal string ("[0.1,0.2,...]") cast via
// `::vector` in SQL, rather than any driver-level vector type - works with the stock PostgreSQL
// JDBC driver, no extra dependency.
@Repository
public class JdbcDocumentationChunkRepositoryAdapter implements DocumentationChunkRepositoryInterface {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public JdbcDocumentationChunkRepositoryAdapter(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void replaceAllForOwner(UUID projectId, UUID ownerId, List<DocumentationChunk> chunks) {
        this.jdbcTemplate.update(
            "DELETE FROM documentation_chunks WHERE owner_id = :ownerId",
            new MapSqlParameterSource("ownerId", ownerId)
        );

        if (chunks.isEmpty()) {
            return;
        }

        SqlParameterSource[] batchParams = chunks.stream()
            .map(chunk -> new MapSqlParameterSource()
                .addValue("id", chunk.id())
                .addValue("projectId", chunk.projectId())
                .addValue("ownerId", chunk.ownerId())
                .addValue("sourceType", chunk.sourceType().name())
                .addValue("sourceId", chunk.sourceId())
                .addValue("label", chunk.label())
                .addValue("content", chunk.content())
                .addValue("embedding", toVectorLiteral(chunk.embedding()))
                .addValue("createdAt", Timestamp.from(chunk.createdAt())))
            .toArray(SqlParameterSource[]::new);

        this.jdbcTemplate.batchUpdate("""
            INSERT INTO documentation_chunks (id, project_id, owner_id, source_type, source_id, label, content, embedding, created_at)
            VALUES (:id, :projectId, :ownerId, :sourceType, :sourceId, :label, :content, CAST(:embedding AS vector), :createdAt)
            """, batchParams);
    }

    @Override
    public List<DocumentationChunk> findNearest(UUID projectId, float[] queryEmbedding, int limit) {
        // Two separate queries rather than a `WHERE (:projectId IS NULL OR project_id = :projectId)`
        // - binding an untyped null UUID parameter into that kind of OR clause is a known rough edge
        // with the PostgreSQL JDBC driver ("could not determine data type of parameter"), so ALL
        // scope just omits the WHERE clause entirely instead of relying on runtime null handling.
        String sql = projectId == null
            ? """
              SELECT id, project_id, source_type, source_id, label, content, created_at
              FROM documentation_chunks
              ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
              LIMIT :limit
              """
            : """
              SELECT id, project_id, source_type, source_id, label, content, created_at
              FROM documentation_chunks
              WHERE project_id = :projectId
              ORDER BY embedding <=> CAST(:queryEmbedding AS vector)
              LIMIT :limit
              """;

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("queryEmbedding", toVectorLiteral(queryEmbedding))
            .addValue("limit", limit);

        if (projectId != null) {
            params.addValue("projectId", projectId);
        }

        return this.jdbcTemplate.query(sql, params, (rs, rowNum) -> new DocumentationChunk(
            (UUID) rs.getObject("id"),
            (UUID) rs.getObject("project_id"),
            // ownerId is write-only (see DocumentationChunk's javadoc) - not selected above, so
            // not read back here either.
            null,
            DocumentationSourceType.valueOf(rs.getString("source_type")),
            (UUID) rs.getObject("source_id"),
            rs.getString("label"),
            rs.getString("content"),
            null,
            rs.getTimestamp("created_at").toInstant()
        ));
    }

    private String toVectorLiteral(float[] embedding) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(embedding[i]);
        }
        return builder.append(']').toString();
    }
}
