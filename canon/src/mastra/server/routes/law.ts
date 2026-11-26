import { registerApiRoute } from "@mastra/core/server";
import { lawInstalled } from "../../../db/libsql";
import { LAW_NOT_INSTALLED } from "../../../law/lawRead";
import { lawStatus, readLawSection } from "../../../law/lawSection";

/*
 * The statute page's routes. Like the refdocs routes, shared reference
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

// The whole section, every block in statute order: the page shows all of it.
export const lawSectionRoute = registerApiRoute("/app/law/sections/:section", {
  method: "GET",
  handler: async (ctx) => {
    if (!(await lawInstalled())) return ctx.json({ installed: false, message: LAW_NOT_INSTALLED });
    const section = ctx.req.param("section");
    const page = await readLawSection(section);
    if (!page) return ctx.json({ error: `The Code has no section ${section}.` }, 404);
    return ctx.json({ installed: true, ...page });
  },
});
