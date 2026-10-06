import type {SprintRail} from './useSprintRail';

export type SelectedEntry = SprintRail['selected'][number];

// Sentinel parent key for descendants whose nearest ancestor in the
// hierarchy isn't itself selected in the sprint - they nest directly under
// the root's own island instead.
export const ROOT_KEY = '__root';

// Groups the sprint's selected descendants (of one root) by their NEAREST
// SELECTED ancestor - not their real immediate parent - so e.g. a selected
// grandchild whose parent wasn't put in the sprint still nests under
// whichever selected ancestor it actually has, skipping the unselected ones
// in between. Only tickets the user actually added to the sprint show up
// here at all (per explicit ask - not the full real subtree).
export const buildChildrenByParent = (entries: SelectedEntry[]): Map<string, SelectedEntry[]> => {
  const selectedIds = new Set(entries.map((entry) => entry.ticket.id));
  const map = new Map<string, SelectedEntry[]>();

  entries.forEach((entry) => {
    let parentKey = ROOT_KEY;

    for (let i = entry.path.length - 2; i >= 1; i -= 1) {
      const candidate = entry.path[i];

      if (selectedIds.has(candidate.id)) {
        parentKey = candidate.id;
        break;
      }
    }

    const siblings = map.get(parentKey) ?? [];
    siblings.push(entry);
    map.set(parentKey, siblings);
  });

  return map;
};
