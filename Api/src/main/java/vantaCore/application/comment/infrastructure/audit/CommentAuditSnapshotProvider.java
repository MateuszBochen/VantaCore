package vantaCore.application.comment.infrastructure.audit;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.repository.CommentAggregateRepositoryInterface;
import vantaCore.application.comment.domain.vo.CommentId;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class CommentAuditSnapshotProvider implements AuditSnapshotProviderInterface {

    private final CommentAggregateRepositoryInterface repository;

    public CommentAuditSnapshotProvider(CommentAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public AuditResourceType resourceType() {
        return AuditResourceType.COMMENT;
    }

    // ticketId/authorId/createdAt are fixed for a comment's lifetime - body is the only field that
    // can ever appear in a diff.
    @Override
    public Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId) {
        return this.repository.findById(new CommentId(resourceId)).map(comment -> {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("body", comment.toSnapshot().body());
            return fields;
        });
    }
}
