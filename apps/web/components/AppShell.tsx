"use client";

/*
 * Return-scoped shell. It renders above every /r/[returnId]/* route.
 *
 * Layout:
 *   - TopBar: brand, return picker, tabs, right cluster.
 *   - Main, desktop: ChatPane on the left, {children} on the right.
 *   - Main, mobile: one pane. The bottom tab bar swaps the panes.
 *
 * AppShellContext supplies user state, the chat message buffer, lucaBusy,
 * turnTick, the mobile-pane setter, and sendChat. The chat input and the
 * Requested Actions card call the same sendChat function. One code path
 * prevents useEffect bridges, state-trigger races, and double sends.
 *
 * For placeholder returns (realDataAvailable=false), the shell does not
 * fetch /app/state and does not load chat history. sendChat is a no-op.
 */

import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { ChatPane } from "@/components/ChatPane";
import { fetchState, UnauthorizedError, type CaseState } from "@/lib/api";
import { makeMastraClient } from "@/lib/mastraClient";
import { LUCA_AGENT_ID } from "@/lib/chatSession";
import { threadIdFor, type TaxReturn } from "@/lib/returns";
import { getUserId, signOut } from "@/lib/auth";
import { uploadDocument } from "@/lib/uploads";
import { type UserProfile } from "@/lib/profile";
import { cn } from "@/lib/cn";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
}

type MobilePane = "chat" | "workspace";

export interface SendChatOpts {
  text?: string;
  file?: File;
  /*
   * Set true when the caller already wrote the file to user_documents.
   * Then sendChat does not upload the file again.
   */
  skipUpload?: boolean;
}

interface AppShellContextValue {
  userId: string;
  activeReturn: TaxReturn;
  returns: TaxReturn[];
  profile: UserProfile;
  state: CaseState | null;
  refreshState: () => Promise<void>;
  resetTick: number;
  turnTick: number;
  bumpTurn: () => void;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  lucaBusy: boolean;
  setMobilePane: Dispatch<SetStateAction<MobilePane>>;
  /*
   * The single entry point that sends a turn to Luca. The chat input and
   * the Requested Actions card call it. It resolves when the stream ends.
   * It is a no-op when Luca is busy or the return is a placeholder.
   */
  sendChat: (opts: SendChatOpts) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const v = useContext(AppShellContext);
  if (!v) throw new Error("useAppShell must be used inside <AppShell>");
  return v;
}

function freshId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AppShell({
  children,
  userId,
  activeReturn,
  returns,
  profile,
}: {
  children: React.ReactNode;
  userId: string;
  activeReturn: TaxReturn;
  returns: TaxReturn[];
  profile: UserProfile;
}) {
  const router = useRouter();
  const [state, setState] = useState<CaseState | null>(null);
  const [resetTick] = useState(0);
  const [turnTick, setTurnTick] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lucaBusy, setLucaBusy] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("workspace");
  /*
   * Synchronous gate against concurrent sendChat calls. setLucaBusy is
   * asynchronous. Two calls in the same tick can both pass an
   * `if (lucaBusy)` check. sendChat sets this ref immediately and clears
   * it in the finally block.
   */
  const sendingRef = useRef(false);

  const realData = activeReturn.realDataAvailable;

  async function refreshState() {
    if (!realData) {
      setState(null);
      return;
    }
    try {
      setState(await fetchState());
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await signOut();
        router.refresh();
        router.push("/login");
      }
    }
  }

  async function loadChatHistory() {
    if (!realData) {
      setMessages([]);
      return;
    }
    try {
      const client = await makeMastraClient();
      const thread = client.getMemoryThread({
        threadId: threadIdFor(userId, activeReturn.id),
        agentId: LUCA_AGENT_ID,
      });
      const res = await thread.listMessages({ perPage: 200 });
      const converted: ChatMessage[] = [];
      for (const m of res.messages) {
        if (m.role !== "user" && m.role !== "assistant") continue;
        const parts = m.content?.parts ?? [];
        const text = parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");
        const attachmentName = m.content?.experimental_attachments?.[0]?.name ?? undefined;
        if (!text && !attachmentName) continue;
        converted.push({
          id: m.id,
          role: m.role,
          content: text || (attachmentName ? `Uploaded ${attachmentName}` : ""),
          attachmentName,
        });
      }
      setMessages((current) => (current.length > 0 ? current : converted));
    } catch {
      // Thread is missing or the request failed. Keep the buffer empty.
    }
  }

  useEffect(() => {
    refreshState();
    loadChatHistory();
    // Rerun only on a return switch. refreshState/loadChatHistory are stable.
  }, [activeReturn.id]);

  async function onSignOut() {
    await signOut();
    router.refresh();
    router.push("/login");
  }

  function bumpTurn() {
    setTurnTick((t) => t + 1);
  }

  async function sendChat(opts: SendChatOpts): Promise<void> {
    if (sendingRef.current) return;
    if (!realData) return;
    const text = (opts.text ?? "").trim();
    const file = opts.file;
    if (!text && !file) return;

    sendingRef.current = true;
    setLucaBusy(true);

    const userMsg: ChatMessage = {
      id: freshId("u"),
      role: "user",
      content: text || (file ? `Uploaded ${file.name}` : ""),
      attachmentName: file?.name,
    };
    const assistantMsg: ChatMessage = {
      id: freshId("a"),
      role: "assistant",
      content: "",
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);

    /*
     * Write the file to user_documents in parallel. Then the Documents
     * tab shows it. Skip this when the caller already uploaded the file
     * (for example, the Requested Actions card).
     */
    if (file && !opts.skipUpload) {
      uploadDocument(file).catch((err) => {
        console.warn("[chat] upload to user-documents failed:", err);
      });
    }

    try {
      let payload: unknown = text;
      if (file) {
        const base64 = await readFileAsBase64(file);
        const mediaType = file.type || "application/pdf";
        payload = [
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: text || "I've attached a document — please review it.",
              },
              {
                type: "file" as const,
                data: base64,
                mediaType,
                filename: file.name,
              },
            ],
          },
        ];
      }

      const userIdFresh = await getUserId();
      if (!userIdFresh) {
        await signOut();
        router.refresh();
        router.push("/login");
        return;
      }

      const client = await makeMastraClient();
      const stream = await client.getAgent(LUCA_AGENT_ID).stream(payload as string, {
        memory: {
          thread: threadIdFor(userIdFresh, activeReturn.id),
          resource: userIdFresh,
        },
      });

      await stream.processDataStream({
        onChunk: async (chunk) => {
          if (chunk.type === "text-delta") {
            const delta = (chunk.payload as { text: string }).text;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id ? { ...msg, content: msg.content + delta } : msg,
              ),
            );
          }
        },
      });

      await refreshState();
      setTurnTick((t) => t + 1);
    } catch (err) {
      const message =
        err instanceof UnauthorizedError
          ? "Session expired — please sign in again."
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setMessages((m) =>
        m.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: `[${message}]` } : msg)),
      );
      if (err instanceof UnauthorizedError) {
        await signOut();
        router.refresh();
        router.push("/login");
      }
    } finally {
      setLucaBusy(false);
      sendingRef.current = false;
    }
  }

  const ctx: AppShellContextValue = {
    userId,
    activeReturn,
    returns,
    profile,
    state,
    refreshState,
    resetTick,
    turnTick,
    bumpTurn,
    messages,
    setMessages,
    lucaBusy,
    setMobilePane,
    sendChat,
    onSignOut,
  };

  return (
    <AppShellContext.Provider value={ctx}>
      <div className="h-screen w-screen bg-bg-base text-ink-primary flex flex-col overflow-hidden">
        <TopBar activeReturn={activeReturn} returns={returns} />

        <main className="flex-1 min-h-0 flex">
          <aside className="hidden lg:flex shrink-0 w-[40%] max-w-[640px] min-w-[400px] flex-col border-r border-border-subtle bg-bg-subtle/40">
            <ChatPane activeReturn={activeReturn} />
          </aside>
          <section className="hidden lg:flex flex-1 min-w-0 flex-col">
            <WorkspaceFrame>{children}</WorkspaceFrame>
          </section>

          <div className="lg:hidden flex-1 min-w-0 min-h-0 flex flex-col">
            {mobilePane === "chat" ? (
              <ChatPane activeReturn={activeReturn} />
            ) : (
              <WorkspaceFrame>{children}</WorkspaceFrame>
            )}
          </div>
        </main>

        <MobileTabBar value={mobilePane} onChange={setMobilePane} busy={lucaBusy} />
      </div>
    </AppShellContext.Provider>
  );
}

function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>;
}

function MobileTabBar({
  value,
  onChange,
  busy,
}: {
  value: MobilePane;
  onChange: (id: MobilePane) => void;
  busy: boolean;
}) {
  const tabs: { id: MobilePane; label: string; icon: string }[] = [
    { id: "chat", label: "Chat", icon: "◐" },
    { id: "workspace", label: "Workspace", icon: "▦" },
  ];
  return (
    <nav className="lg:hidden shrink-0 h-14 border-t border-border-subtle bg-bg-subtle/95 backdrop-blur-sm flex relative z-30">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 relative",
            value === t.id ? "text-ink-primary" : "text-ink-muted",
          )}
        >
          <span className="text-lg leading-none">{t.icon}</span>
          <span className="text-[10px] uppercase tracking-wider">{t.label}</span>
          {busy && t.id === "workspace" && (
            <span className="absolute top-1.5 right-[35%] w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
          )}
        </button>
      ))}
    </nav>
  );
}
