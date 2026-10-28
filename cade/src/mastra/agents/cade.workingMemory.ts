import { z } from "zod";

/*
 * The web PlanCard reads this shape via /app/state: field names are a frontend contract.
 * Mastra deep-merges objects but replaces ARRAYS wholesale, so Cade sends the full plan.
 */

export const planItemStatus = z.enum(["todo", "doing", "done"]);
export type PlanItemStatus = z.infer<typeof planItemStatus>;

export const planItemSchema = z.object({
  id: z
    .string()
    .describe(
      "Stable id for this step — keep the same id across status changes so the UI can animate transitions",
    ),
  title: z
    .string()
    .describe(
      "What Cade is doing in plain language, e.g. 'Capture W-2 box 1 wages' or 'Confirm CA full-year residency'. Premium-feeling phrasing — short, specific, taxpayer-readable.",
    ),
  status: planItemStatus.describe(
    "todo = not yet started, doing = currently working on, done = finished",
  ),
  note: z
    .string()
    .optional()
    .describe(
      "Optional one-liner — what's blocking it, what we're waiting on, or why this is next",
    ),
});
export type PlanItem = z.infer<typeof planItemSchema>;

export const cadeWorkingMemorySchema = z.object({
  plan: z
    .array(planItemSchema)
    .optional()
    .describe(
      "Rolling 1–5 item plan of Cade's next steps. Empty/absent when there's genuinely nothing in flight.",
    ),
});
export type CadeWorkingMemory = z.infer<typeof cadeWorkingMemorySchema>;
