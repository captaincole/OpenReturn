import { ENGINE_ROOT } from "@summa/engine/paths";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PdfAttachmentRasterizer } from "../../../../src/mastra/agents/pdfAttachments";

const W2 = resolve(ENGINE_ROOT, "tests/scenarios/alex/docs/01-alex-w2.pdf");

/* A URL-based model gets the PDF as page images only. */
describe("PdfAttachmentRasterizer", () => {
  beforeAll(() => {
    process.env.LUCA_MODEL = "ollama/test-model";
    process.env.LUCA_MODEL_URL = "http://localhost:11434/v1";
  });

  it("replaces a PDF part with its page images", async () => {
    const data = readFileSync(W2).toString("base64");
    const message = {
      id: "m1",
      role: "user",
      createdAt: new Date(),
      content: { format: 2, parts: [{ type: "file", mimeType: "application/pdf", data }] },
    };
    const args = { messages: [message] } as unknown as Parameters<
      PdfAttachmentRasterizer["processInput"]
    >[0];
    const [out] = (await new PdfAttachmentRasterizer().processInput(args)) as Array<{
      content: { parts: Array<{ type: string; text?: string; mimeType?: string }> };
    }>;

    const parts = out.content.parts;
    expect(parts.filter((p) => p.mimeType === "image/png")).toHaveLength(1);
    expect(parts.some((p) => p.mimeType === "application/pdf")).toBe(false);
  });
});
