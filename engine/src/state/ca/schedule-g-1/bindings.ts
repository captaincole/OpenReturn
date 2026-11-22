/* Schedule G-1 rules, written by hand from ca-540-sched-g1-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { roundDollars } from "../../../money.js";
import type { Unsupported } from "../../../types.js";
import type { ScheduleG1Figures, ScheduleG1FilingInfo } from "./filingInfo.js";
import {
  RATIO_PLACES,
  scheduleG1Lines,
  type AnnuityLines,
  type PartIIILines,
  type ScheduleG1Lines,
} from "./lines.js";
import type { ScheduleG1 } from "./types.js";

type Bindings = Partial<{
  [K in keyof ScheduleG1]: BindingFn<ScheduleG1, ScheduleG1FilingInfo, K>;
}>;
type Answers = ScheduleG1Figures["answers"];

/* The schedule's figures; undefined while it waits, or the gap. */
function figuresOf(info: ScheduleG1FilingInfo): ScheduleG1Figures | Unsupported | undefined {
  return info.scheduleG1;
}

function fromFigures<T>(pick: (figures: ScheduleG1Figures) => T) {
  return (_: unknown, info: ScheduleG1FilingInfo): T | Unsupported | undefined => {
    const figures = figuresOf(info);
    if (figures === undefined || "unsupported" in figures) return figures;
    return pick(figures);
  };
}

const fromLines = <T>(pick: (lines: ScheduleG1Lines) => T) =>
  fromFigures((figures) => pick(scheduleG1Lines(figures.inputs)));

/* Part III lines: blank without the 10-year averaging method. */
const fromPartIII = (pick: (partIII: PartIIILines) => number | undefined) =>
  fromLines((lines) => (lines.partIII === undefined ? undefined : pick(lines.partIII)));

/* Lines 21 to 26: "If line 11 is blank, skip line 21 through line 26" (line 20). */
const fromAnnuity = <T>(pick: (annuity: AnnuityLines) => T) =>
  fromLines((lines) =>
    lines.partIII?.annuity === undefined ? undefined : pick(lines.partIII.annuity),
  );

/* A Part I box: "yes" or "no". */
const answer = (pick: (answers: Answers) => boolean) =>
  fromFigures((figures) => (pick(figures.answers) ? "yes" : "no"));

/*
 * Line 21 prints one digit, the form's point, and the places after it
 * (".443"); a ratio is never more than 1.
 */
export function ratioText(value: number): string {
  const thousandths = roundDollars(value * 10 ** RATIO_PLACES);
  const whole = (thousandths - (thousandths % 1000)) / 1000;
  return `${whole}.${String(thousandths % 1000).padStart(RATIO_PLACES, "0")}`;
}

/* Every Schedule G-1 binding; the unit tests evaluate them without the engine. */
export function scheduleG1Bindings(): Bindings {
  return {
    "0.header.name": (_, info) => namesOnReturn(info),
    "0.header.ssn_itin_or_fein": (_, info) => info.taxpayerSSN,
    // Part I, from the taxpayer's answers (the blank form, lines 1 to 5).
    "0.line.1_entire_balance_distribution": answer((answers) => answers.entireBalance),
    "0.line.2_rolled_over_distribution": answer((answers) => answers.rolledOver),
    "0.line.3_beneficiary_of_participant": answer(
      (answers) => answers.beneficiaryOfParticipantBornBefore1936,
    ),
    "0.line.4_participant_five_years": answer(
      (answers) => answers.participantBornBefore1936FiveYears,
    ),
    "0.line.5_used_schedule_g1_prior_year": answer((answers) => answers.usedScheduleG1After1986),
    // Part II (ca-540-sched-g1-inst-2025::sec::part-ii::b01, ::death-benefit-worksheet::b01).
    "0.line.6_capital_gain_1099r_box_3": fromLines((lines) => lines.line6),
    "0.line.7_capital_gain_election_tax": fromLines((lines) => lines.line7),
    // Part III (::part-iii::b01; ::line-8-…::b01 to b03).
    "0.line.8_ordinary_income_1099r_box_2a": fromPartIII((partIII) => partIII.line8),
    "0.line.9_death_benefit_exclusion": fromPartIII((partIII) => partIII.line9),
    "0.line.10_total_taxable_amount": fromPartIII((partIII) => partIII.line10),
    "0.line.11_actuarial_value_of_annuity": fromPartIII((partIII) => partIII.line11),
    "0.line.12_adjusted_total_taxable_amount": fromPartIII((partIII) => partIII.line12),
    "0.line.13_half_of_line_12": fromPartIII((partIII) => partIII.line13),
    "0.line.14_line_12_over_20000": fromPartIII((partIII) => partIII.line14),
    "0.line.15_twenty_percent_of_line_14": fromPartIII((partIII) => partIII.line15),
    "0.line.16_minimum_distribution_allowance": fromPartIII((partIII) => partIII.line16),
    "0.line.17_amount_after_allowance": fromPartIII((partIII) => partIII.line17),
    "0.line.18_ten_percent_of_line_17": fromPartIII((partIII) => partIII.line18),
    "0.line.19_tax_on_line_18": fromPartIII((partIII) => partIII.line19),
    "0.line.20_ten_times_line_19": fromPartIII((partIII) => partIII.line20),
    "0.line.21_annuity_ratio": fromAnnuity((annuity) => ratioText(annuity.line21)),
    "0.line.22_allowance_for_annuity": fromAnnuity((annuity) => annuity.line22),
    "0.line.23_annuity_after_allowance": fromAnnuity((annuity) => annuity.line23),
    "0.line.24_ten_percent_of_line_23": fromAnnuity((annuity) => annuity.line24),
    "0.line.25_tax_on_line_24": fromAnnuity((annuity) => annuity.line25),
    "0.line.26_ten_times_line_25": fromAnnuity((annuity) => annuity.line26),
    "0.line.27_ten_year_averaging_tax": fromPartIII((partIII) => partIII.line27),
    "0.line.28_tax_on_lump_sum_distribution": fromPartIII((partIII) => partIII.line28),
  };
}

export function register(): void {
  defineForm<ScheduleG1, ScheduleG1FilingInfo>("schedule-g-1", { bindings: scheduleG1Bindings() });
}
