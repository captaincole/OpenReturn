/*
 * Light/dark theme. The theme is the data-theme attribute on <html>;
 * app/globals.css swaps the color variables on it. THEME_INIT_SCRIPT runs
 * before first paint (app/layout.tsx), so a page never flashes the wrong
 * theme: the saved choice wins, else the system preference.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "summa-theme";

export const THEME_INIT_SCRIPT = `try {
  var saved = localStorage.getItem("${STORAGE_KEY}");
  document.documentElement.dataset.theme =
    saved === "light" || saved === "dark"
      ? saved
      : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
} catch (e) {}`;

/*
 * Switch to the other theme and remember the choice. Transitions pause for
 * the switch (.theme-switching in globals.css): otherwise elements with
 * transition-colors fade while the rest of the page snaps.
 */
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
