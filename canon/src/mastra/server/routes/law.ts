import { registerApiRoute } from "@mastra/core/server";
import type { Context } from "hono";
import { lawInstalled } from "../../../db/libsql";
import { jurisdictionOfLawSource, type Jurisdiction } from "../../../jurisdiction";
import { jurisdictionOfCitation, lawNotInstalledMessage } from "../../../law/lawRead";
import { lawStatus, readLawSection } from "../../../law/lawSection";
import { isLawSource, readLawToc } from "../../../law/lawToc";

/*
 * The law pages' routes (the Code, the regulations, California's code). Like
 * the refdocs routes, shared reference material: no owner check, the
 * CANON_API_TOKEN gate is the only guard. Each checks lawInstalled() first
 * (the file of the jurisdiction asked for, or any file for the status), so a
 * missing law file is never created.
 */

/* The installed: false answer, or null when the law asked for is installed. */
async function notInstalled(ctx: Context, jurisdiction: Jurisdiction | null) {
  if (await lawInstalled(jurisdiction ?? undefined)) return null;
  const message = lawNotInstalledMessage(jurisdiction ? [jurisdiction] : undefined);
  return ctx.json({ installed: false, message });
}

export const lawStatusRoute = registerApiRoute("/app/law/status", {
  method: "GET",
  handler: async (ctx) =>
    (await notInstalled(ctx, null)) ?? ctx.json({ installed: true, ...(await lawStatus()) }),
});

// The whole section, every block in order: the page shows all of it. "1.469-5T" is a regulation.
export const lawSectionRoute = registerApiRoute("/app/law/sections/:section", {
  method: "GET",
  handler: async (ctx) => {
    const section = ctx.req.param("section");
    const missing = await notInstalled(ctx, jurisdictionOfCitation(section));
    if (missing) return missing;
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
  const source = ctx.req.param("source") ?? "";
  const node = ctx.req.param("node");
  const missing = await notInstalled(
    ctx,
    isLawSource(source) ? jurisdictionOfLawSource(source) : null,
  );
  if (missing) return missing;
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
