"use client";

/* One sendChat code path for every caller prevents state-trigger races and double sends. */

import { UnauthorizedError } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { CADE_AGENT_ID } from "@/lib/chatSession";
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
  /* The caller already wrote the file to user_documents. */
  skipUpload?: boolean;
}

export interface CadeChat {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  cadeBusy: boolean;
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
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const parts = message.content?.parts ?? [];
    const text = parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
    const attachmentName = message.content?.experimental_attachments?.[0]?.name ?? undefined;
    if (!text && !attachmentName) continue;
    converted.push({
      id: message.id,
      role: message.role,
      content: text || (attachmentName ? `Uploaded ${attachmentName}` : ""),
      attachmentName,
    });
  }
  return converted;
}

interface ChatCtx {
  userId: string;
  activeReturn: TaxReturn;
  realData: boolean;
  refreshState: () => Promise<void>;
  onUnauthorized: () => Promise<void>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setCadeBusy: Dispatch<SetStateAction<boolean>>;
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
      agentId: CADE_AGENT_ID,
    });
    const res = await thread.listMessages({ perPage: 200 });
    const converted = convertThreadMessages(res.messages);
    ctx.setMessages((current) => (current.length > 0 ? current : converted));
  } catch {
    // No thread yet, or the request failed: keep the buffer empty.
  }
}

async function streamTurn(
  ctx: ChatCtx,
  payload: unknown,
  freshUserId: string,
  assistantId: string,
): Promise<void> {
  const client = await makeMastraClient();
  const stream = await client.getAgent(CADE_AGENT_ID).stream(payload as string, {
    memory: {
      thread: threadIdFor(freshUserId, ctx.activeReturn.id),
      resource: freshUserId,
    },
  });
  await stream.processDataStream({
    onChunk: async (chunk) => {
      if (chunk.type === "text-delta") {
        const delta = (chunk.payload as { text: string }).text;
        ctx.setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: msg.content + delta } : msg,
          ),
        );
      }
    },
  });
}

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
    ctx.setTurnTick((tick) => tick + 1);
  } catch (err) {
    const message =
      err instanceof UnauthorizedError
        ? "Session expired — please sign in again."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";
    ctx.setMessages((prev) =>
      prev.map((msg) => (msg.id === assistantId ? { ...msg, content: `[${message}]` } : msg)),
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
  ctx.setCadeBusy(true);

  const userMsg: ChatMessage = {
    id: freshId("u"),
    role: "user",
    content: text || (file ? `Uploaded ${file.name}` : ""),
    attachmentName: file?.name,
  };
  const assistantMsg: ChatMessage = { id: freshId("a"), role: "assistant", content: "" };
  ctx.setMessages((prev) => [...prev, userMsg, assistantMsg]);

  if (file && !sendOpts.skipUpload) {
    uploadDocument(file).catch((err) => {
      console.warn("[chat] upload to user-documents failed:", err);
    });
  }

  try {
    await runTurn(ctx, text, file, assistantMsg.id);
  } finally {
    ctx.setCadeBusy(false);
    ctx.sendingRef.current = false;
  }
}

export function useCadeChat(opts: {
  userId: string;
  activeReturn: TaxReturn;
  refreshState: () => Promise<void>;
  onUnauthorized: () => Promise<void>;
}): CadeChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cadeBusy, setCadeBusy] = useState(false);
  const [turnTick, setTurnTick] = useState(0);
  /* setCadeBusy is async: two calls in one tick both pass `if (cadeBusy)`. The ref is sync. */
  const sendingRef = useRef(false);

  const ctx: ChatCtx = {
    userId: opts.userId,
    activeReturn: opts.activeReturn,
    realData: opts.activeReturn.realDataAvailable,
    refreshState: opts.refreshState,
    onUnauthorized: opts.onUnauthorized,
    setMessages,
    setCadeBusy,
    setTurnTick,
    sendingRef,
  };

  return {
    messages,
    setMessages,
    cadeBusy,
    turnTick,
    bumpTurn: () => setTurnTick((tick) => tick + 1),
    sendChat: (sendOpts) => sendChatImpl(ctx, sendOpts),
    loadChatHistory: () => loadChatHistoryImpl(ctx),
  };
}
