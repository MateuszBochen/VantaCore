import {Link} from 'react-router-dom';
import {ChevronRight} from 'lucide-react';
import {useBreadcrumb} from './useBreadcrumb';
import type {BreadcrumbSegment} from '@/components/PrismMenu';

const HOME_SEGMENT: BreadcrumbSegment = {label: 'Home', link: '/'};

// Rendered above WorkPlaceHeader's title. Renders nothing (not even an empty
// row) when there's no trail - a route the PrismMenu tree doesn't cover and
// that hasn't called useSetBreadcrumb itself just gets no breadcrumb, not a
// blank line taking up space. The dashboard itself ("/") is the one route
// with no trail on purpose - it IS home, no point leading with a link back
// to itself.
const Breadcrumb = () => {
  const rawSegments = useBreadcrumb();

  if (rawSegments.length === 0) {
    return null;
  }

  const segments = [HOME_SEGMENT, ...rawSegments];

  return (
    <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      {segments.map((segment, index) => {
        // The current (last) segment is never a link, even if it has one -
        // it's "you are here", not somewhere else to navigate to.
        const isCurrent = index === segments.length - 1;

        return (
          <span key={`${segment.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
            {segment.link && !isCurrent ? (
              <Link to={segment.link} className="truncate hover:text-muted-foreground hover:underline">
                {segment.label}
              </Link>
            ) : (
              <span className={`truncate ${isCurrent ? 'text-muted-foreground' : ''}`}>{segment.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
