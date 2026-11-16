/* form-engine CLI: blank PDFs and tax tables → the engine's checked-in assets. */

import { runCli } from "../lib/cli";
import { extractWidgetsCommand } from "./extractWidgets";
import { formStatusCommand } from "./formStatus";
import { generateTypesCommand } from "./generateTypes";
import { ingestCaEitcTableCommand } from "./ingestCaEitcTable";
import { ingestCaTaxTableCommand } from "./ingestCaTaxTable";
import { ingestFederalTaxTableCommand } from "./ingestFederalTaxTable";
import { seedLabelsCommand } from "./seedLabels";
import { writeCatalogCommand } from "./writeCatalog";

// runCli catches subcommand errors and exits itself — safe to not await.
void runCli({
  name: "form-engine",
  bin: "npm run form-engine --",
  description:
    "Form-engine asset pipeline: blank PDFs and tax tables → catalogs, field types, tax-table JSON.",
  commands: [
    extractWidgetsCommand,
    seedLabelsCommand,
    writeCatalogCommand,
    formStatusCommand,
    generateTypesCommand,
    ingestFederalTaxTableCommand,
    ingestCaTaxTableCommand,
    ingestCaEitcTableCommand,
  ],
});
