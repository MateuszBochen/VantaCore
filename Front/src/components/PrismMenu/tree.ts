import type {MenuItem, MenuLevel} from './types';

export const FACE_COUNT = 4;

export const physicalFace = (depth: number): number => ((depth % FACE_COUNT) + FACE_COUNT) % FACE_COUNT;

export const levelAt = (root: MenuLevel, path: number[], depth: number): MenuLevel | null => {
  let level: MenuLevel | null = root;

  for (let index = 0; index < depth; index++) {
    const item: MenuItem | undefined = level?.items[path[index]];
    level = item?.subMenu ?? null;
    if (!level) {
      return null;
    }
  }

  return level;
};

// Path of "descend" indices needed to reach the level that directly *contains*
// the active item - not the active item itself (it may be a leaf with no
// subMenu of its own, so descending into it would have nothing to show).
//
// A parent's `active` flag stays true on any nested route below it (see
// `linkMatchesPathname`), so a shallower item and a deeper one can both be
// active at once (e.g. a project item on `/projects/abc` and its own
// "Settings" item on `/projects/abc/settings`). Deeper subMenus are checked
// FIRST so the most specific match wins - only fall back to `items.some(active)`
// at this level once no descendant level matched more precisely.
const findContainingLevelPath = (level: MenuLevel): number[] | null => {
  for (let index = 0; index < level.items.length; index++) {
    const item = level.items[index];

    if (item.subMenu) {
      const nested = findContainingLevelPath(item.subMenu);
      if (nested) {
        return [index, ...nested];
      }

      // No child of this item's subMenu matched (e.g. a "new X" route with no
      // menu entry of its own), but the item's own link still matches the
      // route as a prefix - stay drilled into its subMenu rather than falling
      // back to this shallower level.
      if (item.active) {
        return [index];
      }
    }
  }

  if (level.items.some((item) => item.active)) {
    return [];
  }

  return null;
};

export const findActivePath = (level: MenuLevel): number[] => findContainingLevelPath(level) ?? [];

// A link is active for its own path AND any nested route below it (e.g. a
// "/projects/abc" item stays active on "/projects/abc/settings"), matched on
// a path boundary so "/projects/abc" doesn't false-positive on "/projects/abcdef".
const linkMatchesPathname = (link: string, pathname: string): boolean =>
  pathname === link || pathname.startsWith(`${link}/`);

// Derives `active` from the current route instead of requiring the menu tree
// authors to compute and pass it themselves for every leaf.
export const decorateActive = (level: MenuLevel, pathname: string): MenuLevel => ({
  ...level,
  items: level.items.map((item) => ({
    ...item,
    active: item.link !== null && linkMatchesPathname(item.link, pathname),
    subMenu: item.subMenu ? decorateActive(item.subMenu, pathname) : undefined,
  })),
});

export type BreadcrumbSegment = {label: string; link: string | null};

// Walks an ALREADY-decorateActive'd tree, collecting {label, link} for every
// active item from the root down to the deepest match - unlike
// findActivePath/findContainingLevelPath (which only need the *containing*
// level's index path for PrismMenu's own face rendering), this needs the
// full label/link chain, all the way to the leaf. Same "deepest match wins"
// shape as findContainingLevelPath: a folder item (link: null, e.g. the
// top-level "Projects") is never `active` itself, so it's only kept when its
// OWN subMenu contains a real match (`nested.length > 0`) - the `item.active`
// check is the same fallback findContainingLevelPath uses for a linked item
// whose subMenu has no menu entry for the current sub-route (e.g. a ticket's
// own detail page has no menu item, but the project it belongs to should
// still show in the trail).
export const findBreadcrumbTrail = (level: MenuLevel): BreadcrumbSegment[] => {
  for (const item of level.items) {
    if (item.subMenu) {
      const nested = findBreadcrumbTrail(item.subMenu);

      if (nested.length > 0) {
        return [{label: item.label, link: item.link}, ...nested];
      }

      if (item.active) {
        return [{label: item.label, link: item.link}];
      }

      continue;
    }

    if (item.active) {
      return [{label: item.label, link: item.link}];
    }
  }

  return [];
};
