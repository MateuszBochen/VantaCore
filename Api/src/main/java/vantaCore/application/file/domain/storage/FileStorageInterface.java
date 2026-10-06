package vantaCore.application.file.domain.storage;

import vantaCore.application.file.domain.vo.FileId;

import java.io.InputStream;

/** Port over the physical blob storage - local disk today (see LocalDiskFileStorageAdapter), could
 become an S3/object-storage adapter later without touching anything above this interface. */
public interface FileStorageInterface {

    /** Stores content as {directory}/{fileId}{extension of originalFilename} and returns that key.
     Callers pick only the directory (via StorageDirectory's factories) and the file's own id - never
     free text - which avoids path traversal/collisions from user-supplied filenames. Consumes (and
     closes) the stream by copying it straight to the backing store, without buffering the whole
     file into memory first. */
    String store(StorageDirectory directory, FileId fileId, InputStream content, String originalFilename);

    InputStream load(String storageKey);

    void delete(String storageKey);
}
