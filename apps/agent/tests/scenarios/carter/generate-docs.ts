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
  box3Description: "Paid by check or direct deposit   $1,000.00\n\nBenefits for 2025   $1,000.00",
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

/*
 * Layout follows SSA's published sample: a centered title, the year in
 * the header box, boxes 1–5 in two rows (box 5 shaded), then a tall
 * box 3 description on the left and box 4 description and boxes 6–8
 * stacked on the right. Coordinates are PDF points from the bottom left.
 */
const SSA_PAGE = { w: 612, h: 470 };
const LEFT = 36;
const RIGHT = 576;
const MID = 306;

interface Ctx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
}

interface BoxOpts {
  value?: string;
  shaded?: boolean;
  /* Bold, centered label (the two DESCRIPTION boxes). */
  heading?: boolean;
}

/* A labeled box from x0 to x1, top edge at `top`, `h` points tall. */
function box(
  ctx: Ctx,
  x0: number,
  x1: number,
  top: number,
  h: number,
  label: string,
  o: BoxOpts = {},
) {
  const { page, font, bold } = ctx;
  page.drawRectangle({
    x: x0,
    y: top - h,
    width: x1 - x0,
    height: h,
    borderWidth: o.shaded ? 1.6 : 0.8,
    borderColor: rgb(0, 0, 0),
    color: o.shaded ? rgb(0.88, 0.88, 0.88) : undefined,
  });
  const size = 7.5;
  const labelFont = o.heading ? bold : font;
  const lx = o.heading ? (x0 + x1 - labelFont.widthOfTextAtSize(label, size)) / 2 : x0 + 4;
  page.drawText(label, { x: lx, y: top - 11, size, font: labelFont });
  (o.value ?? "").split("\n").forEach((line, i) => {
    page.drawText(line, { x: x0 + 8, y: top - 28 - i * 14, size: 10, font });
  });
}

function drawSsaHeader(ctx: Ctx) {
  const { page, font, bold } = ctx;
  const title = "FORM SSA-1099 – SOCIAL SECURITY BENEFIT STATEMENT";
  const tw = bold.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: (SSA_PAGE.w - tw) / 2, y: 440, size: 14, font: bold });
  page.drawRectangle({
    x: LEFT,
    y: 385,
    width: RIGHT - LEFT,
    height: 40,
    borderWidth: 0.8,
    borderColor: rgb(0, 0, 0),
  });
  page.drawText("2025", { x: LEFT + 6, y: 394, size: 28, font: bold });
  page.drawText("• PART OF YOUR SOCIAL SECURITY BENEFITS SHOWN IN BOX 5 MAY BE TAXABLE INCOME.", {
    x: 120,
    y: 410,
    size: 9,
    font,
  });
  page.drawText("• SEE THE REVERSE FOR MORE INFORMATION.", { x: 120, y: 398, size: 9, font });
}

function drawSsaBoxes(ctx: Ctx) {
  box(ctx, LEFT, 396, 385, 36, "Box 1. Name", { value: CARTER.name });
  box(ctx, 396, RIGHT, 385, 36, "Box 2. Beneficiary's Social Security Number", {
    value: CARTER.ssn,
  });
  box(ctx, LEFT, 216, 349, 36, "Box 3. Benefits Paid in 2025", { value: SSA.box3 });
  box(ctx, 216, 396, 349, 36, "Box 4. Benefits Repaid to SSA in 2025", { value: SSA.box4 });
  box(ctx, 396, RIGHT, 349, 36, "Box 5. Net Benefits for 2025 (Box 3 minus Box 4)", {
    value: SSA.box5,
    shaded: true,
  });
  box(ctx, LEFT, MID, 313, 253, "DESCRIPTION OF AMOUNT IN BOX 3", {
    value: SSA.box3Description,
    heading: true,
  });
  box(ctx, MID, RIGHT, 313, 93, "DESCRIPTION OF AMOUNT IN BOX 4", {
    value: SSA.box4,
    heading: true,
  });
  box(ctx, MID, RIGHT, 220, 40, "Box 6. Voluntary Federal Income Tax Withheld", {
    value: SSA.box6,
  });
  box(ctx, MID, RIGHT, 180, 70, "Box 7. Address", {
    value: `${CARTER.name}\n${CARTER.street}\n${CARTER.cityStateZip}`,
  });
  box(
    ctx,
    MID,
    RIGHT,
    110,
    50,
    "Box 8. Claim Number (Use this number if you need to contact SSA.)",
    { value: SSA.claimNumber },
  );
}

async function buildSsa1099(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([SSA_PAGE.w, SSA_PAGE.h]);
  const ctx: Ctx = {
    page,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  drawSsaHeader(ctx);
  drawSsaBoxes(ctx);
  page.drawText("DO NOT RETURN THIS FORM TO SSA OR IRS", {
    x: LEFT,
    y: 44,
    size: 8,
    font: ctx.bold,
  });
  page.drawText("Test document for the Summa carter scenario (IRS ATS 8). Not issued by SSA.", {
    x: LEFT,
    y: 30,
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
