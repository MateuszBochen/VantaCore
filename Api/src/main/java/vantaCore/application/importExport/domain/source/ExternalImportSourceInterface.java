package vantaCore.application.importExport.domain.source;

import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.vo.ImportProvider;

/** One implementation per JIRA/AZURE_DEVOPS (see JiraImportSource/AzureDevOpsImportSource) - CSV
 has no equivalent, it works from an uploaded file stream, not a live connection (see
 CsvImportParser, used directly by ImportJobRunner instead of through this port). */
public interface ExternalImportSourceInterface {

    ImportProvider provider();

    /** First page/sample only - backs GET .../import/connection/{id}/preview. */
    ImportPreview preview(ImportConnectionSnapshot connection);

    /** pageToken null = first page. Loop until the returned page's nextPageToken is null - see
     ImportJobRunner. Paginating rather than fetching everything at once keeps a job on
     thousands of issues from holding the whole result set in memory (see this sub-project's own
     risk analysis). */
    ImportSourcePage fetchPage(ImportConnectionSnapshot connection, String pageToken);

    /** One attachment's full bytes, authenticated the same way as fetchPage/preview. A plain
     byte[] rather than an InputStream - the only supported-media-type-agnostic way to read an
     arbitrary attachment's body through RestClient's HttpMessageConverter machinery is
     ByteArrayHttpMessageConverter (body(byte[].class), which accepts any content type); there's no
     equivalent generic converter for InputStream.class, and the caller buffers the whole thing into
     memory immediately anyway (see FileUploadPayload). */
    byte[] downloadAttachment(ImportConnectionSnapshot connection, String downloadUrl);
}
