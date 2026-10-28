import * as cheerio from "cheerio";
import { isTag, type AnyNode, type Element } from "domhandler";
import { slugifyHeading } from "../parse";
import { htmlPublished } from "../published";

/*
 * The library renders this HTML, so only allowlisted tags, attributes and
 * link schemes survive. The raw page differs on every request, so the
 * sidecar's sha256 covers this output. Bump CLEANER_VERSION when the output
 * changes.
 */

export const CLEANER_VERSION = 1;

const ALLOWED_TAGS = new Set([
  ...["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote"],
  ...["ul", "ol", "li", "dl", "dt", "dd"],
  ...["table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td"],
  ...["a", "strong", "b", "em", "i", "u", "sup", "sub", "small", "abbr", "code"],
  ...["img", "figure", "figcaption"],
]);
const DROP_TAGS =
  "script, style, noscript, template, iframe, object, embed, video, audio, canvas, svg, " +
  "form, button, input, select, textarea, nav, link, meta, base";
const KEEP_ATTRS: Record<string, string[]> = {
  "*": ["id"],
  a: ["href"],
  img: ["src", "alt"],
  ol: ["type", "start"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
};
const SAFE_LINK = /^(https?:|mailto:|tel:)/i;
const MAIN_START = '<!-- InstanceBeginEditable name="Main content" -->';
const MAIN_END = "<!-- InstanceEndEditable -->";
const MIN_WORDS = 200;

export class CleanError extends Error {}

export interface CleanedDoc {
  html: string;
  title: string;
  published: string | null;
}

export type FetchImage = (url: string) => Promise<string>;

export async function cleanFtbHtml(
  raw: string,
  pageUrl: string,
  fetchImage: FetchImage,
): Promise<CleanedDoc> {
  const { kicker, title, published } = pageTitle(raw);
  const $ = cheerio.load(mainContent(raw), null, false);
  removeComments($);
  $(DROP_TAGS).remove();
  unwrapDisallowed($);
  stripAttributes($);
  anchorHeadings($);
  fixLinks($, pageUrl);
  await inlineImages($, pageUrl, fetchImage);

  const html = tidy(`<article>\n${heading(kicker, title)}\n${$.html()}\n</article>`);
  checkContent(html);
  return { html: `${html}\n`, title: kicker ? `${kicker} — ${title}` : title, published };
}

/* Built from text: the title is page text, never markup. */
function heading(kicker: string, title: string): string {
  const $ = cheerio.load("", null, false);
  const h1 = $("<h1></h1>").text(title);
  if (kicker) h1.prepend($("<small></small>").text(kicker), " ");
  return $.html(h1);
}

function mainContent(raw: string): string {
  const start = raw.indexOf(MAIN_START);
  const end = raw.indexOf(MAIN_END, start + MAIN_START.length);
  if (start < 0 || end < 0) {
    throw new CleanError("no FTB 'Main content' region: the page template changed");
  }
  return raw.slice(start + MAIN_START.length, end);
}

/*
 * FTB's h1 is "<small>2025 Instructions for Form 540</small> California
 * Resident…", sometimes with a second "<small>Revised: 01/2015</small>".
 */
function pageTitle(raw: string): Omit<CleanedDoc, "html"> & { kicker: string } {
  const $ = cheerio.load(raw);
  const h1 = $("main h1").first();
  const squash = (s: string) => s.replace(/\s+/g, " ").trim();
  const smalls = h1.find("small");
  const kicker = squash(smalls.first().text());
  const published = htmlPublished(smalls.slice(1).text());
  smalls.remove();
  const title = squash(h1.text());
  if (!title) throw new CleanError("no page title (main h1)");
  return { kicker, title, published };
}

function removeComments($: cheerio.CheerioAPI): void {
  const walk = (nodes: AnyNode[]): void =>
    nodes.forEach((n) => {
      if (n.type === "comment") $(n).remove();
      else if ("children" in n) walk([...(n as Element).children]);
    });
  walk($.root().contents().toArray());
}

/* Deepest first, so an unwrapped container's children are already clean. */
function unwrapDisallowed($: cheerio.CheerioAPI): void {
  $("*")
    .toArray()
    .filter(isTag)
    .reverse()
    .filter((el) => !ALLOWED_TAGS.has(el.tagName))
    .forEach((el) => void $(el).replaceWith($(el).contents()));
}

function stripAttributes($: cheerio.CheerioAPI): void {
  $("*")
    .toArray()
    .filter(isTag)
    .forEach((el) => {
      const keep = new Set([...KEEP_ATTRS["*"], ...(KEEP_ATTRS[el.tagName] ?? [])]);
      Object.keys(el.attribs)
        .filter((name) => !keep.has(name))
        .forEach((name) => $(el).removeAttr(name));
    });
}

// Heading id = section slug, so a citation's section is the page anchor.
function anchorHeadings($: cheerio.CheerioAPI): void {
  const renamed = new Map<string, string>();
  const used = new Set<string>(["preamble"]);
  $("h2, h3, h4, h5, h6").each((_, el) => {
    const base = slugifyHeading($(el).text().replace(/\s+/g, " ").trim()) || "section";
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    const old = $(el).attr("id");
    if (old) renamed.set(old, slug);
    $(el).attr("id", slug);
  });
  $("[id]")
    .not("h2, h3, h4, h5, h6")
    .each((_, el) => {
      const id = $(el).attr("id")!;
      if (used.has(id)) $(el).removeAttr("id");
      else used.add(id);
    });
  $('a[href^="#"]').each((_, el) => {
    const target = renamed.get($(el).attr("href")!.slice(1));
    if (target) $(el).attr("href", `#${target}`);
  });
}

// An in-page link to a target not on this page becomes plain text.
function fixLinks($: cheerio.CheerioAPI, pageUrl: string): void {
  const ids = new Set(
    $("[id]")
      .map((_, el) => $(el).attr("id"))
      .get(),
  );
  $("a").each((_, el) => {
    const href = $(el).attr("href")?.trim() ?? "";
    const absolute = href && !href.startsWith("#") ? new URL(href, pageUrl).href : "";
    if (href.startsWith("#") && ids.has(href.slice(1))) return;
    if (absolute && SAFE_LINK.test(absolute)) $(el).attr("href", absolute);
    else $(el).replaceWith($(el).contents());
  });
}

/* FTB-hosted images only. */
async function inlineImages(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  fetchImage: FetchImage,
): Promise<void> {
  const origin = new URL(pageUrl).origin;
  for (const el of $("img").toArray()) {
    const raw = $(el).attr("src")?.trim();
    const src = raw ? new URL(raw, pageUrl) : null;
    if (!src || src.origin !== origin) $(el).remove();
    else $(el).attr("src", await fetchImage(src.href));
  }
}

function tidy(html: string): string {
  return html
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function checkContent(html: string): void {
  const $ = cheerio.load(html);
  if ($("h2").length === 0) throw new CleanError("no h2 headings in the article");
  const words = $.root().text().split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) throw new CleanError(`only ${words} words in the article`);
}
