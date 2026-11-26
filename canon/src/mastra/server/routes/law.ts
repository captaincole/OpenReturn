import { registerApiRoute } from "@mastra/core/server";
import { lawInstalled } from "../../../db/libsql";
import { LAW_NOT_INSTALLED } from "../../../law/lawRead";
import { lawStatus, readLawSection } from "../../../law/lawSection";

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
