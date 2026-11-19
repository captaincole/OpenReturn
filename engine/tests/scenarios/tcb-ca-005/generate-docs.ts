/*
 * Renders Madison's SSA-1099 into docs/, and puts the spouse's own SSN on his
 * copied documents: npx tsx tests/scenarios/tcb-ca-005/generate-docs.ts
 */

import { PDFArray, PDFDocument, PDFRawStream, PDFRef, decodePDFRawStream } from "@cantoo/pdf-lib";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ssa1099Pdf } from "../documents/ssa1099.js";
import { BENCHMARK_SSN, HOUSEHOLD, TCB_CA_005_TAX_YEAR, ssa } from "./facts.js";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "docs");

/* The benchmark's documents of the spouse print the taxpayer's SSN. */
const SPOUSE_DOCS = ["02-temp-agency-w2.pdf", "05-etrade-1099-b.pdf", "06-adp-services-1099-r.pdf"];

/* A page's text holds each hyphen as the octal escape \055. */
const asPageText = (ssn: string) => ssn.replaceAll("-", "\\055");

/* Replaces the SSN in the page's text. False when the page does not hold it. */
function replaceSsnOnPage(doc: PDFDocument, from: string, to: string): boolean {
  const contents = doc.getPage(0).node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [];
  return refs
    .map((ref) => {
      const stream = doc.context.lookup(ref);
      if (!(ref instanceof PDFRef) || !(stream instanceof PDFRawStream)) return false;
      const text = Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
      if (!text.includes(asPageText(from))) return false;
      const changed = text.replaceAll(asPageText(from), asPageText(to));
      doc.context.assign(ref, doc.context.flateStream(Buffer.from(changed, "latin1")));
      return true;
    })
    .some(Boolean);
}

async function giveSpouseOwnSsn() {
  for (const name of SPOUSE_DOCS) {
    const path = join(docsDir, name);
    const doc = await PDFDocument.load(await readFile(path));
    const replaced = replaceSsnOnPage(doc, BENCHMARK_SSN, HOUSEHOLD.spouse.ssn);
    if (replaced) await writeFile(path, await doc.save());
    console.log(
      `${replaced ? "✓" : "–"} ${name} (${replaced ? "SSN replaced" : "no benchmark SSN"})`,
    );
  }
}

async function main() {
  await giveSpouseOwnSsn();
  const beneficiary = {
    name: `${HOUSEHOLD.taxpayer.firstName} ${HOUSEHOLD.taxpayer.lastName}`,
    ssn: HOUSEHOLD.taxpayer.ssn,
    street: HOUSEHOLD.street,
    cityStateZip: `${HOUSEHOLD.city}, ${HOUSEHOLD.state} ${HOUSEHOLD.zip}`,
  };
  const pdf = await ssa1099Pdf(ssa, beneficiary, TCB_CA_005_TAX_YEAR);
  await writeFile(join(docsDir, "08-ssa-1099.pdf"), pdf);
  console.log(`✓ 08-ssa-1099.pdf (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
