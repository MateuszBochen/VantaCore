import {ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';

type LoadMoreButtonProps = {
  loaded: number;
  // Total across every page (meta.total / a search section's total).
  total: number;
  loading: boolean;
  onClick: () => void;
};

// The one "Load more (x of y)" for every paginated list (tickets, search
// results, audit log, releases, automation history) - outline + chevron,
// the style AuditLogPage already used before this was shared - so they
// can't drift into differently-styled variants again. Whether there IS more
// to load stays the caller's call - it knows its own paging state.
const LoadMoreButton = ({loaded, total, loading, onClick}: LoadMoreButtonProps) => (
  <Button variant="outline" size="sm" leftIcon={<ChevronDown className="h-4 w-4" />} onClick={onClick} loading={loading} className="w-fit">
    Load more ({loaded} of {total})
  </Button>
);

export {LoadMoreButton};
