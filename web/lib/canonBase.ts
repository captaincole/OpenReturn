export function canonUrl(path: string): string {
  return `/api/canon${path.startsWith("/") ? path : `/${path}`}`;
}
