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

export async function renderPageWithOverlay(opts: {
  /** A pdf.js PDFDocumentProxy. */
  pdf: any;
  /** 0-based; pdf.js pages are 1-based. */
  pageIndex: number;
  widgets: OverlayWidget[];
  scale?: number;
}): Promise<RenderedPage> {
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

  return {
    png: canvas.toBuffer("image/png"),
    width: viewport.width,
    height: viewport.height,
    scale,
  };
}
