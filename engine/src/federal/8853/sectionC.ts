/* Section C, long-term care insurance contracts: lines 14a through 26 for one insured. */

import {
  getLtcBenefitsFacts,
  LTC_KEYS,
  numberAnswer,
  type LtcBenefitsFactValue,
} from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import { ssnOf } from "../../values.js";
import type { AccountHolder } from "./exceptions.js";
import type { Form8853Lines } from "./filingInfo.js";
import { perDiemLines } from "./lines.js";

/*
 * Filing Requirements for Section C (irs-8853-inst-2025::sec::multiple-payees::b01,
 * ::start-here-2::b01): "all" of Section C for per diem payments under a qualified
 * contract or accelerated death benefits for a chronically ill insured; "terminal"
 * (lines 14a, 14b, 15, 16, 17 if applicable, and 26) when the only periodic
 * accelerated death benefits were for a terminally ill insured; "line17" (lines
 * 14a, 14b and 17) for per diem payments under a contract that is not qualified.
 */
export type SectionCMode = "all" | "terminal" | "line17";

export interface SectionCResult {
  lines: Form8853Lines;
  required: Record<string, unknown>;
  policyholder?: AccountHolder;
  expected?: Array<keyof Form8853Lines>;
}

const MORE_THAN_ONE =
  "The 1099-LTC facts name more than one insured or more than one policyholder: each needs its own Section C (irs-8853-inst-2025::sec::multiple-payees::b02), and the engine prints one.";
const MULTIPLE_PAYEES =
  "Someone else also received per diem payments for the insured (line 15 Yes): the aggregate statement and the allocation of the per diem limitation (irs-8853-inst-2025::sec::start-here-2::b02) are not modeled.";

const SECTION_C_FIELDS = [
  "1.header.more_than_one_section_c",
  "1.line.14a_insured_name",
  "1.line.14b_insured_ssn",
  "1.line.15_other_person_received_payments_yes",
  "1.line.15_other_person_received_payments_no",
  "1.line.16_insured_terminally_ill_yes",
  "1.line.16_insured_terminally_ill_no",
  "1.line.17_gross_ltc_per_diem_payments",
  "1.line.18_qualified_ltc_contract_payments",
  "1.line.19_accelerated_death_benefits",
  "1.line.20_total_per_diem_payments",
  "1.line.21_per_day_limit_amount",
  "1.line.22_qualified_ltc_service_costs",
  "1.line.23_larger_of_line_21_or_22",
  "1.line.24_ltc_service_reimbursements",
  "1.line.25_per_diem_limitation",
  "1.line.26_taxable_payments",
] as const;

const LIMITATION_FIELDS = SECTION_C_FIELDS.slice(
  SECTION_C_FIELDS.indexOf("1.line.21_per_day_limit_amount"),
);

/* Box 5 settles line 16 when any form checks a box; else the stated answer. */
function terminallyIll(
  rows: ReadonlyArray<LtcBenefitsFactValue>,
  stated: unknown,
): boolean | undefined {
  if (rows.some((row) => row.box5 === "terminally_ill")) return true;
  if (rows.some((row) => row.box5 === "chronically_ill")) return false;
  return typeof stated === "boolean" ? stated : undefined;
}

/* Line 19 counts a form's box 2 only while the insured was chronically, not terminally, ill (::line-19::b01). */
function chronicallyIll(
  row: LtcBenefitsFactValue,
  insuredTerminal: boolean | undefined,
): boolean | undefined {
  if (row.box5 !== undefined) return row.box5 === "chronically_ill";
  return insuredTerminal === undefined ? undefined : !insuredTerminal;
}

const yesNo = (
  answer: boolean | undefined,
  yes: keyof Form8853Lines,
  no: keyof Form8853Lines,
): Form8853Lines =>
  answer === undefined ? {} : { [yes]: answer ? true : undefined, [no]: answer ? undefined : true };

/* The digits, or the text as given when it is not an SSN; the form's formatter adds the dashes. */
const insuredSsn = (raw: string): string => ssnOf(raw) ?? raw;

function amountLines(
  perDiem: ReadonlyArray<LtcBenefitsFactValue>,
  insuredTerminal: boolean | undefined,
) {
  /* Blank, not 0, when no 1099-LTC feeds the line (the printed-zero rule). */
  const line18 = roundDollars(
    sumOrBlank(...perDiem.filter((row) => row.box4 === true).map((row) => row.box1)),
  );
  const adb = perDiem.filter((row) => (row.box2 ?? 0) > 0);
  const chronic = adb.map((row) => chronicallyIll(row, insuredTerminal));
  const line19 = roundDollars(
    sumOrBlank(...adb.filter((_, index) => chronic[index] === true).map((row) => row.box2)),
  );
  const mode: SectionCMode | undefined =
    (line18 ?? 0) > 0 || (line19 ?? 0) > 0
      ? "all"
      : chronic.includes(undefined)
        ? undefined
        : adb.length > 0
          ? "terminal"
          : "line17";
  return { line17: roundDollars(sum(...perDiem.map((row) => row.box1))), line18, line19, mode };
}

/* Lines 21–26 for the one LTC period, or blank while an answer is missing. */
function limitationLines(inputs: ResolverInputs, line20: number) {
  const periodDays = numberAnswer(inputs.facts, LTC_KEYS.periodDays);
  const serviceCosts = numberAnswer(inputs.facts, LTC_KEYS.qualifiedServicesCosts);
  const reimbursements = numberAnswer(inputs.facts, LTC_KEYS.reimbursements);
  const required = {
    [LTC_KEYS.periodDays]: periodDays,
    [LTC_KEYS.qualifiedServicesCosts]: serviceCosts,
    [LTC_KEYS.reimbursements]: reimbursements,
  };
  if (periodDays === undefined || serviceCosts === undefined || reimbursements === undefined) {
    return { lines: {}, required };
  }
  const result = perDiemLines({ line20, periodDays, serviceCosts, reimbursements });
  const lines: Form8853Lines = {
    "1.line.21_per_day_limit_amount": result.line21,
    "1.line.22_qualified_ltc_service_costs": result.line22,
    "1.line.23_larger_of_line_21_or_22": result.line23,
    "1.line.24_ltc_service_reimbursements": result.line24,
    "1.line.25_per_diem_limitation": result.line25,
    "1.line.26_taxable_payments": result.line26,
  };
  return { lines, required };
}

function modeLines(
  inputs: ResolverInputs,
  amounts: ReturnType<typeof amountLines>,
  otherPayees: unknown,
) {
  const { line17, line18, line19, mode } = amounts;
  if (mode === "line17" || mode === undefined) {
    return { lines: { "1.line.17_gross_ltc_per_diem_payments": line17 }, required: {} };
  }
  if (mode === "terminal") {
    const lines: Form8853Lines = { "1.line.26_taxable_payments": 0 };
    if (line17 > 0) lines["1.line.17_gross_ltc_per_diem_payments"] = line17;
    return { lines, required: {} };
  }
  const line20 = sum(line18, line19);
  const base: Form8853Lines = {
    "1.line.17_gross_ltc_per_diem_payments": line17,
    "1.line.18_qualified_ltc_contract_payments": line18,
    "1.line.19_accelerated_death_benefits": line19,
    "1.line.20_total_per_diem_payments": line20,
  };
  if (otherPayees === true) {
    const gaps = Object.fromEntries(
      LIMITATION_FIELDS.map((field) => [field, unsupported(MULTIPLE_PAYEES)]),
    );
    return { lines: { ...base, ...gaps }, required: {} };
  }
  if (otherPayees === undefined) return { lines: base, required: {} };
  const limitation = limitationLines(inputs, line20);
  return { lines: { ...base, ...limitation.lines }, required: limitation.required };
}

export function sectionC(inputs: ResolverInputs): SectionCResult {
  const perDiem = getLtcBenefitsFacts(inputs.facts)
    .map((fact) => fact.value)
    .filter((row) => row.box3 === "per_diem");
  if (perDiem.length === 0) return { lines: {}, required: {} };
  const owners = new Set(perDiem.map((row) => row.owner ?? "taxpayer"));
  const insureds = new Set(perDiem.map((row) => ssnOf(row.insuredSsn) ?? row.insuredSsn));
  if (owners.size > 1 || insureds.size > 1) {
    return {
      lines: Object.fromEntries(
        SECTION_C_FIELDS.map((field) => [field, unsupported(MORE_THAN_ONE)]),
      ),
      required: {},
    };
  }
  const statedTerminal = inputs.factByKey.get(LTC_KEYS.insuredTerminallyIll);
  const insuredTerminal = terminallyIll(perDiem, statedTerminal);
  const otherPayees = inputs.factByKey.get(LTC_KEYS.otherPayees);
  const amounts = amountLines(perDiem, insuredTerminal);
  const asksQuestions = amounts.mode !== "line17";
  const byMode = modeLines(inputs, amounts, otherPayees);
  const required: Record<string, unknown> = { ...byMode.required };
  if (asksQuestions)
    required[LTC_KEYS.otherPayees] = typeof otherPayees === "boolean" ? otherPayees : undefined;
  if (asksQuestions && !perDiem.some((row) => row.box5 !== undefined)) {
    required[LTC_KEYS.insuredTerminallyIll] = insuredTerminal;
  }
  const answers = asksQuestions
    ? {
        ...yesNo(
          typeof otherPayees === "boolean" ? otherPayees : undefined,
          "1.line.15_other_person_received_payments_yes",
          "1.line.15_other_person_received_payments_no",
        ),
        ...yesNo(
          insuredTerminal,
          "1.line.16_insured_terminally_ill_yes",
          "1.line.16_insured_terminally_ill_no",
        ),
      }
    : {};
  return {
    lines: {
      "1.line.14a_insured_name": perDiem[0].insuredName,
      "1.line.14b_insured_ssn": insuredSsn(perDiem[0].insuredSsn),
      ...answers,
      ...byMode.lines,
    },
    required,
    policyholder: [...owners][0],
    expected: asksQuestions ? ["1.line.26_taxable_payments"] : [],
  };
}
