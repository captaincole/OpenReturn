/* Renders the Form 8986 into docs/: npx tsx tests/scenarios/synthetic/harine/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8986Pdf } from "../../documents/form8986.js";
import { HARINE, fernhollow } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  const file = "01-form-8986-fernhollow-orchards.pdf";
  const pdf = await form8986Pdf(fernhollow, {
    firstName: HARINE.firstName,
    lastName: HARINE.lastName,
    street: HARINE.street,
    city: HARINE.city,
    state: HARINE.state,
    zip: HARINE.zip,
    tin: "***-**-8979",
    generalPartner: true,
  });
  await writeFile(join(docsDir, file), pdf);
  console.log(`✓ ${file} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
