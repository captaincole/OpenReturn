"use client";

import { useAppShell } from "@/components/AppShell";
import type { IncomeSoFar } from "@/lib/api";

const SOURCES: Array<[keyof IncomeSoFar, string]> = [
  ["wages", "Wages"],
  ["interest", "Interest"],
  ["dividends", "Dividends"],
  ["capitalGains", "Capital gains"],
  ["other", "Other"],
];

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/*
 * The income Cade has recorded so far, from the draft Form 1040. It grows with
 * each document, and it shows while questions are still open, so it is not the
 * figure on the finished return.
 */
export function IncomeCard() {
  const { state, activeReturn } = useAppShell();
  const income = state?.incomeSoFar;
  if (!income) return null;
  const sources = SOURCES.filter(([key]) => income[key] !== 0);

  return (
    <section className="card" aria-label="Income so far">
      <div className="card-header">
        <span>Income so far</span>
        <span className="tracking-normal text-ink-muted normal-case">{activeReturn.year}</span>
      </div>
      <div className="px-5 pb-5">
        <div className="font-serif text-3xl text-ink-primary tabular-nums">
          {dollars.format(income.total)}
        </div>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Upload a W-2 or a 1099 and your income shows here.
          </p>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
              {sources.map(([key, label]) => (
                <div key={key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-secondary">{label}</dt>
                  <dd className="text-ink-primary tabular-nums">{dollars.format(income[key])}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-ink-muted">
              A running total from what Cade has recorded. It can change before the return is final.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
