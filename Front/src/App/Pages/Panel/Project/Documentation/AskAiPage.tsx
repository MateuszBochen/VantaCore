import {useState} from 'react';
import {Link, useOutletContext} from 'react-router-dom';
import {Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import useAskDocumentationHook from '@/lib/Project/useAskDocumentationHook';
import type {DocumentationOutletContext} from './DocumentationPage';
import type {DocumentationAskAnswer, DocumentationAskSource} from '@/lib/Project/Type/types';

// source.projectId is the main project's id (same as the one this whole
// page is already scoped to); source.sourceId is the sub-project's id for
// every SUB_PROJECT_* type, null for the two project-level types
// (architectureOverview/api have no sub-project to point at). There's no
// separate per-ADR-entry id in this contract, so an ADR source lands on the
// sub-project's ADR tab generally rather than one specific entry.
const buildSourceLink = (currentProjectId: string, source: DocumentationAskSource): string => {
  const base = `/projects/${currentProjectId}/documentation`;

  if (source.sourceType.startsWith('SUB_PROJECT')) {
    if (!source.sourceId) return base;
    const subProjectPath = `${base}/sub-projects/${source.sourceId}`;

    if (source.sourceType.includes('ADR')) return `${subProjectPath}?docType=adr`;
    if (source.sourceType.includes('IMPACT')) return `${subProjectPath}?docType=impact-analysis`;
    if (source.sourceType.includes('SOLUTION')) return `${subProjectPath}?docType=solution-design`;
    if (source.sourceType.includes('SCOPE')) return `${subProjectPath}?docType=scope`;
    return subProjectPath;
  }

  if (source.sourceType.includes('API')) return `${base}/platform?category=api`;
  return `${base}/platform?category=architecture-overview`;
};

// POST /api/project/:id/documentation/ask - generative Q&A over everything
// indexed from this project's docs (Platform Docs entity descriptions,
// architectureOverview/api, plus each sub-project's ADRs/scope/impact
// analysis/solution design). Not wired to onProjectChange/Submit like the
// other Documentation pages - this is a read-only query, nothing here is
// part of the project's own saved state.
const AskAiPage = () => {
  const {project} = useOutletContext<DocumentationOutletContext>();
  const {askDocumentation} = useAskDocumentationHook();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<DocumentationAskAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    askDocumentation(project.id, trimmed)
      .then((result) => {
        if (result.success) {
          setAnswer(result.answer);
        } else {
          setAnswer(null);
          setError(result.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Ask AI</p>
        <p className="text-xs text-muted-foreground">
          Ask a question about this project's documentation — domains, components, business rules, ADRs.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          rows={3}
          placeholder="e.g. What business rules must be met to add a new contract to a user?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleAsk();
            }
          }}
        />
        <Button
          className="self-end"
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={handleAsk}
          loading={loading}
          disabled={!question.trim()}
        >
          Ask
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Thinking…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : answer ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground">{answer.answer}</p>
            </div>

            {answer.sources.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Sources ({answer.sources.length})
                </p>
                <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {answer.sources.map((source, index) => (
                    <Link
                      key={`${source.sourceType}-${source.sourceId ?? index}`}
                      to={buildSourceLink(project.id, source)}
                      className="flex flex-col gap-0.5 px-3 py-2 hover:bg-muted"
                    >
                      <span className="text-sm text-foreground">{source.label}</span>
                      <span className="text-xs text-muted-foreground">{source.excerpt}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ask a question to get started.</p>
        )}
      </div>
    </div>
  );
};

export default AskAiPage;
