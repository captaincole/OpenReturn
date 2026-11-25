/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import type { Form8949Box } from "../../facts/index.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import {
  form4797Files,
  scheduleDGainFromForm4797,
  scheduleDLine19FromForm4797,
} from "../4797/receivers.js";
import { withForm8814 } from "../8814/totals.js";
import { describeItem, entityTitle } from "../passThrough/items.js";
import { receivedAmounts, roundedWithReceived, type Receipt } from "../passThrough/receipts.js";
import type { ScheduleDFilingInfo } from "./filingInfo.js";
import { allowableLoss } from "./lines.js";
import type { ScheduleD } from "./types.js";

/*
 * MANUAL EDIT: these lines read the 8949 totals across every copy, not one
 * copy's. Each covers a 1099-B box and its 1099-DA twin.
 * (h) = rounded (d) − rounded (e) + (g).
 */
const BOX_LINES: Array<[string, Form8949Box[]]> = [
  ["1b", ["partI.boxA", "partI.boxG"]],
  ["2", ["partI.boxB", "partI.boxH"]],
  ["3", ["partI.boxC", "partI.boxI"]],
  ["8b", ["partII.boxD", "partII.boxJ"]],
  ["9", ["partII.boxE", "partII.boxK"]],
  ["10", ["partII.boxF", "partII.boxL"]],
];

type Fn = BindingFn<ScheduleD, ScheduleDFilingInfo, keyof ScheduleD>;

function boxLineBindings(): Partial<{
  [K in keyof ScheduleD]: BindingFn<ScheduleD, ScheduleDFilingInfo, K>;
}> {
  const out: Record<string, Fn> = {};
  for (const [line, boxes] of BOX_LINES) {
    const totalsOf = (info: ScheduleDFilingInfo) =>
      boxes.map((box) => info.form8949BoxTotals?.[box]).filter((total) => total !== undefined);
    const gapOf = (info: ScheduleDFilingInfo) =>
      totalsOf(info).find((total) => total.gap !== undefined)?.gap;
    const column =
      (col: "proceeds" | "cost"): Fn =>
      (_, info) => {
        const totals = totalsOf(info);
        // A Form 8949 sale that cannot be converted makes the line a gap; one that waits, blank.
        const gap = gapOf(info);
        if (gap !== undefined) return unsupported(gap);
        if (totals.some((total) => total.waits === true)) return undefined;
        return totals.length > 0
          ? roundDollars(sum(...totals.map((total) => total[col])))
          : undefined;
      };
    out[`0.line.${line}_proceeds`] = column("proceeds");
    out[`0.line.${line}_cost`] = column("cost");
    out[`0.line.${line}_gain_loss`] = (form, info) => {
      const gap = gapOf(info);
      if (gap !== undefined) return unsupported(gap);
      const proceeds = form[`0.line.${line}_proceeds` as keyof ScheduleD];
      if (typeof proceeds !== "number") return undefined;
      const cost = form[`0.line.${line}_cost` as keyof ScheduleD];
      return sum(
        proceeds,
        typeof cost === "number" ? -cost : 0,
        form[`0.line.${line}_adjustments` as keyof ScheduleD],
      );
    };
  }
  return out as Partial<{ [K in keyof ScheduleD]: BindingFn<ScheduleD, ScheduleDFilingInfo, K> }>;
}

/*
 * MANUAL EDIT: lines 18 and 19 take a K-1's 28% rate gain (box 4b) on line 4
 * of the 28% Rate Gain Worksheet and its unrecaptured section 1250 gain (box
 * 4c) on line 11 of the Unrecaptured Section 1250 Gain Worksheet
 * (irs-1041k1-inst-2025::sec::boxes-4b-and-4c-28-rate-gain-and::b01). Neither
 * worksheet is modeled: with a K-1 amount the line names it; otherwise it
 * keeps the reason it had.
 */
const WORKSHEETS = {
  line18: {
    worksheet: "line 4 of the 28% Rate Gain Worksheet",
    without:
      "Amount from line 7 of the 28% Rate Gain Worksheet requires ingestion of collectibles gains and section 1202 QSB stock exclusion data — no such fact ingestion path exists yet.",
  },
  line19: {
    worksheet: "line 11 of the Unrecaptured Section 1250 Gain Worksheet",
    without:
      "Amount from line 18 of the Unrecaptured Section 1250 Gain Worksheet: the engine figures the worksheet only with Form 4797, so a Form 1099-DIV box 2b alone is not figured.",
  },
} as const;

/* A K-1's gain for a worksheet line, as the reason that names it; undefined with none. */
function k1WorksheetGain(receipt: Receipt | undefined, worksheet: string): Unsupported | undefined {
  if (receipt?.kind === "unsupported") return unsupported(receipt.reason);
  const named = receivedAmounts(receipt).map(
    ({ entity, item }) => `${entityTitle(entity)}: ${describeItem(item)}`,
  );
  return named.length > 0
    ? unsupported(`${named.join("; ")} goes on ${worksheet}, which is not modeled.`)
    : undefined;
}

function worksheetLine(
  receipt: Receipt | undefined,
  line: (typeof WORKSHEETS)[keyof typeof WORKSHEETS],
): Unsupported {
  return k1WorksheetGain(receipt, line.worksheet) ?? unsupported(line.without);
}

/* Line 20 asks whether lines 18 and 19 are zero; with a K-1 amount on either, the answer is not known. */
function line20Gap(info: ScheduleDFilingInfo): Unsupported | undefined {
  return (
    k1WorksheetGain(info.passThrough28RateGain, WORKSHEETS.line18.worksheet) ??
    k1WorksheetGain(info.passThroughUnrecaptured1250Gain, WORKSHEETS.line19.worksheet)
  );
}

// MANUAL EDIT: line 20, undefined until line 17 answers Yes.
function qualifiedDividendsWorksheetApplies(
  form: FormAccessor<ScheduleD>,
  info: ScheduleDFilingInfo,
): boolean | undefined {
  if (form["1.line.17_both_gains_yes"] !== true) return undefined;
  const l18 = form["1.line.18_rate_gain_worksheet_amount"];
  const l19 = form["1.line.19_unrecaptured_sec1250_gain"];
  const l18Zero = l18 === undefined || l18 === 0;
  const l19Zero = l19 === undefined || l19 === 0;
  const filesForm4952 = info.mustFile?.["form-4952"]?.value === true;
  return l18Zero && l19Zero && !filesForm4952;
}

// MANUAL EDIT: line 22, asked when line 17 is No (lines 15 and 16 not both gains).
function qualifiedDividendsAnswer(form: FormAccessor<ScheduleD>): boolean | undefined {
  const l15 = form["0.line.15_net_long_term_gain_loss"];
  const l16 = form["1.line.16_combined_gain_loss"];
  if (typeof l15 !== "number" || typeof l16 !== "number") return undefined;
  if (l15 > 0 && l16 > 0) return undefined;
  return (numberOrBlank(form["form-1040.line.3a"]) ?? 0) > 0;
}

/*
 * MANUAL EDIT: lines 4 and 11 take Form 6781 Part I lines 8 and 9
 * (irs-6781-form-2025::sec::line-8::b01, line-9::b01; no QOF deferral is modeled).
 * Without Form 6781 each line keeps the reason it had before Form 6781 had rules.
 * The other forms each line names have no Schedule D amount in the engine: while
 * one files, the line stays unsupported.
 */
const OTHER_FORMS = {
  line4: {
    form6781Field: "form-6781.0.line.8_short_term_capital_gain_loss",
    forms: ["form-4684", "form-6252", "form-8824"],
    without6781:
      "Requires data from Forms 6252, 4684, 6781, and 8824 — none of these forms are ingested in the current engine. No installment-sale, casualty/theft, straddle, or like-kind-exchange scenarios have been built yet.",
  },
  line11: {
    form6781Field: "form-6781.0.line.9_long_term_capital_gain_loss",
    forms: ["form-4684", "form-4797", "form-6252", "form-8824"],
    without6781:
      "Requires gain figures from Form 4797 Part I, Forms 2439, 6252, 4684, 6781, and 8824 — none of these forms are ingested or have fact categories in the current inventory.",
  },
} as const;

function otherFormsLine(
  form: FormAccessor<ScheduleD>,
  info: ScheduleDFilingInfo,
  line: (typeof OTHER_FORMS)[keyof typeof OTHER_FORMS],
): number | Unsupported | undefined {
  if (info.mustFile?.["form-6781"]?.value !== true) return unsupported(line.without6781);
  const filing = line.forms.filter((formId) => info.mustFile?.[formId]?.value === true);
  if (filing.length > 0) {
    return unsupported(
      `Form 6781 files, but the engine has no Schedule D amount from ${filing.join(", ")}, which this line also takes.`,
    );
  }
  return numberOrBlank(form[line.form6781Field]);
}

/*
 * MANUAL EDIT: line 11 also takes Form 4797's section 1231 gain (line 7 or 9:
 * irs-4797-inst-2025::sec::line-7::b01, line-9::b01) and each QEF's Form 8621
 * line 7c, "a net long-term capital gain. Enter this amount in Part II of the
 * Schedule D" (irs-8621-inst-2025::sec::line-7c::b01), on the line of a fund's
 * undistributed long-term gain (irs-1040sd-inst-2025::sec::undistributed-capital::b01;
 * federal/8621/QUESTIONS.md, question 1). With neither the line is what it was.
 * With either, Form 6781 line 9 adds when it files; Forms 4684, 6252 and 8824
 * still have no Schedule D amount, so the line is a gap while one files.
 */
const LINE_11_FORMS_WITH_NO_AMOUNT = ["form-4684", "form-6252", "form-8824"];

/* The QEF gain for line 11 (Form 8621 line 7c), a fund's gap, or undefined with none. */
function qefGainForLine11(info: ScheduleDFilingInfo): number | Unsupported | undefined {
  const totals = info.form8621Totals;
  if (totals === undefined) return undefined;
  if (totals.gap !== undefined) return unsupported(totals.gap);
  const gain = totals.amounts.capitalGain;
  return gain === 0 ? undefined : gain;
}

function line11(form: FormAccessor<ScheduleD>, info: ScheduleDFilingInfo) {
  const lossGap = info.form8621Totals?.generalRulesLossGap;
  if (lossGap) return unsupported(lossGap);
  const qefGain = qefGainForLine11(info);
  const files4797 = form4797Files(info);
  if (qefGain === undefined && !files4797) return otherFormsLine(form, info, OTHER_FORMS.line11);
  if (typeof qefGain === "object") return qefGain;
  const filing = LINE_11_FORMS_WITH_NO_AMOUNT.filter(
    (formId) => info.mustFile?.[formId]?.value === true,
  );
  if (filing.length > 0) {
    const source = files4797 ? "Form 4797 files" : "Form 8621 line 7c goes on this line";
    return unsupported(
      `${source}, but the engine has no Schedule D amount from ${filing.join(", ")}, which this line also takes.`,
    );
  }
  const form4797 = files4797 ? scheduleDGainFromForm4797(info) : undefined;
  if (typeof form4797 === "object") return form4797;
  if (files4797 && info.form4797?.waitsForLine8) return undefined;
  const form6781 =
    info.mustFile?.["form-6781"]?.value === true
      ? numberOrBlank(form[OTHER_FORMS.line11.form6781Field])
      : undefined;
  return sumOrBlank(form4797, form6781, qefGain);
}

/*
 * MANUAL EDIT: with Form 4797 filing, line 19 is the Unrecaptured Section 1250
 * Gain Worksheet (4797/receivers.ts), on a Yes to line 17 (irs-1040sd-inst-2025::sec::line-19::b01).
 * Its line 11 takes Form 1099-DIV box 2b; a K-1 amount (lines 5 and 11) or a 28%
 * rate gain (line 14: a K-1, or 1099-DIV box 2d) is not modeled, so the line is a gap.
 */
function line19(form: FormAccessor<ScheduleD>, info: ScheduleDFilingInfo) {
  if (!form4797Files(info))
    return worksheetLine(info.passThroughUnrecaptured1250Gain, WORKSHEETS.line19);
  if (form["1.line.17_both_gains_yes"] !== true) return undefined;
  const otherSourceGap =
    k1WorksheetGain(info.passThroughUnrecaptured1250Gain, WORKSHEETS.line19.worksheet) ??
    k1WorksheetGain(info.passThrough28RateGain, WORKSHEETS.line18.worksheet) ??
    ((info.dividendCollectiblesGain ?? 0) > 0
      ? unsupported(
          "Form 1099-DIV box 2d (28% rate gain) goes on line 14 of the Unrecaptured Section 1250 Gain Worksheet through the 28% Rate Gain Worksheet, which is not modeled.",
        )
      : undefined);
  return scheduleDLine19FromForm4797(info, {
    scheduleDLine7: numberOrBlank(form["0.line.7_net_short_term_gain_loss"]),
    scheduleDLine14: numberOrBlank(form["0.line.14_long_term_loss_carryover"]),
    dividendUnrecaptured1250: info.dividendUnrecaptured1250Gain,
    otherSourceGap,
  });
}

export function register(): void {
  defineForm<ScheduleD, ScheduleDFilingInfo>("schedule-d", {
    bindings: {
      ...boxLineBindings(),
      // MANUAL EDIT: concatenate first + last, as on 8949 and Schedule CA.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      // MANUAL EDIT: the generator has no conditional comparison rule.
      "1.line.17_both_gains_yes": (form) => {
        const l15 = form["0.line.15_net_long_term_gain_loss"];
        const l16 = form["1.line.16_combined_gain_loss"];
        if (typeof l15 !== "number" || typeof l16 !== "number") return undefined;
        return l15 > 0 && l16 > 0 ? true : undefined;
      },
      /*
       * MANUAL EDIT: line 20 asks whether lines 18 and 19 are both zero or
       * blank and Form 4952 is not filed, as the form prints it. The 1040 line
       * 16 worksheet already takes Form 4952 line 4g, so the answer changes no
       * tax figure.
       */
      "1.line.20_use_qual_div_worksheet_yes": (form, info) => {
        const simple = qualifiedDividendsWorksheetApplies(form, info);
        return line20Gap(info) ?? (simple === true ? true : undefined);
      },
      "1.line.20_use_qual_div_worksheet_no": (form, info) => {
        const simple = qualifiedDividendsWorksheetApplies(form, info);
        return line20Gap(info) ?? (simple === false ? true : undefined);
      },
      // MANUAL EDIT: a K-1's net short-term and long-term gain (irs-1041k1-inst-2025::sec::boxes-3-and-4a-net-short-term-and-net::b01).
      "0.line.5_net_short_term_passthrough": (_, info) =>
        roundedWithReceived(undefined, info.passThroughShortTermGain),
      "0.line.12_net_long_term_passthrough": (_, info) =>
        roundedWithReceived(undefined, info.passThroughLongTermGain),
      "1.line.18_rate_gain_worksheet_amount": (_, info) =>
        worksheetLine(info.passThrough28RateGain, WORKSHEETS.line18),
      "1.line.19_unrecaptured_sec1250_gain": line19,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: line 6 is entered in parentheses: it reduces line 7.
      "0.line.7_net_short_term_gain_loss": (form) =>
        sum(
          form["0.line.1a_gain_loss"],
          form["0.line.1b_gain_loss"],
          form["0.line.2_gain_loss"],
          form["0.line.3_gain_loss"],
          form["0.line.4_short_term_gain_other_forms"],
          form["0.line.5_net_short_term_passthrough"],
        ) - sum(form["0.line.6_short_term_loss_carryover"]),
      // MANUAL EDIT: line 14 is entered in parentheses: it reduces line 15.
      "0.line.15_net_long_term_gain_loss": (form) =>
        sum(
          form["0.line.8a_gain_loss"],
          form["0.line.8b_gain_loss"],
          form["0.line.9_gain_loss"],
          form["0.line.10_gain_loss"],
          form["0.line.11_long_term_gain_other_forms"],
          form["0.line.12_net_long_term_passthrough"],
          form["0.line.13_capital_gain_distributions"],
        ) - sum(form["0.line.14_long_term_loss_carryover"]),
      "0.line.4_short_term_gain_other_forms": (form, info) =>
        otherFormsLine(form, info, OTHER_FORMS.line4),
      "0.line.11_long_term_gain_other_forms": line11,
      "1.line.16_combined_gain_loss": (form) =>
        sum(form["0.line.7_net_short_term_gain_loss"], form["0.line.15_net_long_term_gain_loss"]),
      /*
       * MANUAL EDIT: routed to the FilingInfo slot (sum of 1099-DIV box 2a), plus
       * each Form 8814 line 10 (irs-8814-inst-2025::sec::line-10::b01, ::line-3::b06).
       */
      "0.line.13_capital_gain_distributions": (_, info) =>
        withForm8814(
          info.form8814Totals,
          roundDollars(info.capitalGainDistributions),
          (figured) => figured.line10,
        ),
      // MANUAL EDIT: a loss on line 16, limited to $3,000 ($1,500 MFS), as a positive amount.
      "1.line.21_allowable_loss": (form, info) =>
        allowableLoss(form["1.line.16_combined_gain_loss"], info.filingStatus),
      // MANUAL EDIT: last year's carryovers, as positive amounts (the form prints the parentheses).
      "0.line.6_short_term_loss_carryover": (_, info) => roundDollars(info.shortTermLossCarryover),
      "0.line.14_long_term_loss_carryover": (_, info) => roundDollars(info.longTermLossCarryover),
      "1.line.22_qualified_dividends_yes": (form) =>
        qualifiedDividendsAnswer(form) === true ? true : undefined,
      "1.line.22_qualified_dividends_no": (form) =>
        qualifiedDividendsAnswer(form) === false ? true : undefined,
    },

    unsupported: {
      "0.line.1b_adjustments":
        "Schedule D line 1b col (g) — depends on Form 8949 Part I adjustments, which aren't modeled yet.",
      "0.line.8a_gain_loss":
        "Schedule D Part II line 8a (long-term trades bypassing Form 8949) — no fact-level flag distinguishes long-term bypass from short-term bypass.",
      "0.line.8b_adjustments":
        "Schedule D line 8b col (g) — depends on Form 8949 Part II adjustments, which aren't modeled yet.",
      "0.header.qof_disposal_yes":
        "No QOF (Qualified Opportunity Fund) disposal fact or decision has been ingested yet; no scenario modeled.",
      "0.header.qof_disposal_no":
        "No QOF disposal decision available; this is the complement of qof_disposal_yes and would require the same missing decision key.",
      "0.line.1a_cost":
        "No fact key exists for aggregated short-term cost basis on 1099-B/DA transactions where basis was reported to IRS with no adjustments (the line 1a bypass bucket). Needs new fact ingestion path.",
      "0.line.2_adjustments":
        "Requires summing column (g) adjustments only for Form 8949 Part I transactions with Box B or H checked; engine lacks per-box-type filtered aggregation.",
      "0.line.3_adjustments":
        "Requires summing column (g) adjustments only for Form 8949 Part I transactions with Box C or I checked; engine lacks per-box-type filtered aggregation.",
      "0.line.8a_proceeds":
        "Line 8a covers long-term trades that bypass Form 8949 (basis IRS-reported, no adjustments). No fact-level flag distinguishes long-term bypass trades from short-term bypass trades — sumFacts cannot filter by the form_8949_box decision. Bind when a decision-filtered sum rule is available.",
      "0.line.8a_cost":
        "Line 8a covers long-term trades that bypass Form 8949 (basis IRS-reported, no adjustments). No fact-level flag distinguishes long-term bypass trades from short-term bypass trades — sumFacts cannot filter by the form_8949_box decision.",
      "0.line.9_adjustments":
        "Form 8949 Part II has only one aggregate totals row with no per-box (E/K) breakdown. The engine cannot isolate adjustments for box E or box K transactions until 8949 ingests per-box totals.",
      "0.line.10_adjustments":
        "Form 8949 Part II has only one aggregate totals row with no per-box (F/L) breakdown. The engine cannot isolate adjustments for box F or box L transactions until 8949 ingests per-box totals.",
      "1.line.17_both_gains_no":
        "This boolean is true when line 15 or line 16 is NOT a gain (i.e., zero or negative). Requires a conditional-comparison rule not yet in the library.",
      "0.line.1a_proceeds":
        "confidence=low: Line 1a aggregates short-term proceeds for 1099-B/DA transactions where basis was reported and no adjustments needed; however, no fact fieldPath exists for this sub-bucket — unsupported until fact schema is extended.",
      "0.line.1a_gain_loss":
        "confidence=medium: Line 1a gain/loss is proceeds minus cost basis; computed from the two sibling fields on this line.",
    },
  });
}
