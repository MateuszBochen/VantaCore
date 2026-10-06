import {useSearchParams} from 'react-router-dom';
import DomainsGraph from './DomainsGraph';
import BoundedContextsGraph from './BoundedContextsGraph';
import ComponentsGraph from './ComponentsGraph';
import DataFlowGraph from './DataFlowGraph';
import type {PlatformDocumentation} from '@/lib/Project/Type/types';

type DomainsDrilldownProps = {
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
};

// Orchestrates the domains -> bounded-contexts -> components -> data-flow
// drill-down via ?domainId=&contextId=&componentId= - each level is its own
// graph, descending into a node scopes the next graph to it (and going back
// just clears the deeper param).
const DomainsDrilldown = ({platformDocumentation, onChange}: DomainsDrilldownProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainId = searchParams.get('domainId');
  const contextId = searchParams.get('contextId');
  const componentId = searchParams.get('componentId');

  const openDomain = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('domainId', id);
      next.delete('contextId');
      next.delete('componentId');
      return next;
    });
  };

  const openContext = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('contextId', id);
      next.delete('componentId');
      return next;
    });
  };

  const openComponent = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('componentId', id);
      return next;
    });
  };

  const backToDomains = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('domainId');
      next.delete('contextId');
      next.delete('componentId');
      return next;
    });
  };

  const backToContexts = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('contextId');
      next.delete('componentId');
      return next;
    });
  };

  const backToComponents = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('componentId');
      return next;
    });
  };

  const selectedDomain = platformDocumentation.domains.find((domain) => domain.id === domainId) ?? null;

  if (selectedDomain) {
    const selectedContext = contextId
      ? platformDocumentation.boundedContexts.find(
          (context) => context.id === contextId && context.domainId === selectedDomain.id,
        ) ?? null
      : null;

    if (selectedContext) {
      const selectedComponent = componentId
        ? platformDocumentation.components.find(
            (component) => component.id === componentId && component.boundedContextId === selectedContext.id,
          ) ?? null
        : null;

      if (selectedComponent) {
        return (
          <DataFlowGraph
            component={selectedComponent}
            platformDocumentation={platformDocumentation}
            onChange={onChange}
            onBack={backToComponents}
          />
        );
      }

      return (
        <ComponentsGraph
          boundedContext={selectedContext}
          platformDocumentation={platformDocumentation}
          onChange={onChange}
          onBack={backToContexts}
          onOpenComponent={openComponent}
        />
      );
    }

    return (
      <BoundedContextsGraph
        domain={selectedDomain}
        platformDocumentation={platformDocumentation}
        onChange={onChange}
        onBack={backToDomains}
        onOpenContext={openContext}
      />
    );
  }

  return <DomainsGraph platformDocumentation={platformDocumentation} onChange={onChange} onOpenDomain={openDomain} />;
};

export default DomainsDrilldown;
