/*
 * form-engine — the pipeline from source documents to the form engine's
 * checked-in assets. Inputs: blank fillable PDFs and published tax
 * tables. Outputs: catalog.json widget inventories, bindings.ts, typed
 * interfaces, and tax-table JSON. For
 * instruction booklets → RAG, see `npm run corpus`.
 *
 *   npm run form-engine -- <command>    (or: npx tsx scripts/formEngine/cli.ts)
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { runCli } from "../lib/cli";
import { generateBindingsCommand } from "./generateBindings";
import { generateCatalogCommand } from "./generateCatalog";
import { generateTypesCommand } from "./generateTypes";
import { ingestCaTaxTableCommand } from "./ingestCaTaxTable";
import { ingestFederalTaxTableCommand } from "./ingestFederalTaxTable";

/*
 * generate-catalog and generate-bindings call Anthropic (ANTHROPIC_API_KEY),
 * and generate-bindings searches Canon (CANON_URL). Same env files as Canon
 * and Cade: .env (personal overrides) first, then .env.development (written
 * by scripts/bootstrap-env.mjs) fills the gaps. dotenv never overrides set
 * keys.
 */
const BUILDER_ROOT = resolve(__dirname, "../..");
config({ path: resolve(BUILDER_ROOT, ".env"), quiet: true });
config({ path: resolve(BUILDER_ROOT, ".env.development"), quiet: true });

// runCli catches subcommand errors and exits itself — safe to not await.
void runCli({
  name: "form-engine",
  bin: "npm run form-engine --",
  description:
    "Form-engine asset pipeline: blank PDFs and tax tables → catalogs, bindings, types, runtime tree.",
  commands: [
    generateCatalogCommand,
    generateBindingsCommand,
    generateTypesCommand,
    ingestFederalTaxTableCommand,
    ingestCaTaxTableCommand,
  ],
});
