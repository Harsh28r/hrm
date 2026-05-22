/** Match leaf href against current path + query (CRM-style active states). */
export function isNavHrefActive(pathname: string, search: string, href: string): boolean {
  const [path, query] = href.split("?");
  const pathOk =
    path === "/"
      ? pathname === "/" || pathname === ""
      : pathname === path || pathname.startsWith(`${path}/`);

  if (!pathOk) return false;
  if (path === "/attendance" && pathname.startsWith("/attendance/")) return false;
  if (!query) return true;
  const params = new URLSearchParams(query);
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [key, value] of params.entries()) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

export function isGroupActive(pathname: string, search: string, childHrefs: string[]): boolean {
  return childHrefs.some((href) => isNavHrefActive(pathname, search, href));
}
