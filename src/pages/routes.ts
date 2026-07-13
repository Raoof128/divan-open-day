export const CONTEXT_ROUTES = [
  '/about',
  '/credits',
  '/accessibility',
  '/privacy',
  '/offline',
] as const;

export type ContextRoute = (typeof CONTEXT_ROUTES)[number];

export function contextRoute(pathname: string): ContextRoute | null {
  return CONTEXT_ROUTES.find((route) => route === pathname) ?? null;
}
