package vantaCore.application.file.appliaction;

import vantaCore.application.file.domain.vo.FileId;

/** Single place defining the public (permitAll) URL shape for USER_AVATAR/EDITOR_IMAGE files - kept
 in sync with PublicFileController's @RequestMapping by construction, since both reference this. */
final public class PublicFileUrl {

    public static final String PATH_PREFIX = "/web-api/file";

    private PublicFileUrl() {}

    public static String of(FileId id) {
        return PATH_PREFIX + "/" + id.value();
    }
}
