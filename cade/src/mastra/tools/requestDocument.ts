import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { requestUpload } from "../db/requestedActions";
import { cadeRequestContextSchema } from "../server/requestContext";
import type { Conversation } from "../threads";
import { requireUserContext } from "./userContext";

/* Where the web app shows the card: next to the conversation that asked. */
const CARD_PLACE: Record<Conversation, string> = {
  return: "on their dashboard",
  deductions: "on the Deductions tab, next to this conversation",
};

/*
 * Each agent gets its own tool, made for its conversation. The request records
 * that conversation from here: the model never names it.
 */
export const requestDocumentUploadFor = (conversation: Conversation) =>
  createTool({
    id: "request-document-upload",
    requestContextSchema: cadeRequestContextSchema,
    description: `Surface a structured document-upload request to the user as a card ${CARD_PLACE[conversation]}. Use ONLY when you need a specific tax document (W-2, 1099, K-1, 1098, etc.) and can't proceed without it — never for facts you can ask conversationally. Call once per document needed; don't repeat on subsequent turns. Returns the action id.`,
    inputSchema: z.object({
      year: z.number().int().describe("Tax year the document is for (e.g. 2025)."),
      documentType: z
        .string()
        .describe(
          "Short canonical name of the document, e.g. 'W-2', '1099-DIV', '1099-INT', '1099-B', '1099-DA', '1099-MISC', '1099-R', '1099-SA', 'K-1', '1098'. Don't include the year here.",
        ),
      title: z
        .string()
        .describe(
          "User-facing card title in plain English. Be specific — include the issuer if you know it. e.g. 'Upload your 2025 W-2 from Stripe' rather than 'Upload your W-2'.",
        ),
      detail: z
        .string()
        .describe(
          "One short sentence explaining what you need it for. e.g. 'Need Box 1 wages and Box 2 federal withholding to fill 1040 lines 1a and 25a.'",
        ),
    }),
    outputSchema: z.object({
      id: z.string(),
      requested: z.boolean(),
    }),
    execute: async (input, context) => {
      const { scope } = await requireUserContext(context);
      return requestUpload(scope, {
        conversation,
        taxYear: input.year,
        documentType: input.documentType,
        title: input.title,
        detail: input.detail,
      });
    },
  });
