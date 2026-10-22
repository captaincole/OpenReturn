import { registerApiRoute } from "@mastra/core/server";
import { getDocumentPdf } from "../../db/corpusFiles";
import { getDocument } from "../../db/corpusStore";
import { listLibrary } from "../../db/refLibrary";

/*
 * The reference library — what tax-code Q&A searches.
 *
 *   GET /app/refdocs              → { documents: LibraryDocument[] }
 *   GET /app/refdocs/:docId/pdf   → the source PDF, inline, from corpus.db
 *
 * The web app links to the PDF with a #page=N fragment, so the browser's
 * viewer opens on the cited page. A document whose PDF is not stored (a
 * corpus built before ref_document_files) redirects to its sourceUrl; the
 * browser keeps the #page fragment across the redirect. Corpus data is shared reference
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
    const docId = c.req.param("docId");
    const pdf = await getDocumentPdf(docId);
    if (!pdf) {
      const sourceUrl = (await getDocument(docId))?.sourceUrl;
      return sourceUrl ? c.redirect(sourceUrl, 302) : c.json({ error: "not found" }, 404);
    }
    return c.body(pdf, 200, {
      "content-type": "application/pdf",
      "cache-control": "private, max-age=3600",
    });
  },
});
