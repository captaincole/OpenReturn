import { registerApiRoute } from "@mastra/core/server";
import { getDocumentSource } from "../../../db/corpusFiles";
import { getDocument } from "../../../db/corpusStore";
import { listLibrary, listSections } from "../../../db/refLibrary";

/*
 * Corpus data is shared reference material, not user data, so these routes
 * need no owner check. The optional CANON_API_TOKEN gate is the only guard.
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
 * The web page renders this HTML as-is. That is safe only because the
 * cleaner (refdocs/html/cleanFtb.ts) allowlists tags, attributes and links.
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
