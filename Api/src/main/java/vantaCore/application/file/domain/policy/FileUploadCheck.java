package vantaCore.application.file.domain.policy;

import vantaCore.application.file.domain.vo.FileOwnerType;

public record FileUploadCheck(
    FileOwnerType ownerType,
    String contentType,
    long sizeBytes
) {
}
