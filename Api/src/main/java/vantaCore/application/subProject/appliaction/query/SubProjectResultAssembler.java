package vantaCore.application.subProject.appliaction.query;

import org.springframework.stereotype.Component;
import vantaCore.application.subProject.appliaction.query.result.AdrResult;
import vantaCore.application.subProject.appliaction.query.result.SubProjectDocumentationResult;
import vantaCore.application.subProject.appliaction.query.result.SubProjectResult;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.Adr;
import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;
import vantaCore.application.subProject.domain.vo.SubProjectName;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class SubProjectResultAssembler {

    public SubProjectResult toResult(SubProjectAggregate subProject) {
        SubProjectName name = subProject.getName();
        UserId changedBy = subProject.getChangedBy();
        Email changedByEmail = subProject.getChangedByEmail();

        return new SubProjectResult(
            subProject.getVersionId(),
            subProject.getSubProjectId().value(),
            subProject.getProjectId().value(),
            name != null ? name.value() : null,
            subProject.getStatus() != null ? subProject.getStatus().name() : null,
            toDocumentationResult(subProject.getDocumentation()),
            changedBy != null ? changedBy.value() : null,
            changedByEmail != null ? changedByEmail.value() : null,
            subProject.getChangedAt()
        );
    }

    private SubProjectDocumentationResult toDocumentationResult(SubProjectDocumentation documentation) {
        if (documentation == null) {
            return new SubProjectDocumentationResult(null, null, null, Set.of());
        }

        return new SubProjectDocumentationResult(
            documentation.scope(),
            documentation.impactAnalysis(),
            documentation.solutionDesign(),
            toAdrResults(documentation.adrs())
        );
    }

    private Set<AdrResult> toAdrResults(Set<Adr> adrs) {
        return adrs.stream()
            .map(adr -> new AdrResult(adr.id(), adr.title(), adr.content()))
            .collect(Collectors.toSet());
    }
}
