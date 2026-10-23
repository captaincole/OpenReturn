import { registerApiRoute } from "@mastra/core/server";
import { getDocumentSource } from "../../../db/corpusFiles";
import { getDocument } from "../../../db/corpusStore";
import { listLibrary, listSections } from "../../../db/refLibrary";

/*
 * The reference library — what tax-code Q&A searches.
 *
 *   GET /app/refdocs              → { documents: LibraryDocument[] }
 *   GET /app/refdocs/:docId/pdf   → the source PDF, inline, from corpus.db
 *   GET /app/refdocs/:docId/html  → a cleaned HTML document (format
 *                                   "html") and its headings, for the
 *                                   library's page
 *
 * The web app links to the PDF with a #page=N fragment, so the browser's
 * viewer opens on the cited page; a PDF document whose file is not stored
 * redirects to its sourceUrl. Corpus data is shared reference material,
 * not user data, so these routes need no owner check; the optional
 * CANON_API_TOKEN gate (server/tokenGate.ts) is the only guard.
 */

export const listRefDocsRoute = registerApiRoute("/app/refdocs", {
  method: "GET",
  handler: async (c) => c.json({ documents: await listLibrary() }),
});

export const refDocPdfRoute = registerApiRoute("/app/refdocs/:docId/pdf", {
  method: "GET",
  handler: async (c) => {
    const doc = await getDocument(c.req.param("docId"));
    if (!doc) return c.json({ error: "not found" }, 404);
    const pdf = doc.format === "pdf" ? await getDocumentSource(doc.docId) : null;
    if (!pdf) {
      return doc.sourceUrl ? c.redirect(doc.sourceUrl, 302) : c.json({ error: "not found" }, 404);
    }
    return c.body(pdf, 200, {
      "content-type": "application/pdf",
      "cache-control": "private, max-age=3600",
    });
  },
});

/*
 * The stored HTML is the cleaner's output (refdocs/html/cleanFtb.ts):
 * allowlisted tags, no scripts or event attributes, safe link schemes, a
 * title built from text. The web page renders it as-is.
 */
export const refDocHtmlRoute = registerApiRoute("/app/refdocs/:docId/html", {
  method: "GET",
  handler: async (c) => {
    const doc = await getDocument(c.req.param("docId"));
    const source = doc?.format === "html" ? await getDocumentSource(doc.docId) : null;
    if (!doc || !source) return c.json({ error: "not found" }, 404);
    const { docId, title, publisher, taxYear, sourceUrl, published } = doc;
    return c.json({
      docId,
      title,
      publisher,
      taxYear,
      sourceUrl,
      published,
      html: new TextDecoder().decode(source),
      sections: await listSections(docId),
    });
  },
});
