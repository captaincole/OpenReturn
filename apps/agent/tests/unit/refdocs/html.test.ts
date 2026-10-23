/*
 * FTB HTML documents: the cleaner (what we store and show) and the
 * parser (the corpus rows). A synthetic page in FTB's template; each test
 * pins one rule. Real pages are checked against their PDFs by hand.
 */

import { describe, expect, it } from "vitest";
import { CleanError, cleanFtbHtml } from "../../../src/refdocs/html/cleanFtb.js";
import { parseHtmlDoc } from "../../../src/refdocs/html/parseHtml.js";

const PAGE_URL = "https://www.ftb.ca.gov/forms/2025/2025-540-instructions.html";
const FILLER = `<p>${"Enter the amount from your federal return on this line. ".repeat(40)}</p>`;

const page = (body: string) => `<html><head><script>track()</script></head><body>
<nav class="main-navigation">Home Forms Pay</nav>
<main><h1 class="m-t-0"><small class="d-block">2025 Instructions for Form 540</small> California Resident Income Tax Return</h1>
<!-- InstanceBeginEditable name="Main content" -->${body}<!-- InstanceEndEditable -->
</main><footer>Back to top</footer></body></html>`;

const BODY = `<p class="lead" style="color:red">Intro text.</p>
<h2 id="Filing-Status">Filing Status</h2>
<p>See <a href="#Filing-Status">Filing Status</a>, <a href="#Important-Dates">Important Dates</a>,
<a href="/forms/2025/2025-540.pdf">Form 540</a> and <a href="javascript:alert(1)">this</a>.</p>
<div class="table-responsive"><table class="table">
<thead><tr><th>Your Filing Status</th><th>Enter On Line 18</th></tr></thead>
<tbody><tr><td>1 – Single</td><td>$5,706</td></tr><tr><td>2 – Married</td><td>$11,412</td></tr></tbody>
</table></div>
<h3>Line 7 – Personal Exemptions</h3>
<dl><dt class="mail">No</dt><dd>Follow the instructions.</dd><dt>Yes</dt><dd>Enter -0-.</dd></dl>
<h3>AGI Limitation Worksheet</h3>
<ol type="a"><li>Enter line 13.</li><li>Subtract line b from line a.</li></ol>
<img class="img-responsive" src="/images/forms/check.png" alt="Sample check">
<img src="https://tracker.example.com/pixel.gif" alt="pixel">
${FILLER}`;

const fakeImage = async (url: string) =>
  `data:image/png;base64,${Buffer.from(url).toString("base64")}`;
const clean = (body = BODY) => cleanFtbHtml(page(body), PAGE_URL, fakeImage);

describe("cleanFtbHtml", () => {
  it("keeps only the article, without scripts, menus, classes or styles", async () => {
    const { html, title } = await clean();
    expect(title).toBe("2025 Instructions for Form 540 — California Resident Income Tax Return");
    expect(html).toMatch(/^<article>\n<h1><small>2025 Instructions/);
    for (const gone of [
      "track()",
      "Home Forms Pay",
      "Back to top",
      "class=",
      "style=",
      "<div",
      "<!--",
    ]) {
      expect(html).not.toContain(gone);
    }
  });

  it("gives headings their slug as id, and links to an old id follow it", async () => {
    const { html } = await clean();
    expect(html).toContain('<h2 id="filing-status">');
    expect(html).toContain('<h3 id="agi-limitation-worksheet">');
    expect(html).toContain('<a href="#filing-status">');
  });

  it("makes links absolute and drops dangling and unsafe ones", async () => {
    const { html } = await clean();
    expect(html).toContain('<a href="https://www.ftb.ca.gov/forms/2025/2025-540.pdf">Form 540</a>');
    expect(html).toContain("Important Dates,");
    expect(html).not.toContain("#Important-Dates");
    expect(html).not.toContain("javascript:");
  });

  it("inlines publisher images and drops third-party ones", async () => {
    const { html } = await clean();
    expect(html).toContain('<img src="data:image/png;base64,');
    expect(html).not.toContain("tracker.example.com");
    expect(html).not.toContain('alt="pixel"');
  });

  it("escapes the page title instead of passing it through as markup", async () => {
    const raw = page(BODY).replace(
      "California Resident Income Tax Return",
      "Return &lt;img src=x onerror=alert(1)&gt;",
    );
    const { html } = await cleanFtbHtml(raw, PAGE_URL, fakeImage);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("Return &lt;img src=x onerror=alert(1)&gt;</h1>");
  });

  it("reads the h1's Revised date, but not one inside a comment", async () => {
    expect((await clean()).published).toBeNull();
    const commented = page(BODY).replace("</h1>", " <!-- Revised: 06/2023 --></h1>");
    expect((await cleanFtbHtml(commented, PAGE_URL, fakeImage)).published).toBeNull();
    const revised = page(BODY).replace(
      "</h1>",
      ' <small class="d-block">Revised: 01/2015</small></h1>',
    );
    const doc = await cleanFtbHtml(revised, PAGE_URL, fakeImage);
    expect(doc.published).toBe("2015-01");
    expect(doc.title).toBe(
      "2025 Instructions for Form 540 — California Resident Income Tax Return",
    );
  });

  it("is deterministic", async () => {
    expect((await clean()).html).toBe((await clean()).html);
  });

  it("fails loudly when the template or the content is not there", async () => {
    await expect(
      cleanFtbHtml("<html><main><h1>X</h1></main></html>", PAGE_URL, fakeImage),
    ).rejects.toThrow(CleanError);
    await expect(clean("<h2>Only a heading</h2><p>Short.</p>")).rejects.toThrow(/words/);
  });
});

describe("parseHtmlDoc", () => {
  const parse = async () => parseHtmlDoc((await clean()).html, "doc");

  it("makes sections from h2–h4, nested by level, with the heading id as slug", async () => {
    const { sections } = await parse();
    expect(sections.map((s) => [s.headingSlug, s.parentSectionId])).toEqual([
      ["preamble", null],
      ["filing-status", null],
      ["line-7-personal-exemptions", "doc::sec::filing-status"],
      ["agi-limitation-worksheet", "doc::sec::filing-status"],
    ]);
  });

  it("writes table rows with their column headers, in their own block", async () => {
    const { blocks } = await parse();
    const table = blocks.find((b) => b.blockType === "table")!;
    expect(table.blockId).toBe("doc::sec::filing-status::b02");
    expect(table.text).toBe(
      "1 – Single | Enter On Line 18: $5,706\n\n2 – Married | Enter On Line 18: $11,412",
    );
  });

  it("lines values up with their headers when a header cell spans two rows", async () => {
    const table = `<h2>Worksheet</h2><table><thead>
<tr><th rowspan="2"></th><th colspan="2">Payment Due Dates</th></tr>
<tr><th>(a) 4/15/25</th><th>(b) 6/15/25</th></tr></thead>
<tbody><tr><td>3. Enter line 9</td><td>N/A</td><td></td></tr></tbody></table>${FILLER}`;
    const { blocks } = parseHtmlDoc((await clean(table)).html, "doc");
    expect(blocks.find((b) => b.blockType === "table")!.text).toBe(
      "3. Enter line 9 | (a) 4/15/25: N/A",
    );
  });

  it("keeps worksheet line letters and yes/no labels", async () => {
    const { blocks } = await parse();
    const text = blocks.map((b) => b.text).join("\n\n");
    expect(text).toContain("a. Enter line 13.\n\nb. Subtract line b from line a.");
    expect(text).toContain("No: Follow the instructions.\n\nYes: Enter -0-.");
    expect(text).toContain("[Image: Sample check]");
  });

  it("keeps a list with its lead-in sentence in one block", async () => {
    const item = (n: number) =>
      `<li>Item ${n}: ${"a purchase you may not report here. ".repeat(4)}</li>`;
    const body = `<h2>Use Tax</h2><p>${"Report purchases from out-of-state sellers. ".repeat(20)}</p>
<p>Note: You cannot report the following types of purchases.</p><ul>${[1, 2, 3].map(item).join("")}</ul>${FILLER}`;
    const { blocks } = parseHtmlDoc((await clean(body)).html, "doc");
    const note = blocks.find((b) => b.text.includes("Note: You cannot report"))!;
    expect(note.text.startsWith("Note:")).toBe(true);
    expect(note.text).toContain("• Item 3:");
  });

  it("block text is a slice of the canonical text, on page 1", async () => {
    const { blocks, canonicalText } = await parse();
    for (const b of blocks) {
      expect(canonicalText.slice(b.charStart, b.charEnd)).toBe(b.text);
      expect(b.pageNum).toBe(1);
    }
  });
});
