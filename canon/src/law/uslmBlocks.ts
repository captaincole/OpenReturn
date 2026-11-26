import { MAX_BLOCK_CHARS } from "../refdocs/chunk";
import type { ParsedDoc } from "../refdocs/parse";
import { citationOf } from "./lawIds";
import { splitStatute } from "./splitStatute";
import type { Span } from "./textSink";
import type { UnitNode } from "./uslmUnits";

/*
 * Turns a section's unit tree into blocks. A unit that fits the cap with its
 * children is one block. A larger unit gives its lead, each child and each
 * continuation their own blocks; a lead that is only a heading joins the
 * first block below it. The block id is the citation path.
 */

type Block = ParsedDoc["blocks"][number];

export interface SectionInfo {
  sectionId: string;
  /** As printed: "469", "1400Z–2". */
  number: string;
  /** The catchline: "Passive activity losses and credits limited". */
  catchline: string;
}

interface Plan {
  idPath: string[];
  span: Span;
  /** The unit the block's text belongs to. */
  unit: UnitNode;
  /** The units above it, outermost first; the section is first. */
  ancestors: UnitNode[];
}

const CHAPEAU_CONTEXT_CHARS = 300;

/** The finished canonical text and its refs: blocks are planned after the whole title is laid out. */
export interface LaidOutText {
  text: string;
  refsIn(span: Span): string[];
}

export function sectionBlocks(
  info: SectionInfo,
  root: UnitNode,
  laidOut: LaidOutText,
  firstOrdinal: number,
): Block[] {
  return planRoot(root, laidOut.text).map((plan, index) =>
    blockRow(info, plan, laidOut.text, laidOut.refsIn(plan.span), firstOrdinal + index),
  );
}

// The section itself never packs whole: its lead is "text", its subsections stand alone.
function planRoot(root: UnitNode, text: string): Plan[] {
  return planParts(root, [], ["text"], [], text);
}

function planUnit(unit: UnitNode, ancestors: UnitNode[], idPath: string[], text: string): Plan[] {
  const { start, end } = unit.span;
  if (end - start <= MAX_BLOCK_CHARS) return [{ idPath, span: unit.span, unit, ancestors }];
  return planParts(unit, ancestors, idPath, idPath, text);
}

function planParts(
  unit: UnitNode,
  ancestors: UnitNode[],
  leadPath: string[],
  unitPath: string[],
  text: string,
): Plan[] {
  const below = [...ancestors, unit];
  let continuations = 0;
  const items = unit.items.flatMap((item) => {
    if (item.kind === "unit")
      return planUnit(item.unit, below, [...unitPath, item.unit.idSegment], text);
    continuations += 1;
    const name = continuations === 1 ? "cont" : `cont${continuations}`;
    return pieces(item.span, [...unitPath, name], text).map((piece) => ({
      ...piece,
      unit,
      ancestors: below,
    }));
  });
  if (unit.headingOnly && unit.lead && items.length > 0) return prefixLead(unit.lead, items);
  const lead = unit.lead ? pieces(unit.lead, leadPath, text) : [];
  return [
    ...lead.map((piece, index) => ({ ...piece, unit, ancestors: index === 0 ? ancestors : below })),
    ...items,
  ];
}

/*
 * A heading with no text is noise as a block of its own. It runs into the
 * first block below it, as the Code prints it; an outer heading comes first.
 */
function prefixLead(lead: Span, items: Plan[]): Plan[] {
  const [first, ...rest] = items;
  return [{ ...first, span: { start: lead.start, end: first.span.end } }, ...rest];
}

// A piece over the cap splits between sentences; the 2nd piece on adds "-p2".
function pieces(span: Span, idPath: string[], text: string): Pick<Plan, "idPath" | "span">[] {
  return splitStatute(text, span.start, span.end).map(([start, end], index) => ({
    idPath: index === 0 ? idPath : [...idPath, `p${index + 1}`],
    span: { start, end },
  }));
}

function blockRow(
  info: SectionInfo,
  plan: Plan,
  text: string,
  refs: string[],
  ordinal: number,
): Block {
  const chain = chainOf(plan).filter((unit) => unit.segment);
  const path = chain.map((unit) => unit.segment);
  const citation = citationOf(info.number, path);
  const blockText = text.slice(plan.span.start, plan.span.end);
  return {
    blockId: `${info.sectionId}::${plan.idPath.join("-")}`,
    sectionId: info.sectionId,
    pageNum: 1,
    blockType: "paragraph",
    ordinal,
    text: blockText,
    charStart: plan.span.start,
    charEnd: plan.span.end,
    metadata: {
      citation,
      path,
      headings: chain.map((unit) => unit.heading).filter(Boolean),
      refs,
    },
    contextualSummary: null,
    contextualizedText: contextOf(info, citation, plan, blockText),
  };
}

// A continuation or a 2nd piece lists its own unit among its ancestors.
const chainOf = (plan: Plan) =>
  plan.ancestors.at(-1) === plan.unit ? plan.ancestors : [...plan.ancestors, plan.unit];

/*
 * What search indexes: where the block sits, the chapeaus above it (the
 * words its list items finish), then the block.
 */
function contextOf(info: SectionInfo, citation: string, plan: Plan, blockText: string): string {
  const crumbs = plan.ancestors
    .filter((unit) => unit.segment)
    .map((unit) => ` › ${[unit.numText, unit.heading].filter(Boolean).join(" ")}`);
  const header = `${citation} — ${info.catchline}${crumbs.join("")}`;
  const chapeaus = plan.ancestors
    .map((unit) => unit.chapeau)
    .filter(Boolean)
    .map((chapeau) => clip(chapeau, CHAPEAU_CONTEXT_CHARS));
  return [header, ...chapeaus, blockText].join("\n");
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return `${text.slice(0, cut > 0 ? cut : max)} …`;
}
