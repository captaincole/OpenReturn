/*
 * One Form 8915-F from its fact and the 1099-R facts, before Form 8606: Part I,
 * Part II, Part III up to line 17, Part IV and the worksheets. Pure; it reads
 * no other form, so Forms 1040, 5329 and 8606 can call it.
 */

import {
  DISASTER_YEARS_FOR_2025,
  getDisasterRetirementFacts,
  type DisasterRetirementFact,
  type IraOwner,
  type QualifiedDisaster,
  type RetirementDistributionFact,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import {
  FORM_YEAR,
  columnA,
  costShare,
  distributionsByKey,
  isRothOnForm8606,
  namedParts,
  namedPieces,
  overNamedGap,
  ownerOf,
  type NamedPiece,
} from "./designations.js";
import {
  QUALIFIED_DISASTER_LIMIT,
  allocateInDateOrder,
  line1,
  needsWorksheet1B,
  partIColumns,
  worksheet1B,
  type LimitDisaster,
  type Line1,
  type PartIColumns,
} from "./lines.js";
import { partIILines, partIVLines, type PartIILines, type PartIVLines } from "./parts.js";
import { distributionPeriodEnd, inDistributionPeriod, inHomePurchaseWindow } from "./periods.js";
import {
  priorYearIncome,
  totalRepayment,
  type PriorYearIncome,
  type TotalRepayment,
} from "./worksheets.js";

export interface PartIFigure {
  disasters: QualifiedDisaster[];
  /* The pieces dated in a Part I disaster's period, and the qualified amount of each. */
  pieces: NamedPiece[];
  qualified: number[];
  /* Undefined with Worksheet 1B: "leave lines 1a through 1e blank" (worksheet-1b::b01). */
  line1?: Line1;
  worksheet1B: boolean;
  columns: PartIColumns;
}

export interface PartIVFigure {
  disasters: QualifiedDisaster[];
  pieces: NamedPiece[];
  lines: PartIVLines;
}

export interface Form8915FFigure {
  key: string;
  owner: IraOwner;
  disasterYear: number;
  disasters: QualifiedDisaster[];
  electNotToSpread: boolean;
  partI?: PartIFigure;
  partII: PartIILines;
  partIV?: PartIVFigure;
  worksheet2: PriorYearIncome;
  worksheet3: TotalRepayment;
  worksheet4: PriorYearIncome;
  worksheet5: TotalRepayment;
  /* Who files (who-must-file::b01): a distribution this year, income spread from earlier years, or a repayment. */
  files: boolean;
}

/* A fact, figured; or why it cannot be. */
export type FigureResult =
  { figure: Form8915FFigure } | { key: string; owner: IraOwner; gap: string };

const YEAR_GAP =
  "Item B is not a year a 2025 Form 8915-F can check: 2020 disasters have no 2025 lines (Appendix A), and a later year than 2026 cannot have a 2025 distribution.";

const limitDisaster = (disaster: QualifiedDisaster): LimitDisaster => ({
  onEarlierForm: disaster.onEarlierForm8915F === true,
  earlier: roundDollars(disaster.earlierQualifiedDisasterDistributions ?? 0),
  periodStart: disaster.beginningDate,
  periodEnd: distributionPeriodEnd(disaster),
});

/* The disasters with a named piece in their period, and those pieces. */
function withPieces(disasters: readonly QualifiedDisaster[], named: readonly NamedPiece[]) {
  const listed = disasters.filter((disaster) =>
    named.some((piece) => inDistributionPeriod(disaster, piece.date)),
  );
  const pieces = named.filter((piece) =>
    listed.some((disaster) => inDistributionPeriod(disaster, piece.date)),
  );
  return { listed, pieces };
}

/*
 * The Part I disasters: those "for which qualified disaster distributions have
 * been made to you this year" (part-i-total-distributions-from-all::b01), where
 * the main home and loss requirements are met.
 *
 * DECISION (2026-11-25, by the author): does a disaster whose $22,000 was used
 * in earlier years stay in the Part I table? Text A, the form, line 1e: "If the
 * amount on line 1e is zero, complete lines 2 through 4 in column (a), skip
 * line 5, enter -0- on line 6" (irs-8915f-face-2025::sec::face-part-i-2::b03).
 * Text B, Worksheet 1B: "If the amount on line 1 of this worksheet is $22,000
 * or more for a disaster ... Remove that disaster from the list at the top of
 * Part I" (irs-8915f-inst-2025::sec::worksheet-1b::b10). The engine keeps it
 * on the form's path (line 1e is then 0 and line 7 shows the distributions as
 * taxable) and removes it when Worksheet 1B is required, because each text is
 * written for its own path and line 1e is 0 only with such a disaster listed.
 */
function partIFigure(
  disasters: readonly QualifiedDisaster[],
  named: readonly NamedPiece[],
  columns: Record<"plan" | "traditional" | "roth", number>,
  line28: number,
): PartIFigure | undefined {
  const eligible = disasters.filter((disaster) => disaster.mainHomeInAreaWithLoss === true);
  let { listed: partIDisasters, pieces } = withPieces(eligible, named);
  if (needsWorksheet1B(partIDisasters.map(limitDisaster), pieces)) {
    const open = eligible.filter(
      (disaster) => limitDisaster(disaster).earlier < QUALIFIED_DISASTER_LIMIT,
    );
    ({ listed: partIDisasters, pieces } = withPieces(open, named));
  }
  if (pieces.length === 0) return undefined;
  const limits = partIDisasters.map(limitDisaster);
  const usesWorksheet = needsWorksheet1B(limits, pieces);
  const limit = usesWorksheet ? undefined : line1(limits);
  const qualified = usesWorksheet
    ? worksheet1B(limits, pieces)
    : allocateInDateOrder(pieces, limit?.line1e ?? 0);
  return {
    disasters: partIDisasters,
    pieces,
    qualified,
    line1: limit,
    worksheet1B: usesWorksheet,
    columns: partIColumns({ columnA: columns, pieces, qualified, line1e: limit?.line1e, line28 }),
  };
}

/* Part IV: the home purchase pieces received in a disaster's window (qualified-distribution-requirements::b02–b03). */
function partIVFigure(
  disasters: readonly QualifiedDisaster[],
  named: readonly NamedPiece[],
): PartIVFigure | undefined {
  const partIVDisasters = disasters.filter((disaster) =>
    named.some((piece) => inHomePurchaseWindow(disaster, piece.date)),
  );
  const pieces = named.filter((piece) =>
    partIVDisasters.some((disaster) => inHomePurchaseWindow(disaster, piece.date)),
  );
  if (pieces.length === 0) return undefined;
  const lines = partIVLines(
    pieces.map((piece) => ({
      amount: piece.amount,
      cost: costShare(piece.row, piece.amount),
      repaid: piece.repaid,
      fromIra: piece.line !== "plan",
    })),
  );
  return { disasters: partIVDisasters, pieces, lines };
}

/* Line 9: the cost share of each plan piece's qualified amount, rounded once (line-9::b01). */
function line9Cost(partI: PartIFigure | undefined): number {
  if (!partI) return 0;
  return sum(
    ...partI.pieces.map((piece, index) =>
      piece.line === "plan" ? costShare(piece.row, partI.qualified[index]) : 0,
    ),
  );
}

/*
 * DECISION (2026-11-25, by the author): with line 1e at 0, does the income
 * spread from an earlier year still go on lines 12 and 23? Text A, the form,
 * line 1e: "If the amount on line 1e is zero, ... do NOT include, in Part II
 * or III later, amounts for disasters listed in the Part I Disaster Table"
 * (irs-8915f-face-2025::sec::face-part-i-2::b03). Text B, Appendix A: "Complete
 * lines 12 through 15 if ... On an earlier Form 8915-F, you did not check the
 * box on line 11 ... you must report income from those distributions"
 * (irs-8915f-inst-2025::sec::part-ii::b01), with Worksheets 2 and 4 taking the
 * earlier lines 11 and 22 (worksheet-2-for-line-12-total-income-from-oth::b03).
 * The engine keeps the earlier years' income: Text A speaks of this year's
 * distributions, and reading it literally would leave that income on no line.
 */
function worksheets(fact: DisasterRetirementFact) {
  const { value } = fact;
  const common = { disasterYear: value.disasterYear, taxYear: FORM_YEAR };
  const earlier = { lastYear: value.lastYearForm, twoYearsAgo: value.formTwoYearsAgo };
  const repaid = {
    lastYear: value.lastYearForm,
    carriedBack: value.excessRepaymentCarriedBack,
    thisYear: value.repaymentsThisYear,
  };
  return {
    worksheet2: priorYearIncome({ ...common, ...earlier, part: "plan" }),
    worksheet3: totalRepayment({ ...repaid, part: "plan" }),
    worksheet4: priorYearIncome({ ...common, ...earlier, part: "ira" }),
    worksheet5: totalRepayment({ ...repaid, part: "ira" }),
  };
}

export function figureForm(
  inputs: ResolverInputs,
  rows: ReadonlyMap<string, RetirementDistributionFact>,
  fact: DisasterRetirementFact,
): FigureResult {
  const { value } = fact;
  const owner = ownerOf(value);
  const years: readonly number[] = DISASTER_YEARS_FOR_2025;
  if (!years.includes(value.disasterYear)) return { key: fact.key, owner, gap: YEAR_GAP };
  const parts = namedParts(value);
  const partIPieces = namedPieces(inputs, rows, owner, parts.partI);
  const partIVPieces = namedPieces(inputs, rows, owner, parts.partIV);
  const gap =
    (typeof partIPieces === "string" ? partIPieces : undefined) ??
    (typeof partIVPieces === "string" ? partIVPieces : undefined);
  if (gap || typeof partIPieces === "string" || typeof partIVPieces === "string")
    return { key: fact.key, owner, gap: gap as string };
  const overNamed = overNamedGap([...partIPieces, ...partIVPieces]);
  if (overNamed) return { key: fact.key, owner, gap: overNamed };
  const partIV = partIVFigure(value.disasters, partIVPieces);
  const partI = partIFigure(
    value.disasters,
    partIPieces,
    columnA(rows, owner),
    partIV?.lines.line28 ?? 0,
  );
  const sheets = worksheets(fact);
  const electNotToSpread = value.electNotToSpread === true;
  const partII = partIILines({
    partICompleted: partI !== undefined,
    line2ColumnB: partI?.columns.columnB?.plan,
    cost: line9Cost(partI),
    electNotToSpread,
    priorYearIncome: sheets.worksheet2.line3,
    totalRepayment: sheets.worksheet3.line5,
  });
  const files =
    partI !== undefined ||
    partIV !== undefined ||
    [
      sheets.worksheet2.line3,
      sheets.worksheet3.line5,
      sheets.worksheet4.line3,
      sheets.worksheet5.line5,
    ].some((amount) => amount > 0);
  const figure: Form8915FFigure = {
    key: fact.key,
    owner,
    disasterYear: value.disasterYear,
    disasters: value.disasters,
    electNotToSpread,
    partI,
    partII,
    partIV,
    ...sheets,
    files,
  };
  return { figure };
}

/* Every Form 8915-F fact, figured. */
export function figureForms(inputs: ResolverInputs): FigureResult[] {
  const facts = getDisasterRetirementFacts(inputs.facts);
  if (facts.length === 0) return [];
  const rows = distributionsByKey(inputs);
  return facts.map((fact) => figureForm(inputs, rows, fact));
}

export const MUST_FILE_8915_F_KEY = "decisions.scope.must_file_8915_f";

/*
 * Part I column (b) of the person's IRAs: traditional, and the Roth IRAs Form
 * 8606 Part III takes. With the decision that Form 8915-F does not file, there
 * are none: the form "must be filed with the relevant original or amended
 * return" for a distribution to count
 * (irs-8915f-inst-2025::sec::qualified-disaster-distribution-requirements::b01),
 * so Form 8606 lines 15b and 25b are 0 (irs-8606-inst-2025::sec::line-15b::b01).
 */
export function qualifiedDisasterIra(
  inputs: ResolverInputs,
  owner: IraOwner,
): { traditional?: number; roth?: number } {
  if (inputs.decisionByKey.get(MUST_FILE_8915_F_KEY) === false) return {};
  const figured = figureForms(inputs).flatMap((result) =>
    "figure" in result && result.figure.owner === owner && result.figure.partI
      ? [result.figure.partI]
      : [],
  );
  const total = (pick: (piece: NamedPiece) => boolean) => {
    const amounts = figured.flatMap((partI) =>
      partI.pieces.map((piece, index) => (pick(piece) ? partI.qualified[index] : 0)),
    );
    const amount = sum(...amounts);
    return amount > 0 ? amount : undefined;
  };
  return {
    traditional: total((piece) => piece.line === "traditional"),
    roth: total(isRothOnForm8606),
  };
}
