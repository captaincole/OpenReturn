import type { LawSource } from "./law";

/*
 * The table of contents of the law, one level at a time. Keep the types in
 * sync by hand with canon/src/law/lawToc.ts. A node is a structure level
 * (a subtitle, a chapter, a part, a subject group), named by its section id
 * without "<docId>::sec::": "sta-ch1-sche", "pt1-sgecfr504ddca54174c57".
 */

export interface LawTocEntry {
  node: string;
  heading: string;
}

export type LawTocChild =
  | ({ kind: "group" } & LawTocEntry)
  | {
      kind: "section";
      number: string;
      citation: string;
      heading: string;
      /** 2 and up for a later version of a California number; it opens at that version's heading. */
      version?: number;
    };

export interface LawToc {
  installed: true;
  source: LawSource;
  docId: string;
  release: { title: string; published: string | null };
  /** null at the top level of the document. */
  node: LawTocEntry | null;
  /** The levels above the node, outermost first. */
  ancestors: LawTocEntry[];
  children: LawTocChild[];
}

const TOC_ROOT = "/library/law/toc";
const SOURCES: readonly LawSource[] = ["statute", "regulations", "california"];

/** The name of each library's top level, as the first crumb shows it. */
export const LAW_SOURCE_TITLE: Record<LawSource, string> = {
  statute: "Internal Revenue Code",
  regulations: "Treasury Regulations",
  california: "California Revenue and Taxation Code",
};

export const isLawSource = (raw: string): raw is LawSource => SOURCES.includes(raw as LawSource);

/** lawTocHref("statute") → "/library/law/toc/statute"; with a node, that level's page. */
export const lawTocHref = (source: LawSource, node?: string): string =>
  `${TOC_ROOT}/${source}${node ? `/${encodeURIComponent(node)}` : ""}`;

/** The crumbs above a level or a section: the library's top level first, then each level. */
export const lawCrumbs = (
  source: LawSource,
  ancestors: LawTocEntry[],
): { href: string; label: string }[] => [
  { href: lawTocHref(source), label: LAW_SOURCE_TITLE[source] },
  ...ancestors.map((entry) => ({ href: lawTocHref(source, entry.node), label: entry.heading })),
];
