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
const { CA_ENTRY, parsedCalifornia } = await import("../../law/caFixture.js");
const { lawSectionRoute, lawStatusRoute, lawTocNodeRoute, lawTocRoute } =
  await import("../../../../src/mastra/server/routes/law.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Mastra types the handler as a union of route kinds; these two are plain Hono handlers.
type Handler = (ctx: Context) => Response | Promise<Response>;
const app = new Hono();
for (const route of [lawStatusRoute, lawSectionRoute, lawTocRoute, lawTocNodeRoute])
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
  await writeDocument(lawPayload(CA_ENTRY, parsedCalifornia()), "law");
}

describe("the law routes without law.db", () => {
  it("answer installed: false with both commands, and create no file", async () => {
    for (const url of [
      "/app/law/status",
      "/app/law/sections/469",
      "/app/law/toc/statute",
      "/app/law/toc/statute/sta",
    ]) {
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
          {
            docId: "ca-rtc-2025",
            source: "california",
            title: CA_ENTRY.sidecar.title,
            published: "2026-11-22",
            sections: 7,
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
          { node: "sta", heading: "Subtitle A—Income Taxes" },
          { node: "sta-ch1", heading: "CHAPTER 1—NORMAL TAXES AND SURTAXES" },
          { node: "sta-ch1-scha", heading: "Subchapter A—Determination of Tax Liability" },
          { node: "sta-ch1-scha-pti", heading: "PART I—TAX ON INDIVIDUALS" },
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
          breadcrumbs: [
            { node: "pt1", heading: "PART 1—INCOME TAXES" },
            { node: expect.stringMatching(/^pt1-sg/), heading: "Test Group" },
          ],
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

  it("return a California section by its page name, and every version of a number", async () => {
    const { status, body } = await getJson("/app/law/sections/CA-17014");
    expect(status).toBe(200);
    expect(body).toMatchObject({
      source: "california",
      section: {
        number: "17014",
        citation: "Cal. Rev. & Tax. Code § 17014",
        breadcrumbs: [
          { node: "div2", heading: "DIVISION 2. OTHER TAXES" },
          { node: "div2-pt10", heading: "PART 10. PERSONAL INCOME TAX" },
          { node: "div2-pt10-ch1", heading: "CHAPTER 1. General Provisions and Definitions" },
        ],
      },
      versions: [],
    });
    const versions = await getJson(`/app/law/sections/${encodeURIComponent("CA-17552.3")}`);
    expect(versions.body.versions).toEqual([
      expect.objectContaining({ version: 1, firstBlockId: "ca-rtc-2025::sec::s17552.3::a" }),
      expect.objectContaining({ version: 2, firstBlockId: "ca-rtc-2025::sec::s17552.3-v2::a" }),
    ]);
    expect((await getJson("/app/law/sections/17552.3")).status).toBe(404);
  });

  it("answer 404 with a plain message for a section the library does not hold", async () => {
    for (const section of ["9999", "469(g)", "not-a-section", "1.469-99", "1.469-5T(a)"]) {
      const { status, body } = await getJson(`/app/law/sections/${encodeURIComponent(section)}`);
      expect(status).toBe(404);
      expect(body.error).toContain("The law library has no section");
    }
  });
});

describe("the law contents route", () => {
  it("returns the top level of the statute, with no node and no levels above", async () => {
    const { status, body } = await getJson("/app/law/toc/statute");
    expect(status).toBe(200);
    expect(body).toEqual({
      installed: true,
      source: "statute",
      docId: "usc-26-2025",
      release: { title: SIDECAR.title, published: "2026-01-12" },
      node: null,
      ancestors: [],
      children: [{ kind: "group", node: "sta", heading: "Subtitle A—Income Taxes" }],
    });
  });

  it("returns one level: its heading, the levels above it, and its sections in order", async () => {
    const { status, body } = await getJson("/app/law/toc/statute/sta-ch1-scha-pti");
    expect(status).toBe(200);
    expect(body).toMatchObject({
      node: { node: "sta-ch1-scha-pti", heading: "PART I—TAX ON INDIVIDUALS" },
      ancestors: [
        { node: "sta", heading: "Subtitle A—Income Taxes" },
        { node: "sta-ch1", heading: "CHAPTER 1—NORMAL TAXES AND SURTAXES" },
        { node: "sta-ch1-scha", heading: "Subchapter A—Determination of Tax Liability" },
      ],
      children: [
        {
          kind: "section",
          number: "469",
          citation: "26 U.S.C. § 469",
          heading: "Passive activity losses and credits limited",
        },
        { kind: "section", number: "139H", citation: "26 U.S.C. § 139H" },
      ],
    });
  });

  it("walks the regulations from a part to a subject group to its sections", async () => {
    const top = await getJson("/app/law/toc/regulations");
    expect(top.body).toMatchObject({
      source: "regulations",
      docId: "cfr-26-2025",
      node: null,
      children: [{ kind: "group", node: "pt1", heading: "PART 1—INCOME TAXES" }],
    });
    const part = await getJson("/app/law/toc/regulations/pt1");
    const children = part.body.children as { kind: string; node: string; heading: string }[];
    const group = children.find((child) => child.heading === "Test Group");
    expect(group).toMatchObject({ kind: "group", node: expect.stringMatching(/^pt1-sg/) });
    const { status, body } = await getJson(`/app/law/toc/regulations/${group?.node}`);
    expect(status).toBe(200);
    expect(body).toMatchObject({
      node: { node: group?.node, heading: "Test Group" },
      ancestors: [{ node: "pt1", heading: "PART 1—INCOME TAXES" }],
      children: [
        {
          kind: "section",
          number: "1.469-5T",
          citation: "26 CFR § 1.469-5T",
          heading: "Material participation (temporary).",
        },
        { kind: "section", number: "1.408A-4", citation: "26 CFR § 1.408A-4" },
      ],
    });
  });

  it("walks California's code from its division to an article, each version a row", async () => {
    const top = await getJson("/app/law/toc/california");
    expect(top.body).toMatchObject({
      source: "california",
      docId: "ca-rtc-2025",
      children: [{ kind: "group", node: "div2", heading: "DIVISION 2. OTHER TAXES" }],
    });
    const chapter = await getJson("/app/law/toc/california/div2-pt10-ch6");
    expect(chapter.body.children).toEqual([
      expect.objectContaining({ kind: "section", number: "17552.3", version: 1 }),
      expect.objectContaining({ kind: "section", number: "17552.3", version: 2 }),
    ]);
  });

  it("answers 404 for an unknown library, an unknown node, or a section", async () => {
    for (const url of [
      "/app/law/toc/cases",
      "/app/law/toc/statute/stz",
      "/app/law/toc/statute/s469",
      "/app/law/toc/regulations/sta",
    ]) {
      const { status, body } = await getJson(url);
      expect(status).toBe(404);
      expect(body.error).toContain("The law library has no");
    }
  });
});
