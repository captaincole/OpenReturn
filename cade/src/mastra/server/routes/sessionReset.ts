import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { resetCurrentUserData } from "../../db/resetUserData";

/* Wipes every domain row, Mastra thread and document blob that belongs to the caller. */
export const sessionResetRoute = registerApiRoute("/app/session/reset", {
  method: "POST",
  handler: async (ctx) => {
    const requestContext = ctx.get("requestContext");
    const userId = requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
    if (!userId) return ctx.json({ error: "unauthorized" }, 401);

    const { domainRowsDeleted, mastraThreadsDeleted, documentsDeleted } =
      await resetCurrentUserData(userId);

    return ctx.json({
      ok: true,
      domainRowsDeleted,
      mastraThreadsDeleted,
      documentsDeleted,
    });
  },
});
