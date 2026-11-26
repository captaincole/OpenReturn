import { Hono, type Context } from "hono";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "canon-law-routes-test-"));
process.env.CORPUS_DB_PATH = path.join(dir, "corpus.db");
process.env.LAW_DB_PATH = path.join(dir, "law.db");
const lawFile = process.env.LAW_DB_PATH;

// Imported after the env is set, so both libraries resolve to the temp folder.
const { writeDocument } = await import("../../../../src/db/corpusStore.js");
const { lawPayload } = await import("../../../../src/law/ingestLaw.js");
const { parseUslmTitle } = await import("../../../../src/law/parseUslm.js");
const { parsedRegulations, REG_ENTRY } = await import("../../law/regFixture.js");
const { lawSectionRoute, lawStatusRoute } =
  await import("../../../../src/mastra/server/routes/law.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Mastra types the handler as a union of route kinds; these two are plain Hono handlers.
type Handler = (ctx: Context) => Response | Promise<Response>;
const app = new Hono();
for (const route of [lawStatusRoute, lawSectionRoute])
  app.get(route.path, (ctx) => (route as unknown as { handler: Handler }).handler(ctx));

const getJson = async (url: string) => {
  const res = await app.request(url);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

const FIXTURES = path.join(__dirname, "../../law/fixtures");
const fixture = (name: string) => readFileSync(path.join(FIXTURES, name), "utf8");

const SIDECAR = {
  docId: "usc-26-2025",
  title: "Internal Revenue Code (26 U.S.C.), through Public Law 119-73",
  publisher: "OLRC",
  taxYear: 2025,
  sourceUrl: null,
  sha256: "0",
  format: "uslm" as const,
  releasePoint: "119-73",
  published: "2026-01-12",
  files: [],
};

async function installLaw(): Promise<void> {
  const sections = ["s469-g.xml", "s139H.xml"].map(fixture).join("\n");
  const parsed = parseUslmTitle(
    fixture("title.xml").replace("{{PART_I}}", sections),
    "usc-26-2025",
  );
  const entry = {
    sidecar: SIDECAR,
    sidecarPath: "law.meta.json",
    zipPath: "law.zip",
    zipRelPath: "law.zip",
  };
  await writeDocument(lawPayload(entry, parsed), "law");
  await writeDocument(lawPayload(REG_ENTRY, parsedRegulations()), "law");
}

describe("the law routes without law.db", () => {
  it("answer installed: false with both commands, and create no file", async () => {
    for (const url of ["/app/law/status", "/app/law/sections/469"]) {
      const { status, body } = await getJson(url);
      expect(status).toBe(200);
      expect(body.installed).toBe(false);
      expect(body.message).toContain("npm run corpus -- law fetch");
      expect(body.message).toContain("npm run corpus -- law sync");
    }
    expect(existsSync(lawFile)).toBe(false);
  });
});

describe("the law routes with law.db", () => {
  it("report each document, the statute first, and how many sections it holds", async () => {
    await installLaw();
    expect(await getJson("/app/law/status")).toEqual({
      status: 200,
      body: {
        installed: true,
        documents: [
          {
            docId: "usc-26-2025",
            source: "statute",
            title: SIDECAR.title,
            published: "2026-01-12",
            sections: 2,
          },
          {
            docId: "cfr-26-2025",
            source: "regulations",
            title: REG_ENTRY.sidecar.title,
            published: null,
            sections: 2,
          },
        ],
      },
    });
  });

  it("return a whole section in statute order, with the levels above it", async () => {
    const { status, body } = await getJson("/app/law/sections/469");
    expect(status).toBe(200);
    expect(body).toMatchObject({
      installed: true,
      source: "statute",
      section: {
        number: "469",
        citation: "26 U.S.C. § 469",
        heading: "Passive activity losses and credits limited",
        breadcrumbs: [
          "Subtitle A—Income Taxes",
          "CHAPTER 1—NORMAL TAXES AND SURTAXES",
          "Subchapter A—Determination of Tax Liability",
          "PART I—TAX ON INDIVIDUALS",
        ],
      },
      release: { title: SIDECAR.title, published: "2026-01-12" },
    });
    const blocks = body.blocks as { blockId: string; path: string[]; citation: string }[];
    expect(blocks.map((block) => block.blockId.split("::").at(-1))).toEqual([
      "g",
      "g-1",
      "g-2",
      "g-3",
    ]);
    expect(blocks[1]).toMatchObject({ path: ["g", "1"], citation: "26 U.S.C. § 469(g)(1)" });
    expect(Object.keys(blocks[1]).sort()).toEqual(["blockId", "citation", "path", "text"]);
  });

  it("find a section with a letter in its number, in either case", async () => {
    for (const section of ["139H", "139h"]) {
      const { status, body } = await getJson(`/app/law/sections/${section}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ section: { number: "139H", citation: "26 U.S.C. § 139H" } });
    }
  });

  it("return a regulation section, told from a Code section by its dot", async () => {
    for (const section of ["1.469-5T", "1.469-5t"]) {
      const { status, body } = await getJson(`/app/law/sections/${section}`);
      expect(status).toBe(200);
      expect(body).toMatchObject({
        source: "regulations",
        section: {
          number: "1.469-5T",
          citation: "26 CFR § 1.469-5T",
          heading: "Material participation (temporary).",
          breadcrumbs: ["PART 1—INCOME TAXES", "Test Group"],
        },
        release: { title: REG_ENTRY.sidecar.title, published: null },
      });
      const blocks = body.blocks as { blockId: string; citation: string }[];
      expect(blocks[1]).toMatchObject({
        blockId: "cfr-26-2025::sec::s1.469-5t::a-1",
        citation: "26 CFR § 1.469-5T(a)(1)",
      });
    }
  });

  it("answer 404 with a plain message for a section the library does not hold", async () => {
    for (const section of ["9999", "469(g)", "not-a-section", "1.469-99", "1.469-5T(a)"]) {
      const { status, body } = await getJson(`/app/law/sections/${encodeURIComponent(section)}`);
      expect(status).toBe(404);
      expect(body.error).toContain("The law library has no section");
    }
  });
});
