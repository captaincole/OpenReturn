import { z } from "zod";

/*
 * What userMiddleware puts on every request's context, as the schema
 * Cade's agent and tools declare (`requestContextSchema`). Mastra
 * validates it before the agent's first model call and before a tool
 * runs, and `requestContext.get` is typed by it. MASTRA_RESOURCE_ID_KEY
 * (memory scoping) is set alongside and stays an infrastructure key.
 */
export const REQUEST_CONTEXT_KEYS = {
  userId: "userId",
  userEmail: "userEmail",
} as const;

export const cadeRequestContextSchema = z.object({
  /** The user's id (app.db `users.id`). */
  userId: z.string().min(1),
  /** The user's email: the engine's authEmail enrichment. */
  userEmail: z.string(),
});
export type CadeRequestContext = z.infer<typeof cadeRequestContextSchema>;
