package vantaCore.application.file.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.storage.StorageDirectory;
import vantaCore.application.file.domain.vo.FileId;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

@Component
public class LocalDiskFileStorageAdapter implements FileStorageInterface {

    private static final Pattern SAFE_EXTENSION = Pattern.compile("\\.[A-Za-z0-9]{1,16}");

    private final Path root;

    public LocalDiskFileStorageAdapter(@Value("${app.storage.root}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    @Override
    public String store(StorageDirectory directory, FileId fileId, InputStream content, String originalFilename) {
        String key = directory.path() + "/" + fileId.value() + extensionOf(originalFilename);
        Path target = resolve(key);

        try (InputStream in = content) {
            Files.createDirectories(target.getParent());
            Files.copy(in, target);
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to store file", exception);
        }

        return key;
    }

    @Override
    public InputStream load(String storageKey) {
        try {
            return Files.newInputStream(resolve(storageKey));
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to load file", exception);
        }
    }

    @Override
    public void delete(String storageKey) {
        Path file = resolve(storageKey);

        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to delete file", exception);
        }

        deleteEmptyParents(file.getParent());
    }

    // Walks up from the deleted file's directory, removing each directory that's now empty, and
    // stops at the first non-empty one (or the root itself) - so e.g. a ticket's folder disappears
    // with its last attachment instead of piling up as empty directories. Best effort: a
    // concurrent upload into the same directory just makes the delete fail as non-empty, which is
    // exactly the "stop here" signal anyway.
    private void deleteEmptyParents(Path directory) {
        Path current = directory;

        while (current != null && current.startsWith(this.root) && !current.equals(this.root)) {
            try {
                Files.delete(current);
            } catch (IOException exception) {
                return;
            }
            current = current.getParent();
        }
    }

    // storageKey is always our own id-based key (see store()), but resolve defensively against a
    // path-traversal payload sneaking in through a corrupted/tampered value regardless.
    private Path resolve(String storageKey) {
        Path resolved = this.root.resolve(storageKey).normalize();

        if (!resolved.startsWith(this.root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }

        return resolved;
    }

    private String extensionOf(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }

        int dot = originalFilename.lastIndexOf('.');
        String extension = dot >= 0 ? originalFilename.substring(dot) : "";

        // Only a short plain extension is kept - it's the one user-supplied part of the key, so
        // anything with separators/odd characters (or long enough to overflow storage_key's
        // varchar(255) on top of the directory path) is dropped rather than written into the key.
        return SAFE_EXTENSION.matcher(extension).matches() ? extension : "";
    }
}
