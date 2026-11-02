/*
 * convertToViewportPoint flips PDF space (y-up) to canvas space (y-down).
 * The min/max of both corners keeps the box right for any rect orientation.
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { renderPageAsImage } from "unpdf";

export interface OverlayWidget {
  id: number;
  /** PDF page coordinates: [x1, y1, x2, y2]. */
  rect: [number, number, number, number];
}

export interface RenderedPage {
  png: Buffer;
  width: number;
  height: number;
  scale: number;
}

interface OverlayOpts {
  /** A pdf.js PDFDocumentProxy. */
  pdf: any;
  /** 0-based; pdf.js pages are 1-based. */
  pageIndex: number;
  widgets: OverlayWidget[];
  scale?: number;
}

export async function renderPageWithOverlay(opts: OverlayOpts): Promise<RenderedPage> {
  const { canvas, width, height, scale } = await drawOverlay(opts);
  return { png: canvas.toBuffer("image/png"), width, height, scale };
}

export interface OverlayTile {
  png: Buffer;
  /** Canvas pixels from the top of the page. */
  top: number;
  bottom: number;
}

/*
 * Horizontal bands of one overlay page. A reader shrinks a full page, and the
 * badges on a dense page then become unreadable. The overlap keeps a box that
 * sits on a band edge whole in one of the two bands.
 */
export async function renderOverlayTiles(
  opts: OverlayOpts & { tileHeight?: number; overlap?: number },
): Promise<OverlayTile[]> {
  const { canvas, width, height } = await drawOverlay(opts);
  const tileHeight = opts.tileHeight ?? 640;
  const overlap = opts.overlap ?? 80;
  const tiles: OverlayTile[] = [];
  for (let top = 0; top < height; top += tileHeight - overlap) {
    const bottom = Math.min(height, top + tileHeight);
    const tile = createCanvas(width, bottom - top);
    tile.getContext("2d").drawImage(canvas, 0, top, width, bottom - top, 0, 0, width, bottom - top);
    tiles.push({ png: tile.toBuffer("image/png"), top, bottom });
    if (bottom === height) break;
  }
  return tiles;
}

async function drawOverlay(opts: OverlayOpts) {
  const scale = opts.scale ?? 2.0;
  const page = await opts.pdf.getPage(opts.pageIndex + 1);
  const viewport = page.getViewport({ scale });

  const pageImageBuf = await renderPageAsImage(opts.pdf, opts.pageIndex + 1, {
    scale,
    canvasImport: () => import("@napi-rs/canvas"),
  });

  const img = await loadImage(Buffer.from(pageImageBuf));

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  for (const widget of opts.widgets) {
    const [x1, y1, x2, y2] = widget.rect;
    const [vx1, vy1] = viewport.convertToViewportPoint(x1, y1);
    const [vx2, vy2] = viewport.convertToViewportPoint(x2, y2);
    const left = Math.min(vx1, vx2);
    const top = Math.min(vy1, vy2);
    const width = Math.abs(vx2 - vx1);
    const height = Math.abs(vy2 - vy1);

    const pad = 1;
    ctx.strokeStyle = "rgba(220, 30, 30, 0.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(left - pad, top - pad, width + pad * 2, height + pad * 2);

    /*
     * The badge sits INSIDE the rectangle. Above the widget it covered label
     * text, and vision models paired it with the wrong label.
     */
    const badge = String(widget.id);
    ctx.font = "bold 13px sans-serif";
    const metrics = ctx.measureText(badge);
    const badgeW = Math.max(18, metrics.width + 8);
    const badgeH = Math.min(16, Math.max(12, height - 2));
    const badgeX = left;
    const badgeY = top;

    ctx.fillStyle = "rgba(220, 30, 30, 0.92)";
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(badge, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  }

  return { canvas, width: viewport.width as number, height: viewport.height as number, scale };
}
