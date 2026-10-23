/*
 * "Project root" for offline tooling — tests, scripts, refdocs:* — that run
 * with cwd at apps/agent/. The engine never imports this.
 */

export const projectRoot = process.cwd();

/* The engine's source tree, where form tools write catalog.json and bindings.ts. */
export { engineSrcDir } from "@openreturn/engine/paths";
