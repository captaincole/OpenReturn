import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { MAX_BLOCK_CHARS, splitRange } from "../chunk";
import type { ParsedDoc } from "../parse";

/*
 * A cleaned HTML document (html/cleanFtb.ts) → the same rows the PDF
 * parser produces, so contextualize, embed and search need no changes.
 *
 * The canonical text is the document's readable text: one unit per
 * heading, paragraph, list item, definition pair or table row, joined by
 * blank lines. Sections are the h2–h4 headings (id = the heading's anchor,
 * which the cleaner set to its slug); parentSectionId follows the heading
 * levels. Blocks pack whole units of one section up to MAX_BLOCK_CHARS;
 * a table never shares a block with prose. Units that only make sense
 * together are packed as one: a list's items, and the paragraph before a
 * list with the list ("Note: You cannot report the following…" + its
 * items), so a block never holds a list without the sentence that says
 * what it is. A table
 * row carries its column headers ("(a) 1/1/25–3/31/25: 4"), so a row is
 * readable on its own. HTML has no pages: everything is page 1.
 */

type UnitKind = "heading" | "text" | "row";
interface Unit {
  kind: UnitKind;
  text: string;
  /** Headings only. */
  level?: number;
  anchor?: string;
  /** The list or definition list the unit belongs to; its units pack together. */
  group?: Element;
}

export interface ParsedHtml extends ParsedDoc {
  canonicalText: string;
}

const SECTION_LEVELS = new Set(["h2", "h3", "h4"]);
const SEP = "\n\n";

export function parseHtmlDoc(html: string, docId: string): ParsedHtml {
  const $ = cheerio.load(html);
  const units = collectUnits($, $("article").first().contents().toArray());
  const { canonicalText, spans } = layout(units);
  return { canonicalText, ...buildRows(docId, canonicalText, units, spans) };
}

/* ---------- units ---------- */

function collectUnits($: cheerio.CheerioAPI, nodes: AnyNode[]): Unit[] {
  return nodes.flatMap((node): Unit[] => {
    if (node.type === "text") return textUnit(squash((node as unknown as { data: string }).data));
    if (node.type !== "tag") return [];
    const el = node as Element;
    const tag = el.tagName;
    if (tag === "h1") return [];
    if (SECTION_LEVELS.has(tag)) {
      return [
        {
          kind: "heading",
          text: squash($(el).text()),
          level: Number(tag[1]),
          anchor: el.attribs.id,
        },
      ];
    }
    if (tag === "ul" || tag === "ol") return listUnits($, el);
    if (tag === "dl") return definitionUnits($, el);
    if (tag === "table") return tableUnits($, el);
    if (tag === "img") return textUnit(imageText(el));
    if (["p", "h5", "h6", "blockquote", "figcaption"].includes(tag)) return textUnit(textOf($, el));
    return collectUnits($, el.children); // figure, or a stray inline element
  });
}

const textUnit = (text: string): Unit[] => (text ? [{ kind: "text", text }] : []);

const imageText = (el: Element) => (el.attribs.alt ? `[Image: ${squash(el.attribs.alt)}]` : "");

/* Ordered lists keep their line labels ("a. Enter…"): worksheets cite them. */
function listUnits($: cheerio.CheerioAPI, list: Element): Unit[] {
  const type = list.tagName === "ol" ? (list.attribs.type ?? "1") : "•";
  const start = Number(list.attribs.start ?? 1);
  return $(list)
    .children("li")
    .toArray()
    .flatMap((li, i) => textUnit(prefixed(listMarker(type, start + i), textOf($, li))))
    .map((u) => ({ ...u, group: list }));
}

function listMarker(type: string, n: number): string {
  if (type === "•") return "•";
  if (type === "a") return `${String.fromCharCode(96 + n)}.`;
  if (type === "A") return `${String.fromCharCode(64 + n)}.`;
  return `${n}.`;
}

const prefixed = (marker: string, text: string) => (text ? `${marker} ${text}` : "");

/* "Yes: Complete the AGI Limitation Worksheet…" — one unit per term. */
function definitionUnits($: cheerio.CheerioAPI, dl: Element): Unit[] {
  const groups: { term: string; details: string[] }[] = [];
  $(dl)
    .children("dt, dd")
    .each((_, el) => {
      const text = textOf($, el);
      if (el.tagName === "dt") groups.push({ term: text, details: [] });
      else if (groups.length === 0) groups.push({ term: "", details: [text] });
      else groups[groups.length - 1].details.push(text);
    });
  return groups
    .flatMap((g) => textUnit([g.term && `${g.term}:`, ...g.details].filter(Boolean).join(" ")))
    .map((u) => ({ ...u, group: dl }));
}

/* One unit per body row: the row label, then "header: value" for each filled cell. */
function tableUnits($: cheerio.CheerioAPI, table: Element): Unit[] {
  const rows = $(table).find("tr").toArray();
  const grid = tableGrid($, rows);
  const headRows = rows.filter((tr) => $(tr).closest("thead").length > 0);
  const firstAllTh = rows[0] && $(rows[0]).children("td").length === 0 ? rows[0] : undefined;
  const headerRow = headRows.at(-1) ?? firstAllTh;
  const headers = headerRow ? grid[rows.indexOf(headerRow)] : [];
  const caption = squash($(table).children("caption").text());
  const body = rows.flatMap((tr, i) =>
    headRows.includes(tr) || tr === headerRow ? [] : rowUnit(grid[i], headers),
  );
  return [...textUnit(caption), ...body];
}

function rowUnit(cells: string[], headers: string[]): Unit[] {
  const [label, ...rest] = cells;
  const values = rest
    .map((cell, i) => (cell && headers[i + 1] ? `${headers[i + 1]}: ${cell}` : cell))
    .filter(Boolean);
  const text = [label, ...values].filter(Boolean).join(" | ");
  return text ? [{ kind: "row", text }] : [];
}

/*
 * The table as a grid of one-line cell texts, one array per row, so a
 * value lines up with its header. A colspan cell fills its extra columns
 * with ""; a rowspan cell repeats into the rows below (a corner cell over
 * a two-row header, a label shared by two rows).
 */
function tableGrid($: cheerio.CheerioAPI, rows: Element[]): string[][] {
  const carried = new Map<number, { text: string; rows: number }>();
  return rows.map((tr) => {
    const out: string[] = [];
    const takeCarried = () => {
      for (let c = carried.get(out.length); c; c = carried.get(out.length)) {
        out.push(c.text);
        if (--c.rows === 0) carried.delete(out.length - 1);
      }
    };
    for (const cell of $(tr).children("th, td").toArray()) {
      takeCarried();
      const text = squash(textOf($, cell));
      const span = Math.max(1, Number(cell.attribs.colspan ?? 1));
      const down = Math.max(1, Number(cell.attribs.rowspan ?? 1));
      if (down > 1) carried.set(out.length, { text, rows: down - 1 });
      out.push(text, ...Array<string>(span - 1).fill(""));
    }
    takeCarried();
    return out;
  });
}

/* Element text with <br> and nested blocks as line breaks, spaces collapsed. */
function textOf($: cheerio.CheerioAPI, el: Element): string {
  const clone = $(el).clone();
  clone.find("br").replaceWith("\n");
  clone.find("p, li, dt, dd, div").each((_, child) => void $(child).prepend("\n"));
  clone.find("img").each((_, img) => void $(img).replaceWith(imageText(img as Element)));
  return clone.text().split("\n").map(squash).filter(Boolean).join("\n");
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

/* ---------- text + rows ---------- */

function layout(units: Unit[]): { canonicalText: string; spans: [number, number][] } {
  const spans: [number, number][] = [];
  let cursor = 0;
  for (const u of units) {
    spans.push([cursor, cursor + u.text.length]);
    cursor += u.text.length + SEP.length;
  }
  return { canonicalText: units.map((u) => u.text).join(SEP), spans };
}

/* A heading, or a run of content units packed as one (see `glued`). */
type Packet =
  | { kind: "heading"; unit: Unit; index: number; start: number }
  | { kind: "content"; table: boolean; start: number; end: number };

/*
 * Must `next` share a block with `prev`? Yes for two units of one list,
 * and for a paragraph followed by a list (or anything after a line ending
 * in ":"): that paragraph is the list's lead-in.
 */
function glued(prev: Unit, next: Unit): boolean {
  if (prev.kind === "heading" || next.kind === "heading" || prev.kind !== next.kind) return false;
  if (prev.group !== undefined) return prev.group === next.group;
  return next.group !== undefined || /:$/.test(prev.text);
}

function packets(units: Unit[], spans: [number, number][]): Packet[] {
  const out: Packet[] = [];
  units.forEach((u, i) => {
    const [start, end] = spans[i];
    const last = out[out.length - 1];
    if (u.kind === "heading") out.push({ kind: "heading", unit: u, index: i, start });
    else if (last?.kind === "content" && glued(units[i - 1], u)) last.end = end;
    else out.push({ kind: "content", table: u.kind === "row", start, end });
  });
  return out;
}

interface OpenSection {
  row: ParsedDoc["sections"][number];
  level: number;
}

function buildRows(
  docId: string,
  text: string,
  units: Unit[],
  spans: [number, number][],
): ParsedDoc {
  const preamble: OpenSection = {
    level: 1,
    row: section(docId, "preamble", "(Preamble)", null, 0, 0),
  };
  const sections: OpenSection[] = [preamble];
  const blocks: ParsedDoc["blocks"] = [];
  let pending: { start: number; end: number; table: boolean } | null = null;
  const current = () => sections[sections.length - 1];
  const flush = () => {
    if (pending) blocks.push(...packBlock(text, current().row, pending, blocks));
    pending = null;
  };

  for (const p of packets(units, spans)) {
    if (p.kind === "heading") {
      flush();
      current().row.charEnd = p.start;
      const u = p.unit;
      const parent = [...sections].reverse().find((s) => s !== preamble && s.level < u.level!);
      sections.push({
        level: u.level!,
        row: section(
          docId,
          u.anchor ?? `section-${p.index}`,
          u.text,
          parent?.row.sectionId ?? null,
          sections.length,
          p.start,
        ),
      });
      continue;
    }
    const fits = pending && pending.table === p.table && p.end - pending.start <= MAX_BLOCK_CHARS;
    if (fits) pending!.end = p.end;
    else {
      flush();
      pending = { start: p.start, end: p.end, table: p.table };
    }
  }
  flush();
  current().row.charEnd = text.length;
  return { sections: sections.map((s) => s.row), blocks };
}

function section(
  docId: string,
  slug: string,
  heading: string,
  parentSectionId: string | null,
  ordinal: number,
  charStart: number,
): ParsedDoc["sections"][number] {
  return {
    sectionId: `${docId}::sec::${slug}`,
    heading,
    headingSlug: slug,
    parentSectionId,
    ordinal,
    firstPage: 1,
    charStart,
    charEnd: charStart,
  };
}

/* One pending range → block rows (split only if a single packet is over the cap). */
function packBlock(
  text: string,
  sec: ParsedDoc["sections"][number],
  range: { start: number; end: number; table: boolean },
  existing: ParsedDoc["blocks"],
): ParsedDoc["blocks"] {
  const inSection = existing.filter((b) => b.sectionId === sec.sectionId).length;
  return splitRange(text, range.start, range.end).map(([s, e], k) => ({
    blockId: `${sec.sectionId}::b${String(inSection + k + 1).padStart(2, "0")}`,
    sectionId: sec.sectionId,
    pageNum: 1,
    blockType: range.table ? "table" : "paragraph",
    ordinal: existing.length + k,
    text: text.slice(s, e),
    charStart: s,
    charEnd: e,
  }));
}
