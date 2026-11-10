import { threadIdFor } from "@/lib/returns";

/*
 * A filing has two conversations with Cade: the return, and the deductions
 * conversation next to it. Each has its own agent and its own thread. The
 * agent ids must match cade/src/mastra/index.ts, and the thread ids
 * cade/src/mastra/threads.ts.
 */
export interface Conversation {
  id: "return" | "deductions";
  agentId: string;
  threadId: (userId: string, returnId: string) => string;
}

export const RETURN_CONVERSATION: Conversation = {
  id: "return",
  agentId: "cade",
  threadId: threadIdFor,
};

export const DEDUCTIONS_CONVERSATION: Conversation = {
  id: "deductions",
  agentId: "cade-deductions",
  threadId: (userId, returnId) => `${threadIdFor(userId, returnId)}::deductions`,
};

/* The route segment under /r/[returnId] that shows the deductions conversation. */
export const DEDUCTIONS_SEGMENT = "deductions";
