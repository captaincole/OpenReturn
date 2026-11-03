/* Drawing helpers for the fake input documents, copied from marcus/generate-docs.ts. */

import { rgb, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";

export const PAGE_W = 612; // US Letter, points
export const PAGE_H = 792;

export interface Ctx {
  page: PDFPage;
  reg: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

export const BLACK = rgb(0, 0, 0);
export const SHADE = rgb(0.93, 0.95, 0.97);

type TextOpts = { size?: number; bold?: boolean; italic?: boolean };

/* ty() turns a y-down coordinate (top of the em-box) into pdf-lib's bottom-up baseline. */
export function ty(yTopDown: number, fontSize = 0): number {
  return PAGE_H - yTopDown - fontSize;
}

export function fmtMoney(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const fixed = abs.toFixed(2);
  const [whole, dec] = fixed.split(".");
  return sign + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
}

export function widthOf(font: PDFFont, str: string, size: number): number {
  return font.widthOfTextAtSize(str, size);
}

const fontOf = (ctx: Ctx, opts: TextOpts): PDFFont =>
  opts.italic ? ctx.italic : opts.bold ? ctx.bold : ctx.reg;

export function drawText(
  ctx: Ctx,
  str: string,
  xPos: number,
  yTopDown: number,
  opts: TextOpts & { color?: ReturnType<typeof rgb> } = {},
) {
  const { size = 9, color = BLACK } = opts;
  ctx.page.drawText(str, { x: xPos, y: ty(yTopDown, size), size, font: fontOf(ctx, opts), color });
}

export function drawTextRight(
  ctx: Ctx,
  str: string,
  xRight: number,
  yTopDown: number,
  opts: TextOpts = {},
) {
  const { size = 9 } = opts;
  drawText(ctx, str, xRight - widthOf(fontOf(ctx, opts), str, size), yTopDown, opts);
}

export function drawTextCenter(
  ctx: Ctx,
  str: string,
  xCenter: number,
  yTopDown: number,
  opts: TextOpts = {},
) {
  const { size = 9 } = opts;
  drawText(ctx, str, xCenter - widthOf(fontOf(ctx, opts), str, size) / 2, yTopDown, opts);
}

export function wrapText(font: PDFFont, text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawWrapped(
  ctx: Ctx,
  text: string,
  xPos: number,
  yTopDown: number,
  maxWidth: number,
  opts: TextOpts & { lineGap?: number } = {},
): number {
  const { size = 7, lineGap = 2 } = opts;
  const lines = wrapText(fontOf(ctx, opts), text, maxWidth, size);
  let yPos = yTopDown;
  for (const line of lines) {
    drawText(ctx, line, xPos, yPos, { ...opts, size });
    yPos += size + lineGap;
  }
  return yPos;
}

export function drawBox(
  ctx: Ctx,
  xPos: number,
  yTopDown: number,
  width: number,
  height: number,
  opts: {
    fill?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
    borderWidth?: number;
  } = {},
) {
  const { fill, borderColor = BLACK, borderWidth = 0.5 } = opts;
  ctx.page.drawRectangle({
    x: xPos,
    y: PAGE_H - yTopDown - height,
    width: width,
    height: height,
    color: fill,
    borderColor,
    borderWidth,
  });
}

export function drawLine(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: { thickness?: number } = {},
) {
  const { thickness = 0.5 } = opts;
  ctx.page.drawLine({
    start: { x: x1, y: PAGE_H - y1 },
    end: { x: x2, y: PAGE_H - y2 },
    thickness,
    color: BLACK,
  });
}
