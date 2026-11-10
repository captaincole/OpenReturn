/*
 * Quick replies: tap-to-answer options under Cade's message. Each question is
 * a requested_actions row of kind 'decide' whose options_json holds the
 * labels; a tap sends the label as the taxpayer's message. The open rows are
 * always those of Cade's latest offer: a new offer dismisses the ones before
 * it, and the taxpayer's next message resolves them (QuickReplyResolver).
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getAppDb, nowIso } from "../db/appDb";
import { cadeRequestContextSchema } from "../server/requestContext";
import { requireUserContext, type UserContext } from "./userContext";

/* Closes the filing's open quick replies: 'resolved' when the taxpayer answered, 'dismissed' when a new offer replaces them. */
export async function closeOpenQuickReplies(
  { userId, filingId }: Pick<UserContext, "userId" | "filingId">,
  status: "resolved" | "dismissed",
): Promise<void> {
  await getAppDb().execute({
    sql: `UPDATE requested_actions SET status = ?, resolved_at = ?
          WHERE user_id = ? AND filing_id = ? AND kind = 'decide' AND status = 'open'`,
    args: [status, nowIso(), userId, filingId],
  });
}

export const offerQuickReplies = createTool({
  id: "offer-quick-replies",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Show tap-to-answer replies under your next message: one card per question, each with its options. A tap sends the option's label as the taxpayer's message; the taxpayer can still type. Each call replaces the cards of the call before it, and every card closes when the taxpayer's next message arrives. Offer only the options `get-deductions` gives for the step; never offer an amount.",
  inputSchema: z.object({
    // No .max(): Anthropic rejects maxItems on a tool schema.
    replies: z
      .array(
        z.object({
          question: z.string().describe("The question, in the words you ask it"),
          options: z.array(z.string()).describe("The reply labels, e.g. ['Yes', 'No']"),
        }),
      )
      .describe("One entry per question in your next message"),
  }),
  outputSchema: z.object({ offered: z.number().describe("The cards now open") }),
  execute: async (input, context) => {
    const user = await requireUserContext(context);
    await closeOpenQuickReplies(user, "dismissed");
    const replies = input.replies.filter((reply) => reply.options.length > 0);
    const createdAt = nowIso();
    // One timestamp for the offer: readers order its cards by rowid.
    for (const reply of replies) {
      await getAppDb().execute({
        sql: `INSERT INTO requested_actions
                (id, user_id, filing_id, tax_year, kind, title, options_json, status, created_at)
              VALUES (?, ?, ?, ?, 'decide', ?, ?, 'open', ?)`,
        args: [
          crypto.randomUUID(),
          user.userId,
          user.filingId,
          user.taxYear,
          reply.question,
          JSON.stringify(reply.options),
          createdAt,
        ],
      });
    }
    return { offered: replies.length };
  },
});
