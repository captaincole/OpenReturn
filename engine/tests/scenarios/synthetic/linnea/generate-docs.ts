/* Renders the Mortgage Credit Certificate into docs/: npx tsx tests/scenarios/synthetic/linnea/generate-docs.ts */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mortgageCreditCertificatePdf,
  type CertificateParties,
} from "../../documents/mortgageCreditCertificate.js";
import { LINNEA, LINNEA_CERTIFICATE } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* The issuer's address, the lender and the officer are made up; the lender is the one on her Form 1098. */
const PARTIES: CertificateParties = {
  issuerStreet: "2150 Causeway Plaza, Suite 300",
  issuerCityStateZip: "Tampa, FL 33607",
  holderName: `${LINNEA.firstName} ${LINNEA.lastName}`,
  holderTin: LINNEA.ssn,
  holderStreet: LINNEA.street,
  holderCityStateZip: `${LINNEA.city}, ${LINNEA.state} ${LINNEA.zip}`,
  lenderName: "Pelican State Mortgage",
  officerName: "Rosalind Okafor-Haines",
  officerTitle: "Director of Homeownership Programs",
};

async function main() {
  const name = "01-mortgage-credit-certificate.pdf";
  const pdf = await mortgageCreditCertificatePdf(LINNEA_CERTIFICATE, PARTIES);
  await writeFile(join(docsDir, name), pdf);
  console.log(`✓ ${name} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
