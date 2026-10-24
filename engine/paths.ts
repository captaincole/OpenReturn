/*
 * Where the engine package sits on disk, for offline tooling: tests,
 * scripts, and the builder (form-engine generate-catalog and
 * generate-bindings write into src/<relativeDir>/). The engine itself
 * (src/) reads no files and never imports this.
 */

import { resolve } from "node:path";

export const ENGINE_ROOT = __dirname;

/* Each form's catalog.json and bindings.ts sit at <engineSrcDir>/<relativeDir>/. */
export const engineSrcDir = resolve(__dirname, "src");
