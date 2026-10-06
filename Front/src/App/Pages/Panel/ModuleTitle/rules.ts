type ModuleTitleRule = {
  test: (pathname: string) => boolean;
  title: string;
};

// Static fallback, matched by pathname alone - correct on first paint, refresh,
// and back/forward navigation without any page needing to opt in.
const RULES: ModuleTitleRule[] = [
  {test: (pathname) => pathname === '/projects/new', title: 'Creating project'},
  {test: (pathname) => /^\/projects\/[^/]+\/settings/.test(pathname), title: 'Project settings'},
  {test: (pathname) => /^\/projects\/[^/]+/.test(pathname), title: 'Project overview'},
  {test: (pathname) => pathname.startsWith('/sprints'), title: 'Sprints'},
  {test: (pathname) => pathname.startsWith('/settings'), title: 'Application settings'},
];

export const routeTitle = (pathname: string): string | null => RULES.find((rule) => rule.test(pathname))?.title ?? null;
