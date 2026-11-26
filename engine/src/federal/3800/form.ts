/*
 * The whole of Form 3800 for one return: the rows of Parts III and IV, their
 * totals, Parts I and II, and the allocation of the allowed credit among the
 * rows. Bindings and the breakdowns of Parts V and VI read the result.
 */

import type { Unsupported } from "../../types.js";
import {
  allowedForSource,
  passiveCreditLimitOf,
  type PassiveCreditLimit,
} from "../8582-cr/form.js";
import { allocate, claimOf, tierOfSource, type Source } from "./allocation.js";
import {
  addCells,
  figure,
  gap,
  isGap,
  subtractedAtLeastZero,
  totalOf,
  valueOf,
  type Cell,
} from "./cells.js";
import {
  allowedOf,
  isCarryback,
  makesElection,
  signedTransfer,
  type Carryover,
  type CurrentCredit,
} from "./credits.js";
import { currentCreditsOf } from "./currentCredits.js";
import {
  partI,
  sectionA,
  sectionB,
  sectionC,
  tierLimitsOf,
  type PartILines,
  type SectionALines,
  type SectionBLines,
  type SectionCLines,
  type TaxInputs,
} from "./lines.js";
import {
  availableOf,
  nonpassiveCarryovers,
  nonpassiveTransfers,
  partIIIColumns,
  partIVColumns,
  passiveTransfers,
  type PartIIIColumns,
  type PartIVColumns,
} from "./rowLines.js";
import type { Tier } from "./rows.js";
import { taxInputsOf, type Accessor, type Form3800Info } from "./tax.js";

export type PartIIIRowLines = PartIIIColumns & { i: Cell };
export type PartIVRowLines = PartIVColumns & { g: Cell; i: Cell };
export type TotalColumns = Record<"d" | "e" | "f" | "g" | "h" | "i" | "j", Cell>;

const RECAPTURE_GAP =
  "The amount recaptured or adjusted (column (h)) is more than the carryover left after the credit used, and a recapture above the carryover is a tax on Form 4255, which the engine does not figure.";

/* What the rows give before the tax: Parts III and IV without columns (i) and (g). */
export interface Form3800Rows {
  current: CurrentCredit[];
  carryovers: Carryover[];
}

const startsWith = (prefix: string) => (item: { line: string }) => item.line.startsWith(prefix);
const onLine = (line: string) => (item: { line: string }) => item.line === line;

/* Line 11 before the research limitation reads it: line 9 less line 10c, at least 0. */
function line11Of(tax: TaxInputs | ReturnType<typeof taxInputsOf>): Cell {
  if (tax === undefined || isGap(tax)) return tax;
  return subtractedAtLeastZero(totalOf(tax.line7, tax.line8), totalOf(tax.line10a, tax.line10b));
}
/* The rows before the passive activity limit, or undefined while a line they read waits. */
function rowsBeforeLimitOf(form: Accessor, info: Form3800Info): Form3800Rows | undefined {
  const tax = taxInputsOf(form, info);
  const current = currentCreditsOf(form, info, line11Of(tax));
  if (current === undefined) return undefined;
  return { current, carryovers: info.form3800Sources?.carryovers ?? [] };
}

/*
 * Form 8582-CR for the return's passive sources (federal/8582-cr/form.ts), or
 * undefined while it waits. Its bindings print it from here.
 */
export function passiveLimitOfReturn(
  form: Accessor,
  info: Form3800Info,
): PassiveCreditLimit | undefined {
  const rows = rowsBeforeLimitOf(form, info);
  if (rows === undefined) return undefined;
  return passiveCreditLimitOf([...rows.current, ...rows.carryovers], form, info);
}

/*
 * The rows of the return, or undefined while a line they read waits. A passive
 * source carries what Form 8582-CR allows of it ("Use Form 8582-CR ... to
 * figure the amounts of credits available", irs-3800-inst-2025::sec::part-iv-2::b04);
 * when Form 8582-CR does not file, it carries nothing and its columns are gaps.
 */
export function form3800RowsOf(form: Accessor, info: Form3800Info): Form3800Rows | undefined {
  const rows = rowsBeforeLimitOf(form, info);
  if (rows === undefined) return undefined;
  const sources = [...rows.current, ...rows.carryovers];
  if (!sources.some((source) => source.passive)) return rows;
  if (info.mustFile?.["form-8582-cr"]?.value !== true) return rows;
  const limit = passiveCreditLimitOf(sources, form, info);
  if (limit === undefined) return undefined;
  const withAllowed = <T extends CurrentCredit | Carryover>(source: T): T =>
    source.passive ? { ...source, allowed: allowedForSource(limit, source) } : source;
  return { current: rows.current.map(withAllowed), carryovers: rows.carryovers.map(withAllowed) };
}

export interface Form3800Result extends Form3800Rows {
  partI: PartILines;
  a: SectionALines;
  b: SectionBLines;
  c: SectionCLines;
  used: Map<Source, Cell>;
  /* A transfer or elective payment on the return: Part III columns (b), (f), (i) (part-iii-4::b01). */
  election: boolean;
  /* Line 7 is a gap (a Form 8621 gap): every line of Part II is. */
  taxGap?: Unsupported;
}

/* The Part I, Section B and Section C inputs the rows give. */
function inputsOf({ current, carryovers }: Form3800Rows) {
  const iii = (prefix: string) => partIIIColumns(current.filter(startsWith(prefix)));
  const iv = (prefix: string) => partIVColumns(carryovers.filter(startsWith(prefix)));
  const general = carryovers.filter(
    (each) => each.line.startsWith("1") || each.line.startsWith("2"),
  );
  const line2 = addCells(
    iii("1").d,
    passiveTransfers(current.filter(startsWith("1"))),
    partIVColumns(general).d,
  );
  const line23 = addCells(iii("3").d, iv("3").d);
  const line32 = addCells(iii("4").d, passiveTransfers(current.filter(startsWith("4"))), iv("4").d);
  /*
   * Lines 3, 24 and 33: the passive credits of the tier that Form 8582-CR
   * allows (line-3::b01, line-24::b01, line-33::b01: "If no credits are
   * allowed, enter -0-"); blank when the tier has no passive credit.
   */
  const passive = [...current, ...carryovers].filter((source) => source.passive);
  const passiveAllowed = (cell: Cell, tier: Tier) =>
    cell === undefined || cell === 0
      ? undefined
      : addCells(0, ...passive.filter((source) => tierOfSource(source) === tier).map(allowedOf));
  const specified = carryovers.filter(startsWith("4"));
  const zone = carryovers.filter(onLine("3"));
  return {
    partI: {
      line1: addCells(iii("1").e, nonpassiveTransfers(current.filter(startsWith("1")))),
      line2,
      line3: passiveAllowed(line2, "general"),
      line4: nonpassiveCarryovers(general, false),
      line5: nonpassiveCarryovers(general, true),
    },
    sectionB: {
      // "The carryforward and carryback for Form 8844 will flow to this line" (line-22::b01).
      line22: addCells(
        iii("3").e,
        nonpassiveCarryovers(zone, false),
        nonpassiveCarryovers(zone, true),
      ),
      line23,
      line24: passiveAllowed(line23, "empowerment"),
    },
    sectionC: {
      line30: addCells(iii("4").e, nonpassiveTransfers(current.filter(startsWith("4")))),
      line32,
      line33: passiveAllowed(line32, "specified"),
      line34: nonpassiveCarryovers(specified, false),
      line35: nonpassiveCarryovers(specified, true),
    },
  };
}
/*
 * What a source brings to its tier: column (g) of a credit, column (f) of a
 * carryover; a passive source brings what Form 8582-CR allows of it.
 */
function claimAmount(source: Source): number {
  if (source.passive) return valueOf(allowedOf(source));
  if ("originYear" in source) return valueOf(availableOf(source));
  return valueOf(source.amount) + (signedTransfer(source) ?? 0);
}

function usedOf(rows: Form3800Rows, limits: Record<Tier, Cell>): Map<Source, Cell> {
  const sources: Source[] = [...rows.carryovers, ...rows.current];
  const used = new Map<Source, Cell>();
  for (const tier of ["general", "empowerment", "specified"] as const) {
    const claims = sources
      .filter((source) => tierOfSource(source) === tier)
      .map((source) => claimOf(source, claimAmount(source)));
    for (const [source, amount] of allocate(claims, limits[tier])) used.set(source, amount);
  }
  return used;
}

/* The whole form, an engine gap in a line the tax limit reads, or undefined while one waits. */
export function form3800Of(form: Accessor, info: Form3800Info): Form3800Result | undefined {
  const rows = form3800RowsOf(form, info);
  const tax = taxInputsOf(form, info);
  if (rows === undefined || tax === undefined) return undefined;
  const inputs = inputsOf(rows);
  const first = partI(inputs.partI);
  const taxLines: TaxInputs = isGap(tax)
    ? { line7: 0, line8: tax, line10a: tax, line10b: tax, line14: tax }
    : tax;
  const lineA = sectionA(taxLines, first.line6);
  const lineB = sectionB(lineA, taxLines.line14, inputs.sectionB);
  const lineC = sectionC(lineA, lineB, inputs.sectionC);
  const used = usedOf(rows, tierLimitsOf(lineA, lineB, lineC));
  const election = rows.current.some(makesElection);
  const taxGap = isGap(tax) ? tax : undefined;
  return { ...rows, partI: first, a: lineA, b: lineB, c: lineC, used, election, taxGap };
}

/* The total of what a set of sources used. */
export function usedBy(result: Form3800Result, sources: ReadonlyArray<Source>): Cell {
  return addCells(...sources.map((source) => result.used.get(source) ?? 0));
}

export function partIIIRowOf(result: Form3800Rows, line: string): PartIIIColumns | undefined {
  const credits = result.current.filter(onLine(line));
  return credits.length === 0 ? undefined : partIIIColumns(credits);
}

/* Column (i) of a Part III row or total: blank unless the return makes an election (part-iii-4::b01). */
export function partIIIUsed(result: Form3800Result, credits: ReadonlyArray<CurrentCredit>): Cell {
  if (!result.election || credits.length === 0) return undefined;
  return usedBy(result, credits);
}

export function partIVRowOf(result: Form3800Rows, line: string): PartIVColumns | undefined {
  const carryovers = result.carryovers.filter(onLine(line));
  return carryovers.length === 0 ? undefined : partIVColumns(carryovers);
}

/* Column (i): "Subtract the sum of columns (g) and (h) from the sum of columns (e) and (f)" (part-iv-2::b04). */
export function carryforwardOf(columns: Pick<PartIVColumns, "e" | "f" | "h">, used: Cell): Cell {
  const left = figure(
    (afterLimit, notPassive, applied, recaptured) => afterLimit + notPassive - applied - recaptured,
    columns.e,
    columns.f,
    used,
    columns.h,
  );
  return typeof left === "number" && left < 0 ? gap(RECAPTURE_GAP) : left;
}

/* The carryforwards (not carrybacks) of a set of carryovers that changed from the original return (line 4 and line 34 boxes). */
export const anyChanged = (carryovers: ReadonlyArray<Carryover>) =>
  carryovers.some(
    (carryover) => carryover.changed && !carryover.passive && !isCarryback(carryover),
  );
