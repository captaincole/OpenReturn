"use client";

/*
 * The conversation surface. On desktop it fills AppShell's left pane; on
 * mobile it fills the "Chat" tab. It has no header. Identity reads from
 * the avatar on each assistant message plus the Luca badge in the input.
 *
 * AppShell.sendChat does all sending. The form submit here and the
 * Requested Actions card upload call the same function. Exactly one code
 * path writes user turns.
 */

import { type ChatMessage, useAppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { type PlanItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { type TaxReturn } from "@/lib/returns";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface ChatPaneProps {
  activeReturn: TaxReturn;
}

export function ChatPane({ activeReturn }: ChatPaneProps) {
  const { messages, state, lucaBusy, sendChat } = useAppShell();
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const isPlaceholder = !activeReturn.realDataAvailable;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  /*
   * sendChat disables the textarea via lucaBusy. Restore focus when it
   * flips back so the user can continue to type without a click.
   */
  useEffect(() => {
    if (!lucaBusy && !isPlaceholder) messageInputRef.current?.focus();
  }, [lucaBusy, isPlaceholder]);

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (isPlaceholder || lucaBusy) return;
    const text = input.trim();
    const file = attachment;
    if (!text && !file) return;

    /*
     * Clear the local input state immediately so the user sees the
     * message commit. sendChat handles the rest.
     */
    setInput("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await sendChat({ text, file: file ?? undefined });
  }

  /*
   * For placeholder returns, render one hardcoded Luca turn instead of
   * the real message buffer. This keeps the multi-return UX honest
   * without backend support for non-2025 threads.
   */
  const renderMessages: ChatMessage[] = isPlaceholder
    ? [placeholderMessageFor(activeReturn)]
    : messages;
  const isEmpty = renderMessages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-6 pb-3">
        {isEmpty && (
          <div className="flex items-start gap-2.5 text-sm text-ink-muted">
            <LucaAvatar />
            <div className="pt-0.5">Say hi to start.</div>
          </div>
        )}
        {renderMessages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}
          >
            {msg.role === "assistant" && <LucaAvatar />}
            <div
              className={cn(
                msg.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-white"
                  : "max-w-full pt-0.5 text-[14px] leading-relaxed text-ink-primary",
              )}
            >
              {msg.attachmentName && (
                <div
                  className={
                    msg.role === "user"
                      ? "mb-1.5 flex items-center gap-1.5 text-xs opacity-80"
                      : "mb-1.5 flex items-center gap-1.5 text-xs text-ink-muted"
                  }
                >
                  <span>📎</span>
                  <span className="truncate">{msg.attachmentName}</span>
                </div>
              )}
              {msg.content ? (
                msg.role === "assistant" ? (
                  <Markdown>{msg.content}</Markdown>
                ) : (
                  msg.content
                )
              ) : (
                lucaBusy && <TypingDots />
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="shrink-0 px-3.5 pb-3.5">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm">
            <span>📎</span>
            <span className="flex-1 truncate text-ink-primary">{attachment.name}</span>
            <span className="text-xs text-ink-muted tabular-nums">
              {(attachment.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-lg leading-none text-ink-muted hover:text-ink-primary"
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className={cn(
            "rounded-2xl border border-border-subtle bg-bg-panel transition-colors",
            "focus-within:border-border-strong",
            isPlaceholder && "opacity-60",
          )}
        >
          <PlanRail plan={state?.plan ?? []} hidden={isPlaceholder} />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <textarea
            ref={messageInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSubmit();
              }
            }}
            rows={2}
            placeholder={
              isPlaceholder
                ? "This return is a placeholder."
                : lucaBusy
                  ? "Luca is thinking…"
                  : attachment
                    ? "Add a note (optional)…"
                    : "Reply to Luca…"
            }
            disabled={lucaBusy || isPlaceholder}
            autoFocus={!isPlaceholder}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[14px] leading-relaxed text-ink-primary placeholder:text-ink-muted focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-1 px-2.5 pb-2.5">
            <IconButton
              title="Attach a document"
              onClick={() => fileInputRef.current?.click()}
              disabled={lucaBusy || isPlaceholder}
            >
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
            <IconButton title="Suggest what to ask next" disabled>
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

            <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-ink-secondary">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-accent/40 bg-accent/20">
                <span className="font-serif text-[9px] leading-none text-accent">T</span>
              </span>
              <span>Luca</span>
            </div>

            <button
              type="submit"
              disabled={lucaBusy || isPlaceholder || (!input.trim() && !attachment)}
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
        </form>
      </footer>
    </div>
  );
}

/*
 * Compact plan strip rendered INSIDE the input card. It hides done items.
 * It shows at most 3 items, with a "See N more" toggle for the rest.
 */
function PlanRail({ plan, hidden }: { plan: PlanItem[]; hidden: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const active = plan.filter((p) => p.status !== "done");
  if (hidden || active.length === 0) return null;

  const CAP = 3;
  const visible = showAll ? active : active.slice(0, CAP);
  const hiddenCount = active.length - visible.length;

  return (
    <div className="border-b border-border-subtle px-4 pt-3 pb-2.5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">Plan</span>
        <span className="text-[10px] text-ink-muted tabular-nums">{active.length} active</span>
      </div>
      <ul className="space-y-1.5">
        {visible.map((item) => (
          <PlanRailRow key={item.id} item={item} />
        ))}
      </ul>
      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1.5 text-[11px] text-accent hover:text-accent-hover"
        >
          See {hiddenCount} more
        </button>
      )}
      {showAll && active.length > CAP && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-1.5 text-[11px] text-ink-muted hover:text-ink-secondary"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function PlanRailRow({ item }: { item: PlanItem }) {
  const isDoing = item.status === "doing";
  return (
    <li className="flex items-start gap-2">
      {isDoing ? (
        <span className="mt-[5px] h-2 w-2 shrink-0 animate-pulse-soft rounded-full bg-accent" />
      ) : (
        <span className="mt-[4px] h-2.5 w-2.5 shrink-0 rounded-full border border-border-strong" />
      )}
      <span
        className={cn(
          "truncate text-[12px] leading-snug",
          isDoing ? "text-ink-primary" : "text-ink-secondary",
        )}
      >
        {item.title}
      </span>
    </li>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted" />
      <span
        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ink-muted"
        style={{ animationDelay: "0.4s" }}
      />
    </span>
  );
}

function LucaAvatar() {
  return (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15">
      <span className="font-serif text-[11px] leading-none text-accent">T</span>
    </div>
  );
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-bg-elevated hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function placeholderMessageFor(ret: TaxReturn): ChatMessage {
  /*
   * Unreachable today. The return layout redirects to '/' when the caller
   * does not own a filing for the requested year, so every TaxReturn that
   * reaches ChatPane has realDataAvailable=true. Kept as a defense-in-depth
   * fallback in case the layout gate drifts from this assumption.
   */
  if (ret.state === "filed") {
    return {
      id: "placeholder",
      role: "assistant",
      content: `This is your filed ${ret.year} return — read-only for now.`,
    };
  }
  return {
    id: "placeholder",
    role: "assistant",
    content: `Placeholder for ${ret.label}.`,
  };
}
