/* form-engine CLI: blank PDFs and tax tables → the engine's checked-in assets. */

import { config } from "dotenv";
import { resolve } from "node:path";
import { runCli } from "../lib/cli";
import { extractWidgetsCommand } from "./extractWidgets";
import { formStatusCommand } from "./formStatus";
import { generateBindingsCommand } from "./generateBindings";
import { generateCatalogCommand } from "./generateCatalog";
import { generateTypesCommand } from "./generateTypes";
import { ingestCaTaxTableCommand } from "./ingestCaTaxTable";
import { ingestFederalTaxTableCommand } from "./ingestFederalTaxTable";
import { writeCatalogCommand } from "./writeCatalog";

/* .env (personal overrides) first, then .env.development. dotenv never overrides a set key. */
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
    extractWidgetsCommand,
    writeCatalogCommand,
    formStatusCommand,
    generateCatalogCommand,
    generateBindingsCommand,
    generateTypesCommand,
    ingestFederalTaxTableCommand,
    ingestCaTaxTableCommand,
  ],
});
