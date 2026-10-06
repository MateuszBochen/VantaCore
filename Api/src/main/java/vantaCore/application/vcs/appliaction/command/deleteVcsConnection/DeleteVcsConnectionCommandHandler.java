package vantaCore.application.vcs.appliaction.command.deleteVcsConnection;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.VcsConnectionNotFoundException;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;

@Component
final public class DeleteVcsConnectionCommandHandler implements CommandHandlerInterface<DeleteVcsConnectionCommand> {

    private final VcsConnectionRepositoryInterface repository;

    public DeleteVcsConnectionCommandHandler(VcsConnectionRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(DeleteVcsConnectionCommand command) {
        VcsConnectionId connectionId = new VcsConnectionId(command.getConnectionId());

        VcsConnectionSnapshot connection = this.repository.findById(connectionId).orElseThrow(VcsConnectionNotFoundException::new);

        if (!connection.projectId().equals(command.getProjectId())) {
            throw new VcsConnectionNotFoundException();
        }

        this.repository.deleteById(connectionId);

        return null;
    }
}
