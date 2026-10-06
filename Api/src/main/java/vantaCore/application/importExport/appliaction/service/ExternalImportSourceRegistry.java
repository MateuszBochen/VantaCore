package vantaCore.application.importExport.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.domain.source.ExternalImportSourceInterface;
import vantaCore.application.importExport.domain.vo.ImportProvider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Looks up the ExternalImportSourceInterface bean for JIRA/AZURE_DEVOPS - shared by
 PreviewImportConnectionQueryHandler and ImportJobRunner instead of each building their own
 provider->source map. */
@Component
public class ExternalImportSourceRegistry {

    private final Map<ImportProvider, ExternalImportSourceInterface> sources;

    public ExternalImportSourceRegistry(List<ExternalImportSourceInterface> sources) {
        this.sources = new HashMap<>();
        for (ExternalImportSourceInterface source : sources) {
            this.sources.put(source.provider(), source);
        }
    }

    public ExternalImportSourceInterface get(ImportProvider provider) {
        ExternalImportSourceInterface source = this.sources.get(provider);
        if (source == null) {
            throw new IllegalStateException("No import source registered for " + provider);
        }
        return source;
    }
}
