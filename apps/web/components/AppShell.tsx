"use client";

/*
 * Return-scoped shell. It renders above every /r/[returnId]/* route.
 *
 * Layout:
 *   - TopBar: brand, return picker, tabs, right cluster.
 *   - Main, desktop: ChatPane on the left, {children} on the right.
 *   - Main, mobile: one pane. The bottom tab bar picks Chat or one of the
 *     workspace sections (Activity, Forms, Documents).
 *
 * AppShellContext supplies user state, the chat message buffer, lucaBusy,
 * turnTick, the mobile pane and its setter, and sendChat. The chat session itself
 * (buffer, history hydration, streaming) lives in useLucaChat.
 *
 * For placeholder returns (realDataAvailable=false), the shell does not
 * fetch /app/state and does not load chat history. sendChat is a no-op.
 */

import { ChatPane } from "@/components/ChatPane";
import { TopBar } from "@/components/TopBar";
import { useLucaChat, type ChatMessage, type SendChatOpts } from "@/components/useLucaChat";
import { fetchState, UnauthorizedError, type CaseState } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { type UserProfile } from "@/lib/profile";
import { type TaxReturn } from "@/lib/returns";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type { ChatMessage, SendChatOpts };

/*
 * Mobile only. The workspace page reads it to show one section; on
 * desktop every section renders and this value has no effect.
 */
export type MobilePane = "chat" | "activity" | "forms" | "documents";

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
  mobilePane: MobilePane;
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
  const [mobilePane, setMobilePane] = useState<MobilePane>("activity");

  async function onSignOut() {
    await signOut();
    router.refresh();
    router.push("/login");
  }

  async function refreshState() {
    if (!activeReturn.realDataAvailable) {
      setState(null);
      return;
    }
    try {
      setState(await fetchState());
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await onSignOut();
      }
    }
  }

  const chat = useLucaChat({
    userId,
    activeReturn,
    refreshState,
    onUnauthorized: onSignOut,
  });

  useEffect(() => {
    void refreshState();
    void chat.loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rerun only on a return switch, not on every render's new function identities
  }, [activeReturn.id]);

  const ctx: AppShellContextValue = {
    userId,
    activeReturn,
    returns,
    profile,
    state,
    refreshState,
    resetTick,
    turnTick: chat.turnTick,
    bumpTurn: chat.bumpTurn,
    messages: chat.messages,
    setMessages: chat.setMessages,
    lucaBusy: chat.lucaBusy,
    mobilePane,
    setMobilePane,
    sendChat: chat.sendChat,
    onSignOut,
  };

  return (
    <AppShellContext.Provider value={ctx}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-ink-primary">
        <TopBar activeReturn={activeReturn} returns={returns} />

        <main className="flex min-h-0 flex-1">
          <aside className="hidden w-[40%] max-w-[640px] min-w-[400px] shrink-0 flex-col border-r border-border-subtle bg-bg-subtle/40 lg:flex">
            <ChatPane activeReturn={activeReturn} />
          </aside>
          <section className="hidden min-w-0 flex-1 flex-col lg:flex">
            <WorkspaceFrame>{children}</WorkspaceFrame>
          </section>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:hidden">
            {mobilePane === "chat" ? (
              <ChatPane activeReturn={activeReturn} />
            ) : (
              <WorkspaceFrame>{children}</WorkspaceFrame>
            )}
          </div>
        </main>

        <MobileTabBar value={mobilePane} onChange={setMobilePane} busy={chat.lucaBusy} />
      </div>
    </AppShellContext.Provider>
  );
}

function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>;
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
    { id: "activity", label: "Activity", icon: "≋" },
    { id: "forms", label: "Forms", icon: "▤" },
    { id: "documents", label: "Documents", icon: "▦" },
  ];
  return (
    <nav className="relative z-30 flex h-14 shrink-0 border-t border-border-subtle bg-bg-subtle/95 backdrop-blur-sm lg:hidden">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5",
            value === t.id ? "text-ink-primary" : "text-ink-muted",
          )}
        >
          <span className="text-lg leading-none">{t.icon}</span>
          <span className="text-[10px] tracking-wider uppercase">{t.label}</span>
          {busy && t.id === "activity" && (
            <span className="absolute top-1.5 right-[30%] h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-400" />
          )}
        </button>
      ))}
    </nav>
  );
}
