/*
 * Thread ids. A filing has two conversations: the return, and the deductions
 * conversation next to it. The web app builds the same ids (web/lib/chatSession.ts):
 * there is no shared package yet.
 */

export const mainThreadId = (userId: string, year: number | string): string => `${userId}::${year}`;

export const deductionsThreadId = (userId: string, year: number | string): string =>
  `${mainThreadId(userId, year)}::deductions`;

/* The two conversations by name. A requested action records the one that made it. */
export const CONVERSATIONS = ["return", "deductions"] as const;
export type Conversation = (typeof CONVERSATIONS)[number];
