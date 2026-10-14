"use client";

/*
 * The chat session behind AppShell: message buffer, busy flag, history
 * hydration, and the single sendChat entry point that streams a turn to
 * Luca. Extracted from AppShell so the shell stays layout + context
 * plumbing. One sendChat code path (chat input and the Requested
 * Actions card both call it) prevents useEffect bridges, state-trigger
 * races, and double sends.
 */

import { UnauthorizedError } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { LUCA_AGENT_ID } from "@/lib/chatSession";
import { makeMastraClient } from "@/lib/mastraClient";
import { threadIdFor, type TaxReturn } from "@/lib/returns";
import { uploadDocument } from "@/lib/uploads";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
}

export interface SendChatOpts {
  text?: string;
  file?: File;
  /*
   * Set true when the caller already wrote the file to user_documents.
   * Then sendChat does not upload the file again.
   */
  skipUpload?: boolean;
}

export interface LucaChat {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  lucaBusy: boolean;
  turnTick: number;
  bumpTurn: () => void;
  sendChat: (opts: SendChatOpts) => Promise<void>;
  loadChatHistory: () => Promise<void>;
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

/* The stream payload: plain text, or a one-message array with the file inlined. */
async function buildPayload(text: string, file: File | undefined): Promise<unknown> {
  if (!file) return text;
  const base64 = await readFileAsBase64(file);
  const mediaType = file.type || "application/pdf";
  return [
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

/* Convert a Mastra thread listing into the ChatMessage buffer shape. */
function convertThreadMessages(
  messages: Array<{
    id: string;
    role: string;
    content?: {
      parts?: Array<{ type: string; text?: string }>;
      experimental_attachments?: Array<{ name?: string }>;
    };
  }>,
): ChatMessage[] {
  const converted: ChatMessage[] = [];
  for (const m of messages) {
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
  return converted;
}

/*
 * Everything the top-level send/load implementations need. Built fresh
 * each render by the hook; the implementations live at module level so
 * no single function carries the whole session.
 */
interface ChatCtx {
  userId: string;
  activeReturn: TaxReturn;
  realData: boolean;
  refreshState: () => Promise<void>;
  onUnauthorized: () => Promise<void>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setLucaBusy: Dispatch<SetStateAction<boolean>>;
  setTurnTick: Dispatch<SetStateAction<number>>;
  sendingRef: { current: boolean };
}

async function loadChatHistoryImpl(ctx: ChatCtx): Promise<void> {
  if (!ctx.realData) {
    ctx.setMessages([]);
    return;
  }
  try {
    const client = await makeMastraClient();
    const thread = client.getMemoryThread({
      threadId: threadIdFor(ctx.userId, ctx.activeReturn.id),
      agentId: LUCA_AGENT_ID,
    });
    const res = await thread.listMessages({ perPage: 200 });
    const converted = convertThreadMessages(res.messages);
    ctx.setMessages((current) => (current.length > 0 ? current : converted));
  } catch {
    // Thread is missing or the request failed. Keep the buffer empty.
  }
}

/* Stream one turn; append each text delta onto the assistant message. */
async function streamTurn(
  ctx: ChatCtx,
  payload: unknown,
  freshUserId: string,
  assistantId: string,
): Promise<void> {
  const client = await makeMastraClient();
  const stream = await client.getAgent(LUCA_AGENT_ID).stream(payload as string, {
    memory: {
      thread: threadIdFor(freshUserId, ctx.activeReturn.id),
      resource: freshUserId,
    },
  });
  await stream.processDataStream({
    onChunk: async (chunk) => {
      if (chunk.type === "text-delta") {
        const delta = (chunk.payload as { text: string }).text;
        ctx.setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg)),
        );
      }
    },
  });
}

/* The guarded turn: payload build → auth check → stream → state refresh. */
async function runTurn(ctx: ChatCtx, text: string, file: File | undefined, assistantId: string) {
  try {
    const payload = await buildPayload(text, file);
    const freshUserId = await getUserId();
    if (!freshUserId) {
      await ctx.onUnauthorized();
      return;
    }
    await streamTurn(ctx, payload, freshUserId, assistantId);
    await ctx.refreshState();
    ctx.setTurnTick((t) => t + 1);
  } catch (err) {
    const message =
      err instanceof UnauthorizedError
        ? "Session expired — please sign in again."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";
    ctx.setMessages((m) =>
      m.map((msg) => (msg.id === assistantId ? { ...msg, content: `[${message}]` } : msg)),
    );
    if (err instanceof UnauthorizedError) {
      await ctx.onUnauthorized();
    }
  }
}

async function sendChatImpl(ctx: ChatCtx, sendOpts: SendChatOpts): Promise<void> {
  if (ctx.sendingRef.current) return;
  if (!ctx.realData) return;
  const text = (sendOpts.text ?? "").trim();
  const file = sendOpts.file;
  if (!text && !file) return;

  ctx.sendingRef.current = true;
  ctx.setLucaBusy(true);

  const userMsg: ChatMessage = {
    id: freshId("u"),
    role: "user",
    content: text || (file ? `Uploaded ${file.name}` : ""),
    attachmentName: file?.name,
  };
  const assistantMsg: ChatMessage = { id: freshId("a"), role: "assistant", content: "" };
  ctx.setMessages((m) => [...m, userMsg, assistantMsg]);

  /*
   * Write the file to user_documents in parallel. Then the Documents
   * tab shows it. Skip this when the caller already uploaded the file
   * (for example, the Requested Actions card).
   */
  if (file && !sendOpts.skipUpload) {
    uploadDocument(file).catch((err) => {
      console.warn("[chat] upload to user-documents failed:", err);
    });
  }

  try {
    await runTurn(ctx, text, file, assistantMsg.id);
  } finally {
    ctx.setLucaBusy(false);
    ctx.sendingRef.current = false;
  }
}

export function useLucaChat(opts: {
  userId: string;
  activeReturn: TaxReturn;
  refreshState: () => Promise<void>;
  onUnauthorized: () => Promise<void>;
}): LucaChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lucaBusy, setLucaBusy] = useState(false);
  const [turnTick, setTurnTick] = useState(0);
  /*
   * Synchronous gate against concurrent sendChat calls. setLucaBusy is
   * asynchronous. Two calls in the same tick can both pass an
   * `if (lucaBusy)` check. sendChatImpl sets this ref immediately and
   * clears it in the finally block.
   */
  const sendingRef = useRef(false);

  const ctx: ChatCtx = {
    userId: opts.userId,
    activeReturn: opts.activeReturn,
    realData: opts.activeReturn.realDataAvailable,
    refreshState: opts.refreshState,
    onUnauthorized: opts.onUnauthorized,
    setMessages,
    setLucaBusy,
    setTurnTick,
    sendingRef,
  };

  return {
    messages,
    setMessages,
    lucaBusy,
    turnTick,
    bumpTurn: () => setTurnTick((t) => t + 1),
    sendChat: (sendOpts) => sendChatImpl(ctx, sendOpts),
    loadChatHistory: () => loadChatHistoryImpl(ctx),
  };
}
