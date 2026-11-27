/* Renders the Form 8609 of Larkspur Commons into docs/: npx tsx tests/scenarios/synthetic/ewin/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8609Pdf } from "../../documents/form8609.js";
import { LARKSPUR } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

async function main() {
  await mkdir(docsDir, { recursive: true });
  // The owner in Part I is the developer that received the allocation; Ewin bought in later.
  const pdf = await form8609Pdf(LARKSPUR, {
    buildingAddress: ["Larkspur Commons", "1880 East Larkspur Avenue", "Spokane, WA 99207"],
    agencyNameAndAddress: [
      "Cascade Plateau Housing Finance Commission",
      "400 Columbia Street, Suite 900",
      "Olympia, WA 98501",
    ],
    agencyEin: "00-0008621",
    ownerNameAndAddress: [
      "Larkspur Commons Development LLC",
      "55 Monroe Street, Suite 210",
      "Spokane, WA 99201",
    ],
    ownerTin: "00-0008622",
    allocationDate: "03/15/2021",
    placedInServiceDate: "01/20/2021",
    taxExemptBondPercent: "55",
    allocationBoxes: ["a"],
    minimumSetAside: "40-60",
    agencyOfficial: "Marisol Fenwright",
    agencySignedOn: "02/10/2022",
    ownerSigner: "Dalton Rusk, Manager",
    ownerSignedOn: "03/01/2022",
  });
  const name = "01-form-8609-larkspur-commons.pdf";
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
