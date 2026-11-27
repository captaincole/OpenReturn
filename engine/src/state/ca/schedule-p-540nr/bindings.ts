/*
 * Schedule P (540NR). Every field of the catalog gets its rule here:
 * - Part I, lines 22 to 24 and Part III: Schedule P (540)'s rule of the same
 *   line (fromScheduleP.ts), with the gap of a form the engine figures for
 *   Form 540 only when this return needs it (FTB 3526 on lines 7 and 14, the
 *   credit forms on the Part III rows, partIII.ts).
 * - Part II lines 25 to 45 (partII.ts) and Part III lines 1, 2 and 22.
 * - Line 29's other items, and lines 27 and 31, have the reason of the Part I
 *   line they take the California part of.
 */

import { defineForm, type FormSpec } from "../../../defineForm.js";
import { unsupported } from "../../../types.js";
import { gapFor } from "../540nr/form540NRBinding.js";
import { SCHEDULE_P_BINDINGS, SCHEDULE_P_UNSUPPORTED } from "../schedule-p/bindings.js";
import type { ScheduleP } from "../schedule-p/types.js";
import catalog from "./catalog.json";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";
import {
  fromScheduleP,
  scheduleP540FieldOf,
  type Bind,
  type SchedulePMethod,
} from "./fromScheduleP.js";
import { PART_II_BINDINGS, ftb3526Gap } from "./partII.js";
import { PART_III_BINDINGS, PART_III_UNSUPPORTED, creditFormsOf } from "./partIII.js";
import type { ScheduleP540NR } from "./types.js";

type Spec = FormSpec<ScheduleP540NR, ScheduleP540NRFilingInfo>;

const FORM_PREFIX = "schedule-p-540nr.";

/* Part I lines that read FTB 3526 (line 7, and line 14, which adds it), for a return that itemizes. */
const READS_FTB_3526: readonly string[] = [
  "0.line.7_investment_interest_adjustment",
  "0.line.14_total_adjustments_preferences",
];

/*
 * Part II lines that take the California part of a Part I line the engine
 * does not figure: the Part I line's reason. Line 29a and 29d have rules
 * (partII.ts), as Part I lines 7 and 10 do.
 */
const CALIFORNIA_PART_OF: Readonly<Record<string, keyof ScheduleP>> = {
  "1.line.27_amti_exclusion": "0.line.17_amti_exclusion",
  "1.line.29b_post_1986_depreciation": "0.line.8_post_1986_depreciation",
  "1.line.29c_adjusted_gain_loss": "0.line.9_adjusted_gain_loss",
  "1.line.29e_passive_activities": "0.line.11_passive_activities_adjustment",
  "1.line.29f_estate_trust_beneficiaries": "0.line.12_estate_trust_beneficiaries",
  "1.line.29g_circulation_expenditures": "0.line.13a_circulation_expenditures",
  "1.line.29h_depletion": "0.line.13b_depletion",
  "1.line.29i_installment_sales": "0.line.13c_installment_sales",
  "1.line.29j_intangible_drilling_costs": "0.line.13d_intangible_drilling_costs",
  "1.line.29k_long_term_contracts": "0.line.13e_long_term_contracts",
  "1.line.29l_loss_limitations": "0.line.13f_loss_limitations",
  "1.line.29m_mining_costs": "0.line.13g_mining_costs",
  "1.line.29n_patrons_adjustment": "0.line.13h_patrons_adjustment",
  "1.line.29o_pollution_control_facilities": "0.line.13i_pollution_control_facilities",
  "1.line.29p_research_experimental": "0.line.13j_research_experimental",
  "1.line.29q_tax_shelter_farm_activities": "0.line.13k_tax_shelter_farm_activities",
  "1.line.29r_related_adjustments": "0.line.13l_related_adjustments",
  "1.line.31_california_amt_nol_deduction": "1.line.20_amt_nol_deduction",
};

/* "0.line.13a_circulation_expenditures" → "13a". */
const LINE_MARK = ".line.";
function partILine(field540: string): string {
  const rest = field540.slice(field540.indexOf(LINE_MARK) + LINE_MARK.length);
  return rest.slice(0, rest.indexOf("_"));
}

type Rule = { bind: Bind } | { unsupported: string };

function californiaPartRule(field: string): Rule | undefined {
  const partI = CALIFORNIA_PART_OF[field];
  if (partI === undefined) return undefined;
  const reason = SCHEDULE_P_UNSUPPORTED[partI];
  if (reason === undefined) throw new Error(`Schedule P (540) ${partI} has no reason.`);
  return { unsupported: `The California part of Part I line ${partILine(partI)}. ${reason}` };
}

/* Schedule P (540)'s rule of the same line, or its reason. */
function scheduleP540Rule(field: string): Rule | undefined {
  const field540 = scheduleP540FieldOf(field);
  if (field540 === undefined) return undefined;
  const method = SCHEDULE_P_BINDINGS[field540] as SchedulePMethod | undefined;
  if (method) return { bind: fromScheduleP(method) };
  const reason = SCHEDULE_P_UNSUPPORTED[field540];
  return reason === undefined ? undefined : { unsupported: reason };
}

/* A rule, with the gap of a Form 540-only form the field takes first. */
function withGap(rule: Rule, gap: Bind): Rule {
  return {
    bind: (form, info) =>
      gap(form, info) ?? ("bind" in rule ? rule.bind(form, info) : unsupported(rule.unsupported)),
  };
}

/* The gap a field takes first: FTB 3526 for an itemizer (partII.ts), or its credit forms. */
function gapOf(field: string): Bind | undefined {
  if (READS_FTB_3526.includes(field)) return ftb3526Gap;
  const forms = creditFormsOf(field);
  return forms.length === 0 ? undefined : (_, info) => gapFor(info, ...forms);
}

function ruleOf(field: string): Rule {
  const own = PART_II_BINDINGS[field] ?? PART_III_BINDINGS[field];
  if (own) return { bind: own };
  const reason = PART_III_UNSUPPORTED[field];
  if (reason !== undefined) return { unsupported: reason };
  const rule = californiaPartRule(field) ?? scheduleP540Rule(field);
  if (rule === undefined) throw new Error(`Schedule P (540NR) ${field} has no rule.`);
  const gap = gapOf(field);
  return gap === undefined ? rule : withGap(rule, gap);
}

function specOf(): Pick<Spec, "bindings" | "unsupported"> {
  const bindings: Record<string, Bind> = {};
  const unsupportedFields: Record<string, string> = {};
  for (const { fieldId } of catalog.fields) {
    const field = fieldId.slice(FORM_PREFIX.length);
    const rule = ruleOf(field);
    if ("bind" in rule) bindings[field] = rule.bind;
    else unsupportedFields[field] = rule.unsupported;
  }
  return { bindings: bindings as Spec["bindings"], unsupported: unsupportedFields };
}

export function register(): void {
  defineForm<ScheduleP540NR, ScheduleP540NRFilingInfo>("schedule-p-540nr", specOf());
}
