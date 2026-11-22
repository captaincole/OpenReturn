/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  excludedIncomeGap,
  line2Of,
  line4Of,
  partIReach,
  taxLimitOf,
  totalOver,
  type Accessor,
} from "./credit.js";
import type { Form8936FilingInfo } from "./filingInfo.js";
import { FILING_STATUS_CODES, businessTotal, type TaxLimitLines } from "./lines.js";
import type { VehicleOutcome } from "./scheduleA.js";
import type { Form8936 } from "./types.js";

type Info = Form8936FilingInfo;
type K1Code = "newVehicleCodeAY" | "commercialCodeAZ";

/* Lines 1a–2 print once a vehicle reaches Schedule A line 8c or 13b; lines 3a–5 once one reaches 8d or 13c. */
const reaches = (form: Accessor, info: Info, step: number) => partIReach(form, info) >= step;

function part2025(form: Accessor, info: Info, pick: "line1a" | "line1b" | "line2") {
  if (!reaches(form, info, 1)) return undefined;
  return line2Of(form, info)?.[pick];
}

function part2024(form: Accessor, info: Info, pick: keyof NonNullable<ReturnType<typeof line4Of>>) {
  if (!reaches(form, info, 2)) return undefined;
  return line4Of(info)?.[pick];
}

const line6Of = (form: Accessor, info: Info) =>
  totalOver(form, info, (outcome) => (outcome.kind === "new" ? outcome.line11 : undefined));
const line19Of = (form: Accessor, info: Info) =>
  totalOver(form, info, (outcome) => (outcome.kind === "commercial" ? outcome.line26 : undefined));

/* Lines 7–8 or 20–21: the K-1 credit joins only a line 6 (19) that is used. */
function business(
  form: Accessor,
  info: Info,
  vehicles: (form: Accessor, info: Info) => ReturnType<typeof totalOver>,
  code: K1Code,
  pick: "fromK1" | "total",
) {
  const total = vehicles(form, info);
  if (typeof total === "object") return total;
  return businessTotal(total, info.cleanVehicleAnswers?.k1Credits?.[code])[pick];
}

function limitLine(form: Accessor, info: Info, part: "III" | "IV", pick: keyof TaxLimitLines) {
  const lines = taxLimitOf(form, info, part);
  if (lines === undefined || "unsupported" in lines) return lines;
  return lines[pick];
}

const pickOutcome =
  (pick: (outcome: VehicleOutcome) => number | undefined) => (form: Accessor, info: Info) =>
    totalOver(form, info, pick);

export function register(): void {
  defineForm<Form8936, Form8936FilingInfo>("form-8936", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Part I (blank form; irs-8936-inst-2025::sec::lines-1a-and-3a::b01).
      "0.line.1a_2025_form_1040_line_11a": (form, info) => part2025(form, info, "line1a"),
      "0.line.1b_2025_puerto_rico_income_excluded": (form, info) => part2025(form, info, "line1b"),
      "0.line.1c_2025_form_2555_line_45": (form, info) =>
        reaches(form, info, 1) ? excludedIncomeGap(info, "2555") : undefined,
      "0.line.1d_2025_form_2555_line_50": (form, info) =>
        reaches(form, info, 1) ? excludedIncomeGap(info, "2555") : undefined,
      "0.line.1e_2025_form_4563_line_15": (form, info) =>
        reaches(form, info, 1) ? excludedIncomeGap(info, "4563") : undefined,
      "0.line.2_2025_magi": (form, info) => {
        if (!reaches(form, info, 1)) return undefined;
        const gap = excludedIncomeGap(info, "2555") ?? excludedIncomeGap(info, "4563");
        return gap ?? line2Of(form, info)?.line2;
      },
      "0.line.3a_2024_form_1040_line_11": (form, info) => part2024(form, info, "agi"),
      "0.line.3b_2024_puerto_rico_income_excluded": (form, info) =>
        part2024(form, info, "puertoRicoExcluded"),
      "0.line.3c_2024_form_2555_line_45": (form, info) => part2024(form, info, "form2555Line45"),
      "0.line.3d_2024_form_2555_line_50": (form, info) => part2024(form, info, "form2555Line50"),
      "0.line.3e_2024_form_4563_line_15": (form, info) => part2024(form, info, "form4563Line15"),
      "0.line.4_2024_magi": (form, info) => part2024(form, info, "line4"),
      "0.line.5_2024_filing_status": (form, info) => {
        const status = info.cleanVehicleAnswers?.status2024;
        return reaches(form, info, 2) && status ? FILING_STATUS_CODES[status] : undefined;
      },
      // MANUAL EDIT: Part II, Schedule A line 11 of each vehicle (part-ii-credit-for-business::b01).
      "0.line.6_business_use_credit_schedule_a": (form, info) => line6Of(form, info),
      "0.line.7_new_vehicle_credit_partnerships_s_corps": (form, info) =>
        business(form, info, line6Of, "newVehicleCodeAY", "fromK1"),
      "0.line.8_business_investment_use_credit": (form, info) =>
        business(form, info, line6Of, "newVehicleCodeAY", "total"),
      // MANUAL EDIT: Part III (line-11::b01, line-13::b01).
      "0.line.9_personal_use_credit_schedule_a": pickOutcome((outcome) =>
        outcome.kind === "new" ? outcome.line12 : undefined,
      ),
      "0.line.10_form_1040_line_18": (form, info) => limitLine(form, info, "III", "tax"),
      "0.line.11_personal_credits_form_1040": (form, info) =>
        limitLine(form, info, "III", "credits"),
      "0.line.12_tax_less_personal_credits": (form, info) => limitLine(form, info, "III", "room"),
      "0.line.13_personal_use_credit": (form, info) => limitLine(form, info, "III", "credit"),
      // MANUAL EDIT: Part IV (part-iv-credit-for-previously-owned::b01, line-18::b01).
      "0.line.14_previously_owned_credit_schedule_a": pickOutcome((outcome) =>
        outcome.kind === "previously_owned" ? outcome.line17 : undefined,
      ),
      "0.line.15_form_1040_line_18": (form, info) => limitLine(form, info, "IV", "tax"),
      "0.line.16_personal_credits_form_1040": (form, info) =>
        limitLine(form, info, "IV", "credits"),
      "0.line.17_tax_less_personal_credits": (form, info) => limitLine(form, info, "IV", "room"),
      "0.line.18_previously_owned_vehicle_credit": (form, info) =>
        limitLine(form, info, "IV", "credit"),
      // MANUAL EDIT: Part V, Schedule A line 26 of each vehicle (part-v-credit-for-qualified::b01).
      "0.line.19_commercial_vehicle_credit_schedule_a": (form, info) => line19Of(form, info),
      "0.line.20_commercial_credit_partnerships_s_corps": (form, info) =>
        business(form, info, line19Of, "commercialCodeAZ", "fromK1"),
      "0.line.21_commercial_vehicle_credit_total": (form, info) =>
        business(form, info, line19Of, "commercialCodeAZ", "total"),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
