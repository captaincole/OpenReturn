/*
 * Form 4835 lines 32 and 34: the net farm rental income, or the loss and how
 * much of it is deductible. Pure; the resolver states the passive activity and
 * at-risk answers. Form 8582 does not take a Form 4835 activity (QUESTIONS.md,
 * "Proposals for a discussion"), so a case that needs it is a gap.
 */

import { isGap, type Gap, type Line } from "./lines.js";

/*
 * Form 8582 for this return: it files for another passive activity or by decision;
 * the decision says it does not file (the Schedule E exception); or neither.
 */
export type Form8582State = "files" | "exception" | "open";

/* An answer line 32 or 34 waits on. */
export type ResultAnswer =
  | "active_participation"
  | "at_risk"
  | "real_estate_professional"
  | "material_participation"
  | "form_8582";

export interface ResultContext {
  priorYearUnallowedLoss: number;
  activelyParticipated?: boolean;
  allInvestmentAtRisk?: boolean;
  /* The taxpayer is a real estate professional (undefined while unstated). */
  realEstateProfessional?: boolean;
  /* With a real estate professional: materially participated in this farm rental. */
  materiallyParticipated?: boolean;
  form8582: Form8582State;
}

export interface Form4835Result {
  line32?: Line<number>;
  line34a?: Line<boolean>;
  line34b?: Line<boolean>;
  /* The deductible loss, negative. */
  line34c?: Line<number>;
  /* Schedule E line 40: line 32 or line 34c. */
  scheduleELine40?: Line<number>;
  waitsOn: ResultAnswer[];
}

export const PRIOR_YEAR_LOSS =
  "A prior-year unallowed loss from this farm rental goes through Form 8582 (irs-4835-inst-2025::sec::line-32::b01), which does not take a Form 4835 activity.";
export const ON_FORM_8582 =
  "Form 8582 files for this return, and the farm rental belongs on it (irs-4835-inst-2025::sec::line-32::b02, line-34::b01); the engine's Form 8582 does not take a Form 4835 activity.";
export const NOT_AT_RISK =
  "Some investment is not at risk (box 34b): Form 6198 comes first (irs-4835-inst-2025::sec::line-34::b01), and the engine's Form 6198 does not take a Form 4835 activity.";
export const EXCEPTION_NEEDS_ACTIVE_PARTICIPATION =
  "Form 8582 is decided not to file, but the Schedule E exception needs active participation in every rental real estate activity (irs-1040se-inst-2025::sec::exception-for-certain-rental-real-estate-activities::b01), and line A is No.";

/*
 * Nonpassive: a real estate professional who materially participated
 * (irs-4835-inst-2025::sec::line-34::b01, second bullet); undefined while an
 * answer is missing.
 */
export function isNonpassive(context: ResultContext): boolean | undefined {
  if (context.realEstateProfessional === false) return false;
  if (context.realEstateProfessional === undefined) return undefined;
  return context.materiallyParticipated;
}

function passiveAnswers(context: ResultContext): ResultAnswer[] {
  if (context.realEstateProfessional === undefined) return ["real_estate_professional"];
  return context.materiallyParticipated === undefined ? ["material_participation"] : [];
}

const everyLine = (gap: Gap): Form4835Result => ({
  line32: gap,
  line34a: gap,
  line34b: gap,
  line34c: gap,
  scheduleELine40: gap,
  waitsOn: [],
});

/*
 * Line 7 more than or equal to line 31 (irs-4835-inst-2025::sec::line-32::b01,
 * first bullet): line 32 is the net income. While Form 8582 files, a passive
 * farm rental belongs on it (line-32::b02).
 */
function incomeResult(net: number, context: ResultContext): Form4835Result {
  if (context.form8582 === "files") {
    const nonpassive = isNonpassive(context);
    if (nonpassive === undefined) return { waitsOn: passiveAnswers(context) };
    if (!nonpassive) return everyLine({ gap: ON_FORM_8582 });
  }
  return { line32: net, scheduleELine40: net, waitsOn: [] };
}

/*
 * The deductible loss on line 34c (line-34::b01): all of it for a real estate
 * professional who materially participated, or under the Schedule E exception
 * with active participation; else Form 8582 decides it.
 */
function deductibleLoss(net: number, context: ResultContext): Line<number> | ResultAnswer[] {
  if (isNonpassive(context) === true) return net;
  if (context.form8582 === "exception") {
    if (context.activelyParticipated === true) return net;
    if (context.activelyParticipated === false) {
      return { gap: EXCEPTION_NEEDS_ACTIVE_PARTICIPATION };
    }
    return ["active_participation"];
  }
  if (isNonpassive(context) === undefined) return passiveAnswers(context);
  if (context.form8582 === "files") return { gap: ON_FORM_8582 };
  return ["form_8582"];
}

/*
 * Line 31 more than line 7: line 32 stays blank ("don't enter your loss on line
 * 32", line-32::b01); box 34a or 34b; the deductible loss on line 34c.
 */
function lossResult(net: number, context: ResultContext): Form4835Result {
  const atRisk = context.allInvestmentAtRisk;
  if (atRisk === undefined) return { waitsOn: ["at_risk"] };
  const boxes = { line34a: atRisk ? true : undefined, line34b: atRisk ? undefined : true };
  if (!atRisk) {
    const gap = { gap: NOT_AT_RISK };
    return { ...boxes, line34c: gap, scheduleELine40: gap, waitsOn: [] };
  }
  const loss = deductibleLoss(net, context);
  if (Array.isArray(loss)) return { ...boxes, waitsOn: loss };
  return { ...boxes, line34c: loss, scheduleELine40: loss, waitsOn: [] };
}

/* Lines 32 and 34 from line 7 and line 31; blank when both are blank. */
export function farmRentalResult(
  line7: number | undefined,
  line31: Line<number>,
  context: ResultContext,
): Form4835Result {
  if (isGap(line31)) return everyLine(line31);
  if (line7 === undefined && line31 === undefined) return { waitsOn: [] };
  if (context.priorYearUnallowedLoss > 0) return everyLine({ gap: PRIOR_YEAR_LOSS });
  const net = (line7 ?? 0) - (line31 ?? 0);
  return net >= 0 ? incomeResult(net, context) : lossResult(net, context);
}
