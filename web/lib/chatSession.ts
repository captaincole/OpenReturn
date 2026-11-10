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

/* Keyed by year, not filing UUID, so a reset that recreates the filing keeps the same thread. */
const mainThreadId = (userId: string, returnId: string): string => `${userId}::${returnId}`;

const deductionsThreadId = (userId: string, returnId: string): string =>
  `${mainThreadId(userId, returnId)}::deductions`;

export const RETURN_CONVERSATION: Conversation = {
  id: "return",
  agentId: "cade",
  threadId: mainThreadId,
};

export const DEDUCTIONS_CONVERSATION: Conversation = {
  id: "deductions",
  agentId: "cade-deductions",
  threadId: deductionsThreadId,
};

/* For a value from outside the app's own code, such as a query parameter. */
export const isConversationId = (value: string | null): value is Conversation["id"] =>
  value === RETURN_CONVERSATION.id || value === DEDUCTIONS_CONVERSATION.id;

/* The route segment under /r/[returnId] that shows the deductions conversation. */
export const DEDUCTIONS_SEGMENT = "deductions";

export const returnHref = (returnId: string): string => `/r/${returnId}`;

export const deductionsHref = (returnId: string): string =>
  `${returnHref(returnId)}/${DEDUCTIONS_SEGMENT}`;
