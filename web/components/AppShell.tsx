"use client";

import { ChatPane } from "@/components/ChatPane";
import { ConversationSwitch } from "@/components/ConversationSwitch";
import { TopBar } from "@/components/TopBar";
import { useConversations, type ChatMessage, type SendChatOpts } from "@/components/useCadeChat";
import { fetchState, UnauthorizedError, type CaseState } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { DEDUCTIONS_SEGMENT, type Conversation } from "@/lib/chatSession";
import { cn } from "@/lib/cn";
import { type UserProfile } from "@/lib/profile";
import { type TaxReturn } from "@/lib/returns";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type { ChatMessage, SendChatOpts };

/* Mobile only: desktop renders every section. "summary" is the deductions route's one section. */
export type MobilePane = "chat" | "activity" | "forms" | "documents" | "summary";

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
  /* The conversation the chat pane shows: the route picks it. Messages and sendChat are its own. */
  conversation: Conversation["id"];
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  cadeBusy: boolean;
  /* The phone's pane, kept per conversation: each route opens on its own. */
  mobilePane: MobilePane;
  setMobilePane: (pane: MobilePane) => void;
  /* The one way to send a turn. Resolves when the stream ends; no-op while Cade is busy. */
  sendChat: (opts: SendChatOpts) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) throw new Error("useAppShell must be used inside <AppShell>");
  return context;
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
  const [mobilePanes, setMobilePanes] = useState<Record<Conversation["id"], MobilePane>>({
    return: "activity",
    deductions: "chat",
  });
  /* The segment under /r/[returnId]: null on the return page. */
  const conversation: Conversation["id"] =
    useSelectedLayoutSegment() === DEDUCTIONS_SEGMENT ? "deductions" : "return";
  const setMobilePane = (pane: MobilePane) =>
    setMobilePanes((panes) => ({ ...panes, [conversation]: pane }));

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

  const chat = useConversations(
    { userId, activeReturn, refreshState, onUnauthorized: onSignOut },
    conversation,
  );

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
    conversation,
    messages: chat.messages,
    setMessages: chat.setMessages,
    cadeBusy: chat.cadeBusy,
    mobilePane: mobilePanes[conversation],
    setMobilePane,
    sendChat: chat.sendChat,
    onSignOut,
  };

  return (
    <AppShellContext.Provider value={ctx}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-ink-primary">
        <TopBar activeReturn={activeReturn} returns={returns} />
        {/* The top bar has no room for the switch on a phone: it gets a row of its own. */}
        <div className="shrink-0 border-b border-border-subtle px-4 py-1.5 sm:hidden">
          <ConversationSwitch className="flex" />
        </div>
        <ShellPanes>{children}</ShellPanes>
        <MobileTabBar />
      </div>
    </AppShellContext.Provider>
  );
}

/* Below lg, CSS hides the unpicked pane, so neither unmounts on a tab switch. */
function ShellPanes({ children }: { children: React.ReactNode }) {
  const { activeReturn, mobilePane } = useAppShell();
  return (
    <main className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col lg:flex lg:w-[40%] lg:max-w-[640px] lg:min-w-[400px] lg:flex-none lg:shrink-0 lg:border-r lg:border-border-subtle lg:bg-bg-subtle/40",
          mobilePane === "chat" ? "flex" : "hidden",
        )}
      >
        <ChatPane activeReturn={activeReturn} />
      </aside>
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col lg:flex",
          mobilePane === "chat" ? "hidden" : "flex",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </section>
    </main>
  );
}

type MobileTab = { id: MobilePane; label: string; icon: string };

const RETURN_TABS: MobileTab[] = [
  { id: "chat", label: "Chat", icon: "◐" },
  { id: "activity", label: "Activity", icon: "≋" },
  { id: "forms", label: "Forms", icon: "▤" },
  { id: "documents", label: "Documents", icon: "▦" },
];

const DEDUCTIONS_TABS: MobileTab[] = [
  { id: "chat", label: "Chat", icon: "◐" },
  { id: "summary", label: "Summary", icon: "≋" },
];

/* The tab that shows what Cade writes while a turn runs: it carries the busy dot. */
const BUSY_TABS: MobilePane[] = ["activity", "summary"];

function MobileTabBar() {
  const { conversation, mobilePane, setMobilePane, cadeBusy } = useAppShell();
  const tabs = conversation === "deductions" ? DEDUCTIONS_TABS : RETURN_TABS;
  return (
    <nav className="relative z-30 flex h-14 shrink-0 border-t border-border-subtle bg-bg-subtle/95 backdrop-blur-sm lg:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMobilePane(tab.id)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5",
            mobilePane === tab.id ? "text-ink-primary" : "text-ink-muted",
          )}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="text-[10px] tracking-wider uppercase">{tab.label}</span>
          {cadeBusy && BUSY_TABS.includes(tab.id) && (
            <span className="absolute top-1.5 right-[30%] h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warn" />
          )}
        </button>
      ))}
    </nav>
  );
}
