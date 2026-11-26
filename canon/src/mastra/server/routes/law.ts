import { registerApiRoute } from "@mastra/core/server";
import type { Context } from "hono";
import { lawInstalled } from "../../../db/libsql";
import { LAW_NOT_INSTALLED } from "../../../law/lawRead";
import { lawStatus, readLawSection } from "../../../law/lawSection";
import { isLawSource, readLawToc } from "../../../law/lawToc";

/*
 * The law pages' routes (the Code and the regulations). Like the refdocs routes, shared reference
 * material: no owner check, the CANON_API_TOKEN gate is the only guard.
 * Each checks lawInstalled() first, so a missing law.db is never created.
 */

export const lawStatusRoute = registerApiRoute("/app/law/status", {
  method: "GET",
  handler: async (ctx) => {
    if (!(await lawInstalled())) return ctx.json({ installed: false, message: LAW_NOT_INSTALLED });
    return ctx.json({ installed: true, ...(await lawStatus()) });
  },
});

// The whole section, every block in order: the page shows all of it. "1.469-5T" is a regulation.
export const lawSectionRoute = registerApiRoute("/app/law/sections/:section", {
  method: "GET",
  handler: async (ctx) => {
    if (!(await lawInstalled())) return ctx.json({ installed: false, message: LAW_NOT_INSTALLED });
    const section = ctx.req.param("section");
    const page = await readLawSection(section);
    if (!page) return ctx.json({ error: `The law library has no section ${section}.` }, 404);
    return ctx.json({ installed: true, ...page });
  },
});

/*
 * One level of the table of contents: a node, the levels above it and the
 * level below it. With no node, the top level of the document. "statute" or
 * "regulations" names the newest document of that library, as a section does.
 */
async function tocHandler(ctx: Context): Promise<Response> {
  if (!(await lawInstalled())) return ctx.json({ installed: false, message: LAW_NOT_INSTALLED });
  const source = ctx.req.param("source") ?? "";
  const node = ctx.req.param("node");
  const toc = isLawSource(source) ? await readLawToc(source, node) : null;
  if (!toc) return ctx.json({ error: tocNotFound(source, node) }, 404);
  return ctx.json({ installed: true, ...toc });
}

const tocNotFound = (source: string, node: string | undefined) =>
  node
    ? `The law library has no level ${node} in the ${source}.`
    : `The law library has no ${source}.`;

export const lawTocRoute = registerApiRoute("/app/law/toc/:source", {
  method: "GET",
  handler: tocHandler,
});

export const lawTocNodeRoute = registerApiRoute("/app/law/toc/:source/:node", {
  method: "GET",
  handler: tocHandler,
});
