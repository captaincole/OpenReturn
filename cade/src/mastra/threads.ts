/*
 * Thread ids. A filing has two conversations: the return, and the deductions
 * conversation next to it. The web app builds the same ids (web/lib/returns.ts):
 * there is no shared package yet.
 */

export const mainThreadId = (userId: string, year: number | string): string => `${userId}::${year}`;

export const deductionsThreadId = (userId: string, year: number | string): string =>
  `${mainThreadId(userId, year)}::deductions`;
