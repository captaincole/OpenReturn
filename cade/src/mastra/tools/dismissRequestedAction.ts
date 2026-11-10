import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { resolveUploads } from "../db/requestedActions";
import { cadeRequestContextSchema } from "../server/requestContext";
import { requireUserContext } from "./userContext";

export const dismissRequestedAction = createTool({
  id: "dismiss-requested-action",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Close a dashboard upload card after you've successfully ingested the document the user uploaded. Pass the same documentType string you used when you called request-document-upload (or the canonical doc name if it was uploaded without a card). Closes each open or processing card with that document type. Safe to call even when no matching card exists.",
  inputSchema: z.object({
    documentType: z
      .string()
      .describe(
        "Canonical document name, e.g. 'W-2', '1099-DIV', '1099-INT', 'K-1'. Match is case-insensitive.",
      ),
  }),
  outputSchema: z.object({
    dismissed: z.boolean(),
    actionId: z.string().nullable(),
  }),
  execute: async (input, context) => {
    const { scope } = await requireUserContext(context);
    /* A card for the same document in the other conversation closes too: the document is in. */
    const [actionId] = await resolveUploads(scope, input.documentType);
    return { dismissed: actionId !== undefined, actionId: actionId ?? null };
  },
});
