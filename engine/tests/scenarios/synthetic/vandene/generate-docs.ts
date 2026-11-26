/* Renders the two Forms 8986 into docs/: npx tsx tests/scenarios/synthetic/vandene/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8986Pdf, type Form8986Partner } from "../../documents/form8986.js";
import { VANDENE, copperline, saltmarsh } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

const partner: Form8986Partner = {
  firstName: VANDENE.firstName,
  lastName: VANDENE.lastName,
  street: VANDENE.street,
  city: VANDENE.city,
  state: VANDENE.state,
  zip: VANDENE.zip,
  tin: "***-**-8978",
  generalPartner: false,
};

const documents = [
  { file: "01-form-8986-copperline-ventures.pdf", form: copperline },
  { file: "02-form-8986-saltmarsh-timber.pdf", form: saltmarsh },
];

async function main() {
  for (const { file, form } of documents) {
    const pdf = await form8986Pdf(form, partner);
    await writeFile(join(docsDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
