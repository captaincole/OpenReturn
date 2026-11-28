/* Renders Lamgwin's Forms 8874-A and Schedule K-1 (Form 1065) into docs/: npx tsx tests/scenarios/synthetic/lamgwin/generate-docs.ts */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form8874APdf } from "../../documents/form8874A.js";
import { scheduleK1Form1065Pdf } from "../../documents/scheduleK1Form1065.js";
import {
  INVESTMENTS,
  LAMGWIN,
  LAMGWIN_TAX_YEAR,
  investmentDocName,
  investmentValue,
  tallowK1,
} from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* Each CDE's signing official and the date, within 60 days of the investment (Form 8874-A, When To File). */
const SIGNERS: Record<string, [string, string]> = {
  riverbend: ["Delphine Arroyo", "04/02/2025"],
  "prairie-gate": ["Marcus Whitlow", "07/21/2024"],
  "lantern-street": ["Ines Calloway", "09/26/2023"],
  copperline: ["Rowan Pettibone", "12/09/2022"],
  "blue-mesa": ["Hollis Varga", "03/01/2021"],
  "old-mill": ["Corinne Ashby", "08/15/2019"],
  "harbor-light": ["Teodor Quint", "05/30/2018"],
};

async function scheduleK1() {
  return scheduleK1Form1065Pdf(
    tallowK1,
    {
      partnership: { street: "12 Tallow Row", cityStateZip: "Houston, TX 77003" },
      irsCenter: "Ogden, UT",
      partner: {
        name: `${LAMGWIN.firstName} ${LAMGWIN.lastName}`,
        tin: "XXX-XX-8874",
        street: LAMGWIN.street,
        cityStateZip: `${LAMGWIN.city}, ${LAMGWIN.state} ${LAMGWIN.zip}`,
        entityType: "Individual",
      },
    },
    LAMGWIN_TAX_YEAR,
  );
}

async function main() {
  await mkdir(docsDir, { recursive: true });
  const documents: Array<[string, Uint8Array]> = [];
  for (const [index, made] of INVESTMENTS.entries()) {
    const [official, signedOn] = SIGNERS[made.slug];
    const pdf = await form8874APdf(investmentValue(made).notice, { official, signedOn });
    documents.push([investmentDocName(index, made), pdf]);
  }
  documents.push(["08-schedule-k1-tallow-row-partners.pdf", await scheduleK1()]);
  for (const [name, pdf] of documents) {
    await writeFile(join(docsDir, name), pdf);
    console.log(`✓ ${name} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
