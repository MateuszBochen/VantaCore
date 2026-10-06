import type {ReactNode} from 'react';

export type MenuItem = {
  label: string;
  link: string | null;
  active?: boolean;
  // Fires on selection regardless of whether the item drills into a subMenu
  // or navigates - e.g. prefetching a project's data as soon as it's picked
  // from the list, rather than only once the user reaches an actual leaf
  // route (see Sidebar's use of useGetProjectHook).
  onClick?: () => void;
  subMenu?: MenuLevel;
};

export type MenuLevel = {
  items: MenuItem[];
  content?: ReactNode;
  footer?: ReactNode;
};
