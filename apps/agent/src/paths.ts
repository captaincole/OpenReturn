import { resolve } from "node:path";

/*
 * "Project root" for offline tooling — tests, scripts, refdocs:* — that run
 * with cwd at apps/agent/. The engine never imports this.
 */

export const projectRoot = process.cwd();

/*
 * The engine's source tree. Each form's catalog.json and bindings.ts sit
 * at <engineSrcDir>/<relativeDir>/ (for example federal/1040).
 */
export const engineSrcDir = resolve(projectRoot, "src/engine");
