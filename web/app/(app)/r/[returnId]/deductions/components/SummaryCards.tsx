"use client";

/* The cards of the Deductions summary. Every number comes from /app/state: the engine's. */

import { cn } from "@/lib/cn";
import {
  dollars,
  lifeAnswerLabel,
  outcomeLabel,
  signedDollars,
  statusLabel,
  type DeductionItem,
  type DeductionRecord,
  type DeductionsView,
  type ItemStatus,
  type JurisdictionComparison,
  type LifeQuestion,
  type NamedExpense,
} from "@/lib/deductions";
import { useState } from "react";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="card-header">{title}</div>
      {children}
    </section>
  );
}

/* A list the reader can close. The summary is long, and the comparison above the lists is the answer. */
function ListCard({
  title,
  count,
  startOpen = false,
  children,
}: {
  title: string;
  count?: number;
  startOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          "card-header w-full text-left transition-colors hover:text-ink-secondary",
          !open && "pb-4",
        )}
      >
        <span>{title}</span>
        <span className="flex items-center gap-2.5 tracking-normal normal-case">
          {count !== undefined && <span className="tabular-nums">{count}</span>}
          <span
            className={cn("text-xs transition-transform duration-150", open && "rotate-90")}
            aria-hidden
          >
            ▸
          </span>
        </span>
      </button>
      {open && children}
    </section>
  );
}

const RESULT_LABELS: Record<JurisdictionComparison["recommendation"], string> = {
  itemize: "Itemize",
  standard: "Standard deduction",
};

type ComparisonRow = { label: string; value: (side: JurisdictionComparison) => string };

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Itemized deductions", value: (side) => dollars(side.itemized) },
  { label: "Standard deduction", value: (side) => dollars(side.standard) },
  { label: "Itemized less standard", value: (side) => signedDollars(side.margin) },
  { label: "Result", value: (side) => RESULT_LABELS[side.recommendation] },
];

export function ComparisonCard({ view }: { view: DeductionsView }) {
  const { federal, ca } = view.comparison;
  const anyRough = view.items.some((item) => item.assumed);
  if (!federal && !ca) {
    return (
      <Card title="Itemize or standard">
        <p className="px-5 pt-1 pb-5 text-sm leading-relaxed text-ink-muted">
          {view.next.step === "wait_for_return"
            ? view.next.why
            : "The comparison shows here when Cade has the amounts."}
        </p>
      </Card>
    );
  }
  const cell = (side: JurisdictionComparison | null, row: ComparisonRow) =>
    side ? row.value(side) : "—";
  return (
    <Card title="Itemize or standard">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-ink-muted">
            <th className="px-5 pb-2 text-left font-normal" />
            <th className="px-2 pb-2 text-right font-normal">Federal</th>
            <th className="pr-5 pb-2 pl-2 text-right font-normal">California</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr
              key={row.label}
              className="border-t border-border-subtle last:font-medium last:text-ink-primary"
            >
              <th className="py-2.5 pr-2 pl-5 text-left font-normal text-ink-secondary">
                {row.label}
              </th>
              <td className="px-2 py-2.5 text-right tabular-nums">{cell(federal, row)}</td>
              <td className="py-2.5 pr-5 pl-2 text-right tabular-nums">{cell(ca, row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {anyRough && (
        <p className="border-t border-border-subtle px-5 py-3 text-[12px] leading-relaxed text-warn">
          The comparison uses a rough amount. Cade needs the exact amount before the return is ready
          to file.
        </p>
      )}
    </Card>
  );
}

const STATUS_TONES: Record<ItemStatus, string> = {
  unasked: "text-ink-muted",
  closed: "text-ink-muted",
  open: "text-warn",
  assumed: "text-warn",
  exact: "text-ok",
  below_floor: "text-ink-muted",
  for_cpa: "text-warn",
};

export function ItemsCard({ items }: { items: DeductionItem[] }) {
  return (
    <ListCard title="Deductions" count={items.length} startOpen>
      <ul className="pb-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline gap-3 border-t border-border-subtle px-5 py-2.5 text-sm"
          >
            {/* On a phone the status goes under the title: three columns leave the title no room. */}
            <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
              <span className="block min-w-0 flex-1 text-ink-primary">{item.title}</span>
              <span className={cn("block shrink-0 text-[12px]", STATUS_TONES[item.status])}>
                {statusLabel(item.status)}
              </span>
            </div>
            <span className="w-24 shrink-0 text-right text-ink-primary tabular-nums">
              {item.amount === null ? "—" : dollars(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </ListCard>
  );
}

/* What the taxpayer named at the open door, in their words, and where Cade put it. */
export function NamedExpensesCard({ expenses }: { expenses: NamedExpense[] }) {
  if (expenses.length === 0) return null;
  return (
    <ListCard title="What else you paid" count={expenses.length}>
      <ul className="pb-2">
        {expenses.map((expense) => (
          <li key={expense.slug} className="border-t border-border-subtle px-5 py-2.5 text-sm">
            <div className="flex items-baseline gap-3">
              <span className="min-w-0 flex-1 text-ink-primary">{expense.words}</span>
              <span className="shrink-0 text-[12px] text-ink-secondary">
                {outcomeLabel(expense.outcome)}
              </span>
            </div>
            {expense.where && (
              <div className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                {expense.where}
              </div>
            )}
          </li>
        ))}
      </ul>
    </ListCard>
  );
}

/* The amounts on an itemized return that the CPA checks against the taxpayer's records. */
export function RecordsCard({ records }: { records: DeductionRecord[] }) {
  if (records.length === 0) return null;
  return (
    <ListCard title="Records for the CPA" count={records.length}>
      <ul className="pb-2">
        {records.map((record) => (
          <li key={record.item} className="border-t border-border-subtle px-5 py-2.5 text-sm">
            <div className="flex items-baseline gap-3">
              <span className="min-w-0 flex-1 text-ink-primary">{record.title}</span>
              <span className="shrink-0 text-ink-primary tabular-nums">
                {dollars(record.amount)}
              </span>
            </div>
            {record.sourceNotes.map((note, index) => (
              <div key={index} className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                {note}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </ListCard>
  );
}

export function LifeAnswersCard({ questions }: { questions: LifeQuestion[] }) {
  return (
    <ListCard title="Your year">
      <ul className="pb-2">
        {questions.map((question) => (
          <li
            key={question.id}
            className="flex items-baseline gap-3 border-t border-border-subtle px-5 py-2.5 text-sm"
          >
            <span className="min-w-0 flex-1 text-ink-secondary">{question.ask}</span>
            <span
              className={cn(
                "shrink-0 text-[12px]",
                question.status === "unasked" ? "text-ink-muted" : "text-ink-primary",
              )}
            >
              {lifeAnswerLabel(question.status)}
            </span>
          </li>
        ))}
      </ul>
    </ListCard>
  );
}
