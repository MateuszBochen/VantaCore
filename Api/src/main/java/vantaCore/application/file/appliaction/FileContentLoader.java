package vantaCore.application.file.appliaction;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.FileSnapshot;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.shared.application.exception.StoredFileNotFoundException;

import java.io.InputStream;

/** Downloading raw bytes doesn't fit the Item<T>/Collection<T> QueryResult envelope (it's a binary
 stream, not JSON), so this is a plain shared component controllers call directly instead of going
 through the query bus - used by both the authenticated ticket-attachment download and the public
 avatar/editor-image endpoint. */
@Component
public class FileContentLoader {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;

    public FileContentLoader(FileAggregateRepositoryInterface repository, FileStorageInterface storage) {
        this.repository = repository;
        this.storage = storage;
    }

    public Loaded load(FileId id) {
        FileSnapshot file = this.repository.findById(id)
            .orElseThrow(StoredFileNotFoundException::new)
            .toSnapshot();

        InputStream content = this.storage.load(file.storageKey());

        return new Loaded(file, content);
    }

    public record Loaded(FileSnapshot file, InputStream content) {
    }
}
