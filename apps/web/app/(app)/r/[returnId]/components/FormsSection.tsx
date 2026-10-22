"use client";

/*
 * Forms section of the return page — one unified list of tax forms for
 * the active return.
 *
 * Two data sources, merged:
 *   - state.forms: engine-tracked primary forms (1040, CA 540) with
 *     fill state. Drives the status pill and the fill % bar.
 *   - user_documents (category='drafts'): every PDF the engine has
 *     output, including engine-derived schedules (Schedule D, 8949,
 *     Schedule CA) that are not first-class entries in state.forms.
 *     Drives the Open + Download actions.
 *
 * Merge logic: each state.forms entry pulls its matching draft (if any)
 * by key — see draftKey. Drafts that match no state.forms entry render
 * as standalone "Generated" rows. Drafts dedupe to the most recent per
 * key, because the engine regenerates on every turn and we show only
 * the latest snapshot.
 */

import { useAppShell } from "@/components/AppShell";
import type { FormSummary } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";

interface DraftRow {
  id: string;
  filename: string;
  created_at: string;
  mime_type: string | null;
  size_bytes: number | null;
  metadata: Record<string, unknown> | null;
}

interface FormItem {
  key: string;
  label: string;
  description: string | null;
  // From state.forms when this is a tracked primary form
  form?: FormSummary;
  // From user_documents when an engine-generated PDF exists
  draft?: DraftRow;
}

export function FormsSection() {
  const { state, resetTick, turnTick } = useAppShell();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/drafts", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as DraftRow[];
      })
      .then((rows) => {
        if (!cancelled) setDrafts(rows);
      })
      .catch((err) => {
        console.warn("[forms] drafts fetch failed:", err);
        if (!cancelled) setDrafts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [resetTick, turnTick]);

  const items = useMemo(
    () => mergeFormsAndDrafts(state?.forms ?? [], drafts),
    [state?.forms, drafts],
  );

  return (
    <section aria-labelledby="forms-heading">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 id="forms-heading" className="font-serif text-2xl text-ink-primary">
            Tax forms
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Everything Luca is preparing for your 2025 return. Snapshots regenerate as facts land.
          </p>
        </div>
        <span className="text-[11px] tracking-wider text-ink-muted uppercase">
          {items.length} {items.length === 1 ? "form" : "forms"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card px-6 py-8 text-center">
          <div className="text-sm text-ink-muted">No forms yet.</div>
          <div className="mt-1 text-xs text-ink-faint">
            They appear here as Luca captures facts and packages the return.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FormRow key={item.key} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function FormRow({ item }: { item: FormItem }) {
  const status = computeStatus(item);
  const fill = item.form ? computeFill(item.form) : null;
  const draftHref = item.draft ? `/documents/${item.draft.id}` : null;
  const draftDownloadHref = draftHref ? `${draftHref}?download=1` : null;

  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded border border-border-subtle bg-bg-elevated font-mono text-[10px] text-ink-muted">
        {draftHref ? (item.draft!.mime_type?.includes("json") ? "JSON" : "PDF") : "—"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-ink-primary">{item.label}</span>
          <StatusPill status={status} />
        </div>
        {item.description && (
          <div className="mt-0.5 truncate text-[12px] text-ink-secondary">{item.description}</div>
        )}
        {fill && (status === "drafting" || status === "not_started") && (
          <div className="mt-2 flex items-center gap-2.5">
            <div className="h-1 max-w-[180px] flex-1 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  fill.pct === 100 ? "bg-ok" : fill.pct > 0 ? "bg-accent" : "bg-transparent",
                )}
                style={{ width: `${fill.pct}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-muted tabular-nums">
              {fill.filled} / {fill.total}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {draftHref ? (
          <>
            <a
              href={draftHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border-subtle px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
            >
              Open
            </a>
            <a
              href={draftDownloadHref!}
              className="rounded-md border border-border-subtle px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
            >
              Download
            </a>
          </>
        ) : (
          <span className="px-2 text-[11px] text-ink-faint italic">No PDF yet</span>
        )}
      </div>
    </div>
  );
}

type Status = "not_started" | "drafting" | "generated" | "not_filing" | "pending_decision";

/*
 * Status precedence: an existing PDF wins over engine fill state. A
 * generated draft is the user's source of truth for "this is done".
 * "Drafting · 36/39" next to a downloadable PDF misleads, even when the
 * engine still marks some fields unresolved.
 */
function computeStatus(item: FormItem): Status {
  if (item.draft) return "generated";
  if (item.form) {
    if (!item.form.mustFile.ok) return "pending_decision";
    if (item.form.mustFile.value === false) return "not_filing";
    const filled =
      item.form.fieldCount - item.form.unsupportedFieldCount - item.form.blockedFieldCount;
    if (filled === 0) return "not_started";
    return "drafting";
  }
  return "generated";
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; tone: string }> = {
    not_started: { label: "Not started", tone: "bg-bg-elevated text-ink-muted" },
    drafting: { label: "Drafting", tone: "bg-accent/15 text-accent" },
    generated: { label: "Generated", tone: "bg-ok/10 text-ok" },
    not_filing: { label: "Not filing", tone: "bg-bg-elevated text-ink-muted" },
    pending_decision: { label: "Pending decision", tone: "bg-warn/10 text-warn" },
  };
  const { label, tone } = map[status];
  return (
    <span className={cn("rounded px-2 py-0.5 text-[10px] tracking-wide uppercase", tone)}>
      {label}
    </span>
  );
}

function computeFill(form: FormSummary): { filled: number; total: number; pct: number } {
  const total = Math.max(0, form.fieldCount - form.unsupportedFieldCount);
  const filled = Math.max(0, total - form.blockedFieldCount);
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { filled, total, pct };
}

/*
 * Stable key that matches state.forms entries to user_documents drafts.
 * generateTaxDocuments writes `metadata.formId = spec.shortId` (e.g.
 * "1040", "540", "schedule-d") on every draft row. state.forms uses the
 * longer `spec.formId` ("form-1040", "form-540"); stripping the "form-"
 * prefix gives the same shortId, so the two sides line up.
 *
 * Filename inference is a fallback for older rows that predate the
 * metadata column, and for drafts written outside generateTaxDocuments.
 */
function draftKey(draft: DraftRow): string {
  const metaFormId = draft.metadata?.formId;
  if (typeof metaFormId === "string" && metaFormId.length > 0) return metaFormId;
  const lower = draft.filename.toLowerCase();
  if (lower.includes("8949")) return "8949";
  if (lower.includes("schedule-d") || lower.includes("sched-d")) return "schedule-d";
  if (lower.includes("schedule-ca") || lower.includes("sched-ca")) return "schedule-ca";
  if (lower.includes("schedule-a") || lower.includes("sched-a")) return "schedule-a";
  if (lower.includes("1040")) return "1040";
  if (lower.includes("540")) return "540";
  if (lower.endsWith(".json") || lower.includes("sidecar") || lower.includes("forms-data")) {
    return "sidecar";
  }
  return draft.filename;
}

function formKey(form: FormSummary): string {
  return form.formId.replace(/^form-/, "");
}

const ORPHAN_LABELS: Record<string, { label: string; description: string }> = {
  "8949": {
    label: "Form 8949",
    description: "Sales and Other Dispositions of Capital Assets",
  },
  "schedule-d": {
    label: "Schedule D",
    description: "Capital Gains and Losses",
  },
  "schedule-ca": {
    label: "Schedule CA (540)",
    description: "California adjustments to federal amounts",
  },
  "schedule-a": {
    label: "Schedule A",
    description: "Itemized deductions",
  },
  sidecar: {
    label: "Forms data (JSON)",
    description: "Every computed line — useful for CPA review",
  },
};

function mergeFormsAndDrafts(forms: FormSummary[], drafts: DraftRow[]): FormItem[] {
  /*
   * Dedup: keep the latest draft per key. The query sorts `drafts` by
   * created_at descending, so the first hit per key wins.
   */
  const draftByKey = new Map<string, DraftRow>();
  for (const d of drafts) {
    const key = draftKey(d);
    if (!draftByKey.has(key)) draftByKey.set(key, d);
  }

  const items: FormItem[] = [];
  const claimedKeys = new Set<string>();

  // 1) Engine-tracked forms with their matching drafts (if any).
  for (const f of forms) {
    const key = formKey(f);
    claimedKeys.add(key);
    items.push({
      key,
      label: f.displayName,
      description: f.title,
      form: f,
      draft: draftByKey.get(key),
    });
  }

  // 2) Drafts that do not correspond to a tracked form (schedules, JSON).
  for (const [key, draft] of draftByKey.entries()) {
    if (claimedKeys.has(key)) continue;
    const meta = ORPHAN_LABELS[key];
    items.push({
      key,
      label: meta?.label ?? draft.filename,
      description: meta?.description ?? null,
      draft,
    });
  }

  return items;
}
