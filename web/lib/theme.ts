/* THEME_INIT_SCRIPT runs before first paint, so a page never flashes the wrong theme. */

export type Theme = "light" | "dark";

const STORAGE_KEY = "openreturn-theme";

export const THEME_INIT_SCRIPT = `try {
  var saved = localStorage.getItem("${STORAGE_KEY}");
  document.documentElement.dataset.theme =
    saved === "light" || saved === "dark"
      ? saved
      : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
} catch (e) {}`;

/* Pause transitions for the switch: else transition-colors elements fade while the rest snaps. */
export function toggleTheme(): Theme {
  const root = document.documentElement;
  const next: Theme = root.dataset.theme === "light" ? "dark" : "light";
  root.classList.add("theme-switching");
  root.dataset.theme = next;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove("theme-switching")),
  );
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage blocked (private window): the theme still applies to this page.
  }
  return next;
}
