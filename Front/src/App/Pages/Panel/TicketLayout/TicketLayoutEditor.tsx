import {useState} from 'react';
import type {ReactNode} from 'react';
import {Plus, RotateCcw, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import TicketWidgetGrid from '../Project/Tickets/TicketWidgetGrid';
import TicketWidgetCard from '../Project/Tickets/TicketWidgets/TicketWidgetCard';
import {WIDGET_TITLES, WIDGET_DEFAULT_SIZE, editableWidgetIdsForSlot, nextWidgetPosition} from '../Project/Tickets/TicketWidgets/widgetRegistry';
import type {TicketLayoutSlot, WidgetId, WidgetLayoutItem} from '@/lib/TicketLayout/Type/types';

type TicketLayoutEditorProps = {
  slot: TicketLayoutSlot;
  // The slot's CURRENT effective layout (its saved override, or the
  // built-in template if it has none yet) - the editor's own starting point.
  initialLayout: WidgetLayoutItem[];
  // The slot's built-in starting layout, regardless of any saved override -
  // what "Reset to default" reverts to. Empty for 'custom' (no built-in).
  builtInLayout: WidgetLayoutItem[];
  onSave: (layout: WidgetLayoutItem[]) => void;
  onCancel: () => void;
};

// Placeholder tile content - no real ticket is loaded here (this is a
// settings-page editor, not a real ticket view), just enough to see what's
// where and grab it. The X only shows up in this editor; TicketWidgetGrid
// itself stays agnostic of what's inside a tile (see its own comment).
const EditorTile = ({widgetId, onRemove}: {widgetId: WidgetId; onRemove: () => void}) => (
  <TicketWidgetCard className="relative items-center justify-center gap-1 text-center">
    <span className="text-sm font-medium text-foreground">{WIDGET_TITLES[widgetId]}</span>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disableRipple
      onClick={onRemove}
      className="absolute right-2 top-2 h-6 w-6 min-w-0 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
    >
      <X className="h-4 w-4" />
    </Button>
  </TicketWidgetCard>
);

// Drag+resize editor for one layout slot - reachable from
// TicketLayoutPreferenceSection's "Edit" button on any of the 4 slots
// (including 'default', which can only rearrange/resize its existing 2
// widgets - see editableWidgetIdsForSlot's own comment for why). Purely
// local state until Save; Cancel/navigating away discards it.
const TicketLayoutEditor = ({slot, initialLayout, builtInLayout, onSave, onCancel}: TicketLayoutEditorProps) => {
  const [layout, setLayout] = useState<WidgetLayoutItem[]>(initialLayout);

  const placedIds = new Set(layout.map((item) => item.widgetId));
  const addableIds = editableWidgetIdsForSlot(slot).filter((id) => !placedIds.has(id));

  const handleAdd = (widgetId: WidgetId) => {
    const {w, h} = WIDGET_DEFAULT_SIZE[widgetId];
    const {x, y} = nextWidgetPosition(layout);
    setLayout((current) => [...current, {widgetId, x, y, w, h}]);
  };

  const handleRemove = (widgetId: WidgetId) => {
    setLayout((current) => current.filter((item) => item.widgetId !== widgetId));
  };

  const widgets: Partial<Record<WidgetId, ReactNode>> = {};
  layout.forEach((item) => {
    widgets[item.widgetId] = <EditorTile widgetId={item.widgetId} onRemove={() => handleRemove(item.widgetId)} />;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Editing layout</p>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setLayout(builtInLayout)} disabled={builtInLayout.length === 0}>
            Reset to default
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(layout)}>
            Save
          </Button>
        </div>
      </div>

      {addableIds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Add a section</p>
          <div className="flex flex-wrap gap-2">
            {addableIds.map((widgetId) => (
              <Button key={widgetId} variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => handleAdd(widgetId)}>
                {WIDGET_TITLES[widgetId]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {layout.length === 0 ? (
        <p className="text-sm text-muted-foreground">Empty - add a section above to start building this layout.</p>
      ) : (
        <TicketWidgetGrid layout={layout} widgets={widgets} editable onLayoutChange={setLayout} />
      )}
    </div>
  );
};

export default TicketLayoutEditor;
