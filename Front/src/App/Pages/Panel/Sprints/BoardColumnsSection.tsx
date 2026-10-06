import {useEffect, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import type {Project} from '@/lib/Project/Type/types';
import type {BoardColumn} from '@/lib/Board/Type/types';
import BoardColumnCard from './BoardColumnCard';

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createColumn = (index: number): BoardColumn => ({
  id: crypto.randomUUID(),
  name: 'New column',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  statusIds: [],
});

type BoardColumnsSectionProps = {
  projectIds: string[];
  columns: BoardColumn[];
  onChange: (columns: BoardColumn[]) => void;
};

// Same add/remove/update-one-in-place convention as IssueTypesSection - the
// difference here is a column's statuses come from the *union* of every
// linked project's issue types (see BoardColumnCard), so this also fetches
// full project data (cache-backed via useGetProjectHook, same as everywhere
// else that needs issueTypes/statuses) for whichever projects are linked.
const BoardColumnsSection = ({projectIds, columns, onChange}: BoardColumnsSectionProps) => {
  const {getProject} = useGetProjectHook();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all(projectIds.map((id) => getProject(id))).then((results) => {
      if (!cancelled) {
        const loaded = results.flatMap((result) => (result.success ? [result.project] : []));
        setProjects(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is a thin useRequestHook wrapper recreated every render; projectIds is joined below since arrays aren't referentially stable across renders
  }, [projectIds.join(',')]);

  const handleAdd = () => {
    const column = createColumn(columns.length);
    onChange([...columns, column]);
    setExpandedId(column.id);
  };

  const handleUpdate = (updated: BoardColumn) => {
    onChange(columns.map((column) => (column.id === updated.id ? updated : column)));
  };

  const handleRemove = (id: string) => {
    onChange(columns.filter((column) => column.id !== id));
  };

  // Column order IS the board's display order (see memory:
  // project_vantacore_boards_concept), so swapping with the adjacent
  // column is all a "move" needs to do.
  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= columns.length) {
      return;
    }

    const reordered = [...columns];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onChange(reordered);
  };

  if (projectIds.length === 0) {
    return <p className="text-sm text-muted-foreground">Pick at least one project in the Projects step first.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Define columns, then pick which statuses land in each one.</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add column
        </Button>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No columns yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {columns.map((column, index) => (
            <BoardColumnCard
              key={column.id}
              column={column}
              projects={projects}
              expanded={expandedId === column.id}
              canMoveUp={index > 0}
              canMoveDown={index < columns.length - 1}
              onToggleExpand={() => setExpandedId((current) => (current === column.id ? null : column.id))}
              onChange={handleUpdate}
              onRemove={() => handleRemove(column.id)}
              onMoveUp={() => handleMove(index, -1)}
              onMoveDown={() => handleMove(index, 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardColumnsSection;
