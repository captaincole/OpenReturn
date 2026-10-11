"use client";

/*
 * Static design preview of the shell:
 *   Top bar (logo + return switcher + workspace tabs + status)
 *   Desktop: chat 1/3 | workspace 2/3 (fixed split, no resize)
 *   Mobile:  bottom tab bar swaps chat <-> workspace
 *   Toggle "Luca working" to see the dashboard hard-lock
 *
 * Static data only. The design shipped as the real shell
 * (components/AppShell.tsx); this page stays as a reference mock.
 */

import { cn } from "@/lib/cn";
import { useState } from "react";

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Mock data
 * ────────────────────────────────────────────────────────────────────────────
 */

const RETURNS = [
  { id: "2025", year: 2025, label: "2025 Return", state: "active" as const, progress: 60 },
  { id: "2024-amend", year: 2024, label: "2024 Amend", state: "empty" as const, progress: 0 },
];

const TABS = [
  { id: "home", label: "Home" },
  { id: "forms", label: "Forms" },
  { id: "documents", label: "Documents" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const MOBILE_PANES = [
  { id: "chat", label: "Chat", icon: "◐" },
  { id: "workspace", label: "Workspace", icon: "▦" },
] as const;
type MobilePaneId = (typeof MOBILE_PANES)[number]["id"];

const CHAT_MESSAGES = [
  {
    role: "assistant" as const,
    content:
      "Hi Alex — I'm Luca. Let's get your 2025 return started. First, can you confirm your filing status is still **Single**?",
  },
  { role: "user" as const, content: "Yes, still single." },
  { role: "assistant" as const, content: "Got it. And no dependents this year?" },
  { role: "user" as const, content: "Right, no dependents." },
  {
    role: "assistant" as const,
    content:
      "Perfect. I see you uploaded a W-2 from Acme Corp — wages of **$186,400** and federal withholding of **$38,210**. Recording those now.",
  },
  { role: "user" as const, content: "Looks right." },
  {
    role: "assistant" as const,
    content: "Next, did you have any 1099-DIV or 1099-INT activity in 2025? Even small amounts.",
  },
];

const PLAN = [
  { id: "p1", title: "Confirm filing status", status: "done" as const },
  { id: "p2", title: "Capture W-2 wages and withholding", status: "done" as const },
  {
    id: "p3",
    title: "Check for 1099-DIV / 1099-INT",
    status: "doing" as const,
    note: "Asking now",
  },
  { id: "p4", title: "Review CA-specific items", status: "todo" as const },
  { id: "p5", title: "Charitable contributions", status: "todo" as const },
];

const ACTIVITY = [
  { id: "a1", kind: "fact", title: "filing_status · single", value: "Single", time: "2m" },
  { id: "a2", kind: "fact", title: "wages · acme_corp · box1", value: "$186,400", time: "4m" },
  {
    id: "a3",
    kind: "decision",
    title: "ca_residency · full_year",
    value: "Full-year CA resident",
    time: "5m",
    verdict: "accurate" as const,
  },
  { id: "a4", kind: "fact", title: "wages · acme_corp · box2", value: "$38,210", time: "6m" },
  { id: "a5", kind: "fact", title: "dependents · count", value: "0", time: "8m" },
];

const OPEN_ASKS = [
  { id: "o1", title: "Any 1099-DIV statements?", priority: "high" },
  { id: "o2", title: "Did you contribute to an HSA in 2025?", priority: "med" },
  { id: "o3", title: "Confirm CA address on Jan 1, 2025", priority: "low" },
];

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
}

/*
 * Categories drive the Progress strip and the drill-down panel. Each
 * item is a concrete workflow Luca can run (e.g. "ask about 1099-DIV",
 * "compare standard vs itemized"). Click a strip segment to expand it;
 * click an item to start that workflow (stubbed in the preview).
 */
const CATEGORIES: Category[] = [
  {
    id: "filing",
    label: "Filing status",
    pct: 100,
    items: [
      { id: "f1", label: "Filing status", status: "done", note: "Single" },
      { id: "f2", label: "Dependents", status: "done", note: "None for 2025" },
      { id: "f3", label: "Residency (state)", status: "done", note: "Full-year California" },
    ],
  },
  {
    id: "wages",
    label: "Wages",
    pct: 100,
    items: [
      { id: "w1", label: "W-2 wages", status: "done", note: "Acme Corp · $186,400" },
      { id: "w2", label: "Federal withholding", status: "done", note: "$38,210" },
      {
        id: "w3",
        label: "Self-employment income (1099-NEC)",
        status: "todo",
        note: "Confirm none",
      },
    ],
  },
  {
    id: "investments",
    label: "Investments",
    pct: 20,
    items: [
      { id: "i1", label: "Dividends (1099-DIV)", status: "doing", note: "Luca is asking now" },
      { id: "i2", label: "Interest (1099-INT)", status: "done", note: "Chase Sapphire · $412" },
      { id: "i3", label: "Capital gains (Schedule D / 8949)", status: "todo" },
      { id: "i4", label: "Crypto disposals", status: "todo" },
      { id: "i5", label: "Other investment income (1099-MISC, royalties)", status: "todo" },
    ],
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
  },
];

const FORMS = [
  { id: "1040", label: "Form 1040", status: "drafting", filled: 12, total: 28 },
  { id: "sched-d", label: "Schedule D", status: "pending", filled: 0, total: 8 },
  { id: "8949", label: "Form 8949", status: "pending", filled: 0, total: 14 },
  { id: "ca-540", label: "CA Form 540", status: "pending", filled: 0, total: 22 },
];

const SOURCE_DOCS = [
  { id: "d1", name: "W-2 — Acme Corp 2025.pdf", type: "W-2", size: "184 KB", parsed: true },
  {
    id: "d2",
    name: "1099-INT — Chase Sapphire.pdf",
    type: "1099-INT",
    size: "92 KB",
    parsed: true,
  },
  { id: "d3", name: "Voided check.pdf", type: "Other", size: "44 KB", parsed: false },
];

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────────────────────
 */

export default function PreviewPage() {
  const [returnId, setReturnId] = useState("2025");
  const [tab, setTab] = useState<TabId>("home");
  const [mobilePane, setMobilePane] = useState<MobilePaneId>("workspace");
  const [lucaBusy, setLucaBusy] = useState(false);
  const [returnMenu, setReturnMenu] = useState(false);

  const activeReturn = RETURNS.find((r) => r.id === returnId)!;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-ink-primary">
      <TopBar
        activeReturn={activeReturn}
        returnMenuOpen={returnMenu}
        onReturnMenuToggle={() => setReturnMenu((v) => !v)}
        onReturnPick={(id) => {
          setReturnId(id);
          setReturnMenu(false);
        }}
        tab={tab}
        onTab={setTab}
        lucaBusy={lucaBusy}
        onLucaToggle={() => setLucaBusy((v) => !v)}
      />

      <main className="flex min-h-0 flex-1">
        {/* Desktop: split pane */}
        <aside
          className={cn(
            "hidden w-1/3 max-w-[520px] min-w-[360px] shrink-0 flex-col lg:flex",
            "border-r border-border-subtle bg-bg-subtle/40",
          )}
        >
          <ChatPane busy={lucaBusy} />
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col">
          <WorkspacePane tab={tab} busy={lucaBusy} />
        </section>

        {/* Mobile: single pane swap */}
        <div className="absolute inset-x-0 top-14 bottom-14 flex min-w-0 flex-1 flex-col lg:hidden">
          {mobilePane === "chat" ? (
            <ChatPane busy={lucaBusy} mobile />
          ) : (
            <WorkspacePane tab={tab} busy={lucaBusy} mobile />
          )}
        </div>
      </main>

      <MobileTabBar value={mobilePane} onChange={setMobilePane} />
    </div>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Top bar
 * ────────────────────────────────────────────────────────────────────────────
 */

interface TopBarProps {
  activeReturn: (typeof RETURNS)[number];
  returnMenuOpen: boolean;
  onReturnMenuToggle: () => void;
  onReturnPick: (id: string) => void;
  tab: TabId;
  onTab: (id: TabId) => void;
  lucaBusy: boolean;
  onLucaToggle: () => void;
}

function TopBar({
  activeReturn,
  returnMenuOpen,
  onReturnMenuToggle,
  onReturnPick,
  tab,
  onTab,
  lucaBusy,
  onLucaToggle,
}: TopBarProps) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur-sm lg:px-6">
      {/* Brand mark — always links back to home-home */}
      <a
        href="/preview/home"
        title="All returns"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 transition-colors hover:bg-accent/25"
      >
        <span className="font-serif text-sm leading-none text-accent">W</span>
      </a>

      <div className="h-6 w-px shrink-0 bg-border-subtle" />

      {/* Active return — title-weight, the canonical "where am I" cue */}
      <div className="relative shrink-0">
        <button
          onClick={onReturnMenuToggle}
          className="-mx-2 flex items-baseline gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-bg-elevated"
        >
          <span className="text-[15px] leading-none font-semibold tracking-tight text-ink-primary">
            {activeReturn.label}
          </span>
          <span className="text-[11px] leading-none text-ink-muted">▾</span>
        </button>
        {returnMenuOpen && (
          <div className="absolute top-full left-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl shadow-black/40">
            <a
              href="/preview/home"
              className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-bg-panel hover:text-ink-primary"
            >
              <span className="text-ink-muted">←</span>
              All returns
            </a>
            {RETURNS.map((r) => (
              <button
                key={r.id}
                onClick={() => onReturnPick(r.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                  "transition-colors hover:bg-bg-panel",
                  r.id === activeReturn.id && "bg-bg-panel",
                )}
              >
                <div>
                  <div className="text-sm text-ink-primary">{r.label}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {r.state === "active"
                      ? `${r.progress}% complete · ${r.year}`
                      : `Not started · ${r.year}`}
                  </div>
                </div>
                {r.id === activeReturn.id && <span className="text-sm text-accent">✓</span>}
              </button>
            ))}
            <div className="border-t border-border-subtle">
              <button className="w-full px-4 py-2.5 text-left text-sm text-ink-secondary transition-colors hover:bg-bg-panel hover:text-ink-primary">
                + Start a new return
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workspace tabs — subordinate to the return picker */}
      <div className="hidden shrink-0 px-1 text-ink-faint md:block">·</div>
      <nav className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[13px] transition-colors",
              tab === t.id
                ? "bg-bg-elevated text-ink-primary"
                : "text-ink-secondary hover:bg-bg-elevated/50 hover:text-ink-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Mobile: tabs hidden, push right cluster */}
      <div className="flex-1 md:hidden" />

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Hard-lock demo toggle */}
        <button
          onClick={onLucaToggle}
          title="Toggle Luca-is-working state (preview only)"
          className={cn(
            "hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors sm:flex",
            lucaBusy
              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
              : "border-border-subtle bg-bg-panel text-ink-secondary hover:text-ink-primary",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              lucaBusy ? "animate-pulse-soft bg-amber-400" : "bg-emerald-400",
            )}
          />
          {lucaBusy ? "Luca working" : "Idle"}
        </button>

        {/* Progress chip */}
        <div className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-2.5 py-1.5 text-xs sm:flex">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${activeReturn.progress}%` }}
            />
          </div>
          <span className="text-ink-secondary tabular-nums">{activeReturn.progress}%</span>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
          title="Settings"
        >
          ⚙
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-medium text-accent">
          AC
        </div>
      </div>
    </header>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Chat pane
 * ────────────────────────────────────────────────────────────────────────────
 */

function ChatPane({ busy, mobile = false }: { busy: boolean; mobile?: boolean }) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", mobile && "bg-bg-base")}>
      {/*
       * No header — chat flows freely. Identity lives on each assistant
       * message (avatar) and inside the input bar (persona badge).
       */}

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-6 pb-3">
        {CHAT_MESSAGES.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}
          >
            {m.role === "assistant" && <LucaAvatar />}
            <div
              className={cn(
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2.5 text-[14px] leading-relaxed text-white"
                  : "max-w-full pt-0.5 text-[14px] leading-relaxed text-ink-primary",
              )}
              dangerouslySetInnerHTML={{
                __html: m.content.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong class="font-semibold text-ink-primary">$1</strong>',
                ),
              }}
            />
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2.5">
            <LucaAvatar pulsing />
            <div className="flex items-center gap-1 pt-0.5">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted" />
              <span
                className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 px-3.5 pb-3.5">
        <ChatInput busy={busy} />
      </footer>
    </div>
  );
}

function LucaAvatar({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <div
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15",
        pulsing && "animate-pulse-soft",
      )}
    >
      <span className="font-serif text-[11px] leading-none text-accent">T</span>
    </div>
  );
}

function ChatInput({ busy }: { busy: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-bg-panel transition-colors",
        "focus-within:border-border-strong focus-within:bg-bg-panel/70",
      )}
    >
      <textarea
        placeholder={busy ? "Luca is thinking…" : "Reply to Luca…"}
        disabled={busy}
        rows={2}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[14px] leading-relaxed text-ink-primary placeholder:text-ink-muted focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center gap-1 px-2.5 pb-2.5">
        <IconButton title="Attach a document">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </IconButton>
        <IconButton title="Suggest what to ask next">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
            <path d="M19 4l.5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5z" />
          </svg>
        </IconButton>

        <div className="flex-1" />

        <button
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-ink-secondary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
          title="Switch agent"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-accent/40 bg-accent/20">
            <span className="font-serif text-[9px] leading-none text-accent">T</span>
          </span>
          <span>Luca</span>
          <span className="mt-0.5 text-[10px] leading-none text-ink-muted">▾</span>
        </button>

        <button
          disabled={busy}
          title="Send"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-ink-muted"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function IconButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
    >
      {children}
    </button>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Workspace pane (right 2/3)
 * ────────────────────────────────────────────────────────────────────────────
 */

function WorkspacePane({
  tab,
  busy,
  mobile = false,
}: {
  tab: TabId;
  busy: boolean;
  mobile?: boolean;
}) {
  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", mobile && "bg-bg-base")}>
      {busy && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-6 py-2.5 text-sm text-amber-200">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-amber-400" />
          <span>Luca is working — your turn next.</span>
        </div>
      )}

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto transition-opacity",
          busy && "pointer-events-none opacity-50",
          busy && "pt-10",
        )}
      >
        {tab === "home" && <HomeView />}
        {tab === "forms" && <FormsView />}
        {tab === "documents" && <DocumentsView />}
      </div>
    </div>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Home view — synthesized dashboard
 * ────────────────────────────────────────────────────────────────────────────
 */

function HomeView() {
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const expanded = expandedCat ? CATEGORIES.find((c) => c.id === expandedCat) : null;
  /*
   * The "View all" expansion only reveals more history. In the real
   * shell this list comes from one query against tax_facts +
   * ai_decisions (paginated when expanded); the duplication here is
   * mock-data only.
   */
  const visibleActivity = activityExpanded ? ACTIVITY.concat(ACTIVITY, ACTIVITY) : ACTIVITY;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      {/* Progress strip with drill-down */}
      <section className="card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">Progress</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-primary tabular-nums">
              60% complete
            </div>
          </div>
          <div className="text-sm text-ink-secondary tabular-nums">12 facts · 3 open · 4 forms</div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <ProgressSegment
              key={cat.id}
              label={cat.label}
              pct={cat.pct}
              active={expandedCat === cat.id}
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            />
          ))}
        </div>

        {expanded && (
          <div className="mt-5 animate-fade-in border-t border-border-subtle pt-5">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
                  {expanded.label}
                </span>
                <span className="text-[11px] text-ink-faint">
                  · {expanded.items.length} workflows
                </span>
              </div>
              <button
                onClick={() => setExpandedCat(null)}
                className="text-[11px] tracking-wider text-ink-muted uppercase transition-colors hover:text-ink-primary"
              >
                Collapse ↑
              </button>
            </div>
            <ul className="space-y-1">
              {expanded.items.map((item) => (
                <CategoryItemRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Two-column: Plan + Open asks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <span>Plan</span>
            <span className="tracking-normal text-ink-muted normal-case tabular-nums">
              {PLAN.filter((p) => p.status !== "done").length}
            </span>
          </div>
          <ul className="space-y-3 px-5 pb-5">
            {PLAN.map((item) => (
              <PlanRow key={item.id} item={item} />
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-header">
            <span>Open asks</span>
            <span className="tracking-normal text-ink-muted normal-case tabular-nums">
              {OPEN_ASKS.length}
            </span>
          </div>
          <ul className="space-y-2.5 px-5 pb-5">
            {OPEN_ASKS.map((ask) => (
              <li
                key={ask.id}
                className="flex items-start gap-3 border-b border-border-subtle/50 py-2.5 last:border-0"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    ask.priority === "high" && "bg-red-400",
                    ask.priority === "med" && "bg-amber-400",
                    ask.priority === "low" && "bg-ink-faint",
                  )}
                />
                <div className="flex-1">
                  <div className="text-sm text-ink-primary">{ask.title}</div>
                  <div className="mt-0.5 text-[11px] tracking-wide text-ink-muted uppercase">
                    {ask.priority} priority
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Activity ledger — collapsed shows last 5, "View all" expands inline */}
      <section className="card">
        <div className="card-header">
          <span>Activity</span>
          <span className="tracking-normal text-ink-muted normal-case tabular-nums">
            {activityExpanded
              ? visibleActivity.length
              : `${ACTIVITY.length} of ${visibleActivity.length === ACTIVITY.length ? ACTIVITY.length : "many"}`}
          </span>
        </div>
        <ul>
          {visibleActivity.map((item, i) => (
            <li
              key={`${item.id}-${i}`}
              className={cn("px-5 py-3.5", i !== 0 && "border-t border-border-subtle")}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "text-[9px] font-medium tracking-[0.18em] uppercase",
                    item.kind === "decision" ? "text-accent" : "text-ink-muted",
                  )}
                >
                  {item.kind}
                </span>
                <span className="text-[11px] text-ink-faint tabular-nums">{item.time}</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex-1 truncate text-sm text-ink-primary">
                  {item.title.split("·").slice(1).join("·").trim() || item.title}
                </span>
                <span className="text-sm text-ink-secondary tabular-nums">{item.value}</span>
                {"verdict" in item && item.verdict === "accurate" && (
                  <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] tracking-wide text-emerald-400 uppercase">
                    Grounded
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border-subtle">
          <button
            onClick={() => setActivityExpanded((v) => !v)}
            className="w-full px-5 py-3 text-sm text-ink-secondary transition-colors hover:bg-bg-elevated/40 hover:text-ink-primary"
          >
            {activityExpanded ? "Show less ↑" : "View all ↓"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProgressSegment({
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

function PlanRow({ item }: { item: (typeof PLAN)[number] }) {
  const isDoing = item.status === "doing";
  const isDone = item.status === "done";
  return (
    <li className="flex items-start gap-2.5">
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
      <div className="flex-1">
        <div
          className={cn(
            "text-sm leading-snug",
            isDoing && "font-medium text-ink-primary",
            isDone && "text-ink-muted line-through decoration-ink-faint/60",
            !isDoing && !isDone && "text-ink-secondary",
          )}
        >
          {item.title}
        </div>
        {"note" in item && item.note && !isDone && (
          <div className="mt-0.5 text-[12px] text-ink-muted">{item.note}</div>
        )}
      </div>
    </li>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Forms view
 * ────────────────────────────────────────────────────────────────────────────
 */

function FormsView() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-8 lg:px-10">
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <h2 className="font-serif text-2xl text-ink-primary">Working drafts</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Live as you talk — Luca fills lines as facts come in.
            </p>
          </div>
          <span className="text-[11px] tracking-wider text-ink-muted uppercase">
            {FORMS.length} forms
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {FORMS.map((f) => (
            <div
              key={f.id}
              className="card cursor-pointer p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">
                    {f.id}
                  </div>
                  <div className="mt-1 font-serif text-lg text-ink-primary">{f.label}</div>
                </div>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] tracking-wide uppercase",
                    f.status === "drafting"
                      ? "bg-accent/15 text-accent"
                      : "bg-bg-elevated text-ink-muted",
                  )}
                >
                  {f.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${(f.filled / f.total) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-ink-muted tabular-nums">
                    {f.filled} / {f.total} fields
                  </span>
                  <div className="flex items-center gap-3 text-ink-secondary">
                    <button className="hover:text-ink-primary">PDF ↓</button>
                    <span>Open →</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-ink-primary">Deliverables</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Packaged outputs — ready to share with your CPA or file.
          </p>
        </div>
        <div className="space-y-3">
          <div className="card flex items-center gap-4 p-4">
            <div className="flex h-12 w-10 items-center justify-center rounded border border-border-subtle bg-bg-elevated font-mono text-[10px] text-ink-muted">
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-primary">CPA review packet</div>
              <div className="mt-0.5 text-[11px] text-ink-muted">
                Pending — completes when all working drafts are signed off
              </div>
            </div>
            <span className="rounded bg-bg-elevated px-2 py-1 text-[10px] tracking-wide text-ink-muted uppercase">
              Not ready
            </span>
          </div>
          <div className="card flex items-center gap-4 p-4">
            <div className="flex h-12 w-10 items-center justify-center rounded border border-border-subtle bg-bg-elevated font-mono text-[10px] text-ink-muted">
              ZIP
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-primary">
                Filing bundle (1040 + schedules + CA 540)
              </div>
              <div className="mt-0.5 text-[11px] text-ink-muted">Pending CPA sign-off</div>
            </div>
            <span className="rounded bg-bg-elevated px-2 py-1 text-[10px] tracking-wide text-ink-muted uppercase">
              Not ready
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Documents view
 * ────────────────────────────────────────────────────────────────────────────
 */

function DocumentsView() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink-primary">Documents</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            W-2s, 1099s, K-1s — anything you've uploaded.
          </p>
        </div>
        <span className="text-[11px] tracking-wider text-ink-muted uppercase">
          {SOURCE_DOCS.length} files
        </span>
      </div>

      <DropZone />

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SOURCE_DOCS.map((doc) => (
          <DocCard key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DropZone() {
  return (
    <div className="cursor-pointer rounded-2xl border-2 border-dashed border-border-subtle bg-bg-subtle/40 px-6 py-10 text-center transition-colors hover:border-accent/50">
      <div className="text-3xl text-ink-muted">⬆</div>
      <div className="mt-2 text-sm text-ink-primary">
        Drop W-2s, 1099s, or other tax documents here
      </div>
      <div className="mt-1 text-xs text-ink-muted">PDF, PNG, JPG · up to 10 MB each</div>
      <button className="mt-4 text-xs text-accent hover:text-accent-hover">or browse files</button>
    </div>
  );
}

function DocCard({ doc }: { doc: (typeof SOURCE_DOCS)[number] }) {
  return (
    <div className="card group cursor-pointer p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between">
        <span className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] tracking-wide text-ink-secondary uppercase">
          {doc.type}
        </span>
        {doc.parsed && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="h-1 w-1 rounded-full bg-emerald-400" /> parsed
          </span>
        )}
      </div>
      <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated/50">
        <span className="font-mono text-xs text-ink-faint">preview</span>
      </div>
      <div className="mt-3">
        <div className="truncate text-sm text-ink-primary">{doc.name}</div>
        <div className="mt-0.5 text-[11px] text-ink-muted">{doc.size}</div>
      </div>
      <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="flex-1 rounded border border-border-subtle py-1.5 text-xs text-ink-secondary hover:border-border-strong hover:text-ink-primary">
          Preview
        </button>
        <button className="flex-1 rounded border border-border-subtle py-1.5 text-xs text-ink-secondary hover:border-border-strong hover:text-ink-primary">
          Send to Luca
        </button>
      </div>
    </div>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Mobile tab bar
 * ────────────────────────────────────────────────────────────────────────────
 */

function MobileTabBar({
  value,
  onChange,
}: {
  value: MobilePaneId;
  onChange: (id: MobilePaneId) => void;
}) {
  return (
    <nav className="relative z-30 flex h-14 shrink-0 border-t border-border-subtle bg-bg-subtle/95 backdrop-blur-sm lg:hidden">
      {MOBILE_PANES.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5",
            value === p.id ? "text-ink-primary" : "text-ink-muted",
          )}
        >
          <span className="text-lg leading-none">{p.icon}</span>
          <span className="text-[10px] tracking-wider uppercase">{p.label}</span>
        </button>
      ))}
    </nav>
  );
}
