import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { resolveUploads } from "../db/requestedActions";
import { cadeRequestContextSchema } from "../server/requestContext";
import { requireUserContext } from "./userContext";

export const dismissRequestedAction = createTool({
  id: "dismiss-requested-action",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Close the upload cards for a document after you've successfully ingested it. Pass the same documentType string you used when you called request-document-upload (or the canonical doc name if it was uploaded without a card). Closes each open or processing card with that document type, in this conversation and in the other one. Safe to call even when no matching card exists.",
  inputSchema: z.object({
    documentType: z
      .string()
      .describe(
        "Canonical document name, e.g. 'W-2', '1099-DIV', '1099-INT', 'K-1'. Match is case-insensitive.",
      ),
  }),
  outputSchema: z.object({
    dismissed: z.boolean(),
    closed: z.number().describe("How many cards closed."),
  }),
  execute: async (input, context) => {
    const { scope } = await requireUserContext(context);
    /* A card for the same document in the other conversation closes too: the document is in. */
    const closed = await resolveUploads(scope, input.documentType);
    return { dismissed: closed > 0, closed };
  },
});
