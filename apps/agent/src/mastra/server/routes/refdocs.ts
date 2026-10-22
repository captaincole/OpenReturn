import { registerApiRoute } from "@mastra/core/server";
import { listLibrary } from "../../db/refLibrary";
import { loadSourcePdf } from "../../formAssets";

/*
 * The reference library — what tax-code Q&A searches.
 *
 *   GET /app/refdocs              → { documents: LibraryDocument[] }
 *   GET /app/refdocs/:docId/pdf   → the source PDF, inline
 *
 * The web app links to the PDF with a #page=N fragment, so the browser's
 * viewer opens on the cited page. Corpus data is shared reference
 * material, not user data, so these routes need no owner check beyond
 * the middleware's token gate.
 */

export const listRefDocsRoute = registerApiRoute("/app/refdocs", {
  method: "GET",
  handler: async (c) => c.json({ documents: await listLibrary() }),
});

export const refDocPdfRoute = registerApiRoute("/app/refdocs/:docId/pdf", {
  method: "GET",
  handler: async (c) => {
    const pdf = await loadSourcePdf(c.req.param("docId"));
    if (!pdf) return c.json({ error: "not found" }, 404);
    return c.body(new Uint8Array(pdf), 200, {
      "content-type": "application/pdf",
      "cache-control": "private, max-age=3600",
    });
  },
});
