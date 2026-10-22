"use client";

/*
 * Light/dark switch for the top bars. The icon follows <html data-theme>
 * through the `light:` variant, so the button keeps no React state and
 * server and client render the same markup.
 */

import { toggleTheme } from "@/lib/theme";

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      title="Switch light / dark theme"
      aria-label="Switch light / dark theme"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
    >
      <span className="light:hidden">
        <SunIcon />
      </span>
      <span className="hidden light:block">
        <MoonIcon />
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
