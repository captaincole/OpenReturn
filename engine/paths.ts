/* On-disk engine paths for offline tooling only. src/ reads no files and never imports this. */

import { resolve } from "node:path";

export const ENGINE_ROOT = __dirname;

export const engineSrcDir = resolve(__dirname, "src");
