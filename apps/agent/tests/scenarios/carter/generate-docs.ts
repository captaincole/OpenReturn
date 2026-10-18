/*
 * Make the two carter input documents that the IRS package does not
 * include. The ATS cover page states their amounts only, because the
 * IRS e-file test needs just the 1040 line values.
 *
 *   npx tsx tests/scenarios/carter/generate-docs.ts
 *
 * Emits:
 *   docs/03-example-reit-fund-1099-div.pdf — Copy B of the official IRS
 *     fillable 1099-DIV (Rev. January 2024, downloaded from irs.gov when
 *     the script runs), filled and flattened. Box 2a only, as the cover
 *     page says. The payer is invented.
 *   docs/04-ssa-1099.pdf — drawn here: SSA does not publish a blank
 *     SSA-1099. A footer marks it as a test document.
 *
 * The recipient address is the California one (docs/RELOCATION.md).
 * The output PDFs are committed; run this again only to change them.
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const DOCS = join(dirname(fileURLToPath(import.meta.url)), "docs");
const IRS_1099_DIV_URL = "https://www.irs.gov/pub/irs-pdf/f1099div.pdf";
/* Page index of Copy B (For Recipient) in the IRS file. */
const COPY_B_PAGE = 3;

const CARTER = {
  name: "Carter Lewis",
  ssn: "400-00-1039",
  street: "807 Sahara Drive",
  cityStateZip: "Sacramento, CA 95814",
};

const REIT = {
  payer: ["Example REIT Fund", "1200 Example Way", "Las Vegas, NV 89101"],
  payerTin: "00-0000009",
  account: "REIT-1039",
  box2a: "7,500.00",
};

const SSA = {
  box3: "$1,000.00",
  box4: "NONE",
  box5: "$1,000.00",
  box6: "NONE",
  claimNumber: "400-00-1039A",
};

/* Copy B widget names, from the IRS file's AcroForm. */
const DIV_FIELDS: Record<string, string> = {
  "CopyHeader[0].CalendarYear[0].f2_1[0]": "2025",
  "LeftCol[0].f2_2[0]": REIT.payer.join("\n"),
  "LeftCol[0].f2_3[0]": REIT.payerTin,
  "LeftCol[0].f2_4[0]": CARTER.ssn,
  "LeftCol[0].f2_5[0]": CARTER.name,
  "LeftCol[0].f2_6[0]": CARTER.street,
  "LeftCol[0].f2_7[0]": CARTER.cityStateZip,
  "LeftCol[0].f2_8[0]": REIT.account,
  "RghtCol[0].Box2a_ReadOrder[0].f2_11[0]": REIT.box2a,
};

async function build1099Div(): Promise<Uint8Array> {
  const res = await fetch(IRS_1099_DIV_URL);
  if (!res.ok) throw new Error(`GET ${IRS_1099_DIV_URL}: ${res.status}`);
  const src = await PDFDocument.load(await res.arrayBuffer());
  const form = src.getForm();
  for (const [name, value] of Object.entries(DIV_FIELDS)) {
    const field = form.getTextField(`topmostSubform[0].CopyB[0].${name}`);
    if (name.endsWith("f2_2[0]")) field.enableMultiline();
    field.setText(value);
  }
  form.flatten();
  const out = await PDFDocument.create();
  const [page] = await out.copyPages(src, [COPY_B_PAGE]);
  out.addPage(page);
  return out.save();
}

/* ─── SSA-1099 (drawn) ─────────────────────────────────────────────── */

interface Ctx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
}

/* A labeled box: top-left at (x, y) in PDF points, label above value. */
function box(ctx: Ctx, x: number, y: number, w: number, h: number, label: string, value = "") {
  ctx.page.drawRectangle({
    x,
    y: y - h,
    width: w,
    height: h,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });
  ctx.page.drawText(label, { x: x + 4, y: y - 10, size: 7, font: ctx.bold });
  value.split("\n").forEach((line, i) => {
    ctx.page.drawText(line, { x: x + 8, y: y - 26 - i * 12, size: 10, font: ctx.font });
  });
}

function drawSsaHeader(ctx: Ctx, top: number) {
  const { page, bold, font } = ctx;
  page.drawText("FORM SSA-1099 - SOCIAL SECURITY BENEFIT STATEMENT", {
    x: 40,
    y: top,
    size: 12,
    font: bold,
  });
  page.drawText("2025", { x: 520, y: top, size: 16, font: bold });
  page.drawText("PART OF YOUR SOCIAL SECURITY BENEFITS SHOWN IN BOX 5 MAY BE TAXABLE INCOME.", {
    x: 40,
    y: top - 16,
    size: 8,
    font,
  });
  page.drawText("SEE THE REVERSE FOR MORE INFORMATION.", { x: 40, y: top - 26, size: 8, font });
}

function drawSsaBoxes(ctx: Ctx, top: number) {
  box(ctx, 40, top, 330, 40, "Box 1. Name", CARTER.name);
  box(ctx, 370, top, 200, 40, "Box 2. Beneficiary's Social Security Number", CARTER.ssn);
  const row2 = top - 40;
  box(ctx, 40, row2, 177, 40, "Box 3. Benefits Paid in 2025", SSA.box3);
  box(ctx, 217, row2, 177, 40, "Box 4. Benefits Repaid to SSA in 2025", SSA.box4);
  box(ctx, 394, row2, 176, 40, "Box 5. Net Benefits for 2025 (Box 3 minus Box 4)", SSA.box5);
  const row3 = row2 - 40;
  box(
    ctx,
    40,
    row3,
    265,
    70,
    "DESCRIPTION OF AMOUNT IN BOX 3",
    "Paid by check or direct deposit  $1,000.00\nBenefits for 2025  $1,000.00",
  );
  box(ctx, 305, row3, 265, 70, "DESCRIPTION OF AMOUNT IN BOX 4", "NONE");
  const row4 = row3 - 70;
  box(ctx, 40, row4, 265, 40, "Box 6. Voluntary Federal Income Tax Withheld", SSA.box6);
  box(
    ctx,
    305,
    row4,
    265,
    40,
    "Box 8. Claim Number (Use this number if you need to contact SSA.)",
    SSA.claimNumber,
  );
  box(ctx, 40, row4 - 40, 530, 52, "Box 7. Address", `${CARTER.street}\n${CARTER.cityStateZip}`);
}

async function buildSsa1099(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 396]);
  const ctx: Ctx = {
    page,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  drawSsaHeader(ctx, 360);
  drawSsaBoxes(ctx, 320);
  page.drawText("DO NOT RETURN THIS FORM TO SSA OR IRS", { x: 40, y: 40, size: 8, font: ctx.bold });
  page.drawText("Test document for the Summa carter scenario (IRS ATS 8). Not issued by SSA.", {
    x: 40,
    y: 24,
    size: 7,
    font: ctx.font,
    color: rgb(0.4, 0.4, 0.4),
  });
  return doc.save();
}

async function main() {
  const outputs: [string, Uint8Array][] = [
    ["03-example-reit-fund-1099-div.pdf", await build1099Div()],
    ["04-ssa-1099.pdf", await buildSsa1099()],
  ];
  for (const [name, bytes] of outputs) {
    await writeFile(join(DOCS, name), bytes);
    console.log(`wrote docs/${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
