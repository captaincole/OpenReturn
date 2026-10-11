"use client";

import { type FormSummary } from "@/lib/api";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useMemo, useState } from "react";

type CategoryItemStatus = "done" | "doing" | "todo";

interface CategoryItem {
  id: string;
  label: string;
  status: CategoryItemStatus;
  note?: string;
}

interface Category {
  id: string;
  label: string;
  pct: number;
  items: CategoryItem[];
  /*
   * Filename substrings that filter user_documents into the per-category
   * "Documents" quick links. Hand-mapped until the agent tags uploads
   * with a category at ingest time.
   */
  docHints: string[];
  /*
   * Form IDs from state.forms to show as quick links. Each link shows
   * the form's current fill % inline, so the user sees what this
   * category becomes on the actual return.
   */
  formIds: string[];
}

/*
 * Static category definitions. When the agent gains a categorization
 * endpoint these become server-derived; until then, edit this file.
 */
export const CATEGORIES: Category[] = [
  {
    id: "filing",
    label: "Filing status",
    pct: 100,
    items: [
      { id: "f1", label: "Filing status", status: "done", note: "Single" },
      { id: "f2", label: "Dependents", status: "done", note: "None for 2025" },
      { id: "f3", label: "Residency (state)", status: "done", note: "Full-year California" },
    ],
    docHints: [],
    formIds: ["1040", "540"],
  },
  {
    id: "wages",
    label: "Wages",
    pct: 100,
    items: [
      { id: "w1", label: "W-2 wages", status: "done" },
      { id: "w2", label: "Federal withholding", status: "done" },
      {
        id: "w3",
        label: "Self-employment income (1099-NEC)",
        status: "todo",
        note: "Confirm none",
      },
    ],
    docHints: ["w-2", "w2", "1099-nec"],
    formIds: ["1040"],
  },
  {
    id: "investments",
    label: "Investments",
    pct: 20,
    items: [
      { id: "i1", label: "Dividends (1099-DIV)", status: "doing", note: "Luca is asking now" },
      { id: "i2", label: "Interest (1099-INT)", status: "done" },
      { id: "i3", label: "Capital gains (Schedule D / 8949)", status: "todo" },
      { id: "i4", label: "Crypto disposals", status: "todo" },
      { id: "i5", label: "Other investment income (1099-MISC, royalties)", status: "todo" },
    ],
    docHints: ["1099-int", "1099-div", "1099-b", "1099-misc", "k-1", "k1"],
    formIds: ["1040", "schedule-d", "8949"],
  },
  {
    id: "deductions",
    label: "Deductions",
    pct: 0,
    items: [
      {
        id: "d1",
        label: "Standard vs itemized comparison",
        status: "todo",
        note: "Decides which path is worth pursuing",
      },
      { id: "d2", label: "Charitable contributions", status: "todo" },
      { id: "d3", label: "Mortgage interest (Form 1098)", status: "todo" },
      { id: "d4", label: "State and local taxes (SALT)", status: "todo" },
      { id: "d5", label: "Medical expenses (over 7.5% of AGI)", status: "todo" },
    ],
    docHints: ["1098", "donation", "charity", "receipt"],
    formIds: ["1040", "schedule-a"],
  },
];

/*
 * Pick the default expanded category: prefer an in-progress one
 * (0 < pct < 100), then the first incomplete one.
 */
export function defaultExpandedCategoryId(): string {
  const inProgress = CATEGORIES.find((c) => c.pct > 0 && c.pct < 100);
  if (inProgress) return inProgress.id;
  const incomplete = CATEGORIES.find((c) => c.pct < 100);
  return (incomplete ?? CATEGORIES[0]).id;
}

export interface UploadRow {
  id: string;
  filename: string;
  created_at: string;
}

export function ProgressSegment({
  label,
  pct,
  active = false,
  onClick,
}: {
  label: string;
  pct: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 text-left transition-colors",
        active ? "bg-accent/10 ring-1 ring-accent/30" : "hover:bg-bg-elevated/40",
      )}
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-accent" : "bg-transparent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-center justify-between gap-1 truncate text-[11px]",
          active ? "text-ink-primary" : "text-ink-muted",
        )}
      >
        <span>{label}</span>
        <span className="tabular-nums opacity-70">{pct}%</span>
      </div>
    </button>
  );
}

/*
 * Expanded drill-down panel for a category. The workflow list caps at 3
 * items with a 'See N more' toggle. This keeps the Progress card short,
 * so Requested Actions and Activity stay visible above the fold on a
 * normal desktop. State resets on category change because the parent
 * keys this component by category.id.
 */
const WORKFLOWS_CAP = 3;

export function CategoryDetailsPanel({
  category,
  uploads,
  forms,
  returnId,
  onCollapse,
}: {
  category: Category;
  uploads: UploadRow[];
  forms: FormSummary[];
  returnId: string;
  onCollapse: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? category.items : category.items.slice(0, WORKFLOWS_CAP);
  const hiddenCount = category.items.length - visibleItems.length;

  return (
    <div className="mt-5 animate-fade-in border-t border-border-subtle pt-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            {category.label}
          </span>
          <span className="text-[11px] text-ink-faint">· {category.items.length} workflows</span>
        </div>
        <button
          onClick={onCollapse}
          className="text-[11px] tracking-wider text-ink-muted uppercase transition-colors hover:text-ink-primary"
        >
          Collapse ↑
        </button>
      </div>

      <ul className="space-y-1">
        {visibleItems.map((item) => (
          <CategoryItemRow key={item.id} item={item} />
        ))}
      </ul>

      {category.items.length > WORKFLOWS_CAP && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1.5 ml-3 text-[11px] text-accent transition-colors hover:text-accent-hover"
        >
          {showAll ? "Show less" : `See ${hiddenCount} more`}
        </button>
      )}

      <CategoryQuickLinks category={category} uploads={uploads} forms={forms} returnId={returnId} />
    </div>
  );
}

/*
 * Quick-link strip under the workflows list. Two subsections:
 * "Documents" lists uploads whose filename matches a docHint substring;
 * "Forms" lists state.forms entries whose formId is in the category's
 * formIds. Both link into the relevant tab. The strip hides only when
 * both subsections are empty.
 */
function CategoryQuickLinks({
  category,
  uploads,
  forms,
  returnId,
}: {
  category: Category;
  uploads: UploadRow[];
  forms: FormSummary[];
  returnId: string;
}) {
  const matchingDocs = useMemo(() => {
    if (category.docHints.length === 0) return [];
    return uploads.filter((doc) => {
      const lower = doc.filename.toLowerCase();
      return category.docHints.some((h) => lower.includes(h));
    });
  }, [category.docHints, uploads]);

  const matchingForms = useMemo(() => {
    if (category.formIds.length === 0) return [];
    const wanted = new Set(category.formIds);
    return forms.filter((f) => wanted.has(f.formId.toLowerCase()) || wanted.has(f.formId));
  }, [category.formIds, forms]);

  if (matchingDocs.length === 0 && matchingForms.length === 0) return null;

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border-subtle pt-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-[10px] tracking-[0.18em] text-ink-muted uppercase">Documents</div>
        {matchingDocs.length === 0 ? (
          <div className="text-[12px] text-ink-muted">
            No matching uploads yet.{" "}
            <Link href={`/r/${returnId}/documents`} className="text-accent hover:text-accent-hover">
              Upload →
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {matchingDocs.slice(0, 4).map((doc) => (
              <li key={doc.id}>
                <a
                  href={`/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-[12px] text-ink-secondary hover:text-ink-primary"
                >
                  <span className="text-ink-faint">📎</span>
                  <span className="truncate">{doc.filename}</span>
                  <span className="ml-auto shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              </li>
            ))}
            {matchingDocs.length > 4 && (
              <li>
                <Link
                  href={`/r/${returnId}/documents`}
                  className="text-[11px] text-accent hover:text-accent-hover"
                >
                  +{matchingDocs.length - 4} more →
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 text-[10px] tracking-[0.18em] text-ink-muted uppercase">Forms</div>
        {matchingForms.length === 0 ? (
          <div className="text-[12px] text-ink-muted">No forms drafted yet for this category.</div>
        ) : (
          <ul className="space-y-2">
            {matchingForms.map((f) => {
              const total = Math.max(0, f.fieldCount - f.unsupportedFieldCount);
              const filled = Math.max(0, total - f.blockedFieldCount);
              const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
              return (
                <li key={f.formId}>
                  <Link href={`/r/${returnId}/forms`} className="group block">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12px] text-ink-secondary group-hover:text-ink-primary">
                        {f.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-accent" : "bg-transparent",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryItemRow({ item }: { item: CategoryItem }) {
  const isDone = item.status === "done";
  const isDoing = item.status === "doing";
  return (
    <li>
      <button
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors",
          !isDone && "hover:bg-bg-elevated/50",
        )}
      >
        {isDone ? (
          <svg
            viewBox="0 0 16 16"
            className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-400"
            aria-hidden
          >
            <circle cx="8" cy="8" r="7.5" fill="currentColor" opacity="0.18" />
            <path
              d="M4.5 8.2 6.8 10.5 11.5 5.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ) : isDoing ? (
          <span className="mt-[5px] h-2.5 w-2.5 shrink-0 animate-pulse-soft rounded-full bg-accent" />
        ) : (
          <span className="mt-[4px] h-3 w-3 shrink-0 rounded-full border border-border-strong" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-sm leading-snug",
              isDoing && "font-medium text-ink-primary",
              isDone && "text-ink-muted",
              !isDoing &&
                !isDone &&
                "text-ink-secondary transition-colors group-hover:text-ink-primary",
            )}
          >
            {item.label}
          </div>
          {item.note && (
            <div className="mt-0.5 text-[11px] leading-snug text-ink-muted">{item.note}</div>
          )}
        </div>
        {!isDone && (
          <span
            className={cn(
              "mt-0.5 shrink-0 text-[11px] transition-opacity",
              isDoing ? "text-accent opacity-100" : "text-accent opacity-0 group-hover:opacity-100",
            )}
          >
            {isDoing ? "In progress" : "Start →"}
          </span>
        )}
      </button>
    </li>
  );
}
