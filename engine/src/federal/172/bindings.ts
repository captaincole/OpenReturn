/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { Phone, SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { partILinesOf } from "./figures.js";
import type { Amount, PartILines } from "./lines.js";
import { partIIBindings } from "./partIIBindings.js";
import type { Info, Read } from "./reads.js";
import type { Form172 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form172]: BindingFn<Form172, Info, K> }>;

/* MANUAL EDIT: a Part I line, from one computation (figures.ts, lines.ts); blank while it waits or when skipped. */
function partILine(pick: (lines: PartILines) => Amount | undefined) {
  return (form: Read, info: Info): Amount | undefined => {
    const lines = partILinesOf(form, info);
    return lines === undefined ? undefined : pick(lines);
  };
}

const PART_I: Bindings = {
  "0.part1.1_agi_less_deductions": partILine((lines) => lines.line1),
  "0.part1.2_nonbusiness_capital_losses": partILine((lines) => lines.line2),
  "0.part1.3_nonbusiness_capital_gains": partILine((lines) => lines.line3),
  "0.part1.4_excess_nonbusiness_capital_loss": partILine((lines) => lines.line4),
  "0.part1.5_excess_nonbusiness_capital_gain": partILine((lines) => lines.line5),
  "0.part1.6_nonbusiness_deductions": partILine((lines) => lines.line6),
  "0.part1.7_nonbusiness_income_other": partILine((lines) => lines.line7),
  "0.part1.8_add_lines_5_7": partILine((lines) => lines.line8),
  "0.part1.9_excess_nonbusiness_deductions": partILine((lines) => lines.line9),
  "0.part1.10_excess_nonbusiness_income": partILine((lines) => lines.line10),
  "0.part1.11_business_capital_losses": partILine((lines) => lines.line11),
  "0.part1.12_business_capital_gains": partILine((lines) => lines.line12),
  "0.part1.13_add_lines_10_12": partILine((lines) => lines.line13),
  "0.part1.14_excess_business_capital_loss": partILine((lines) => lines.line14),
  "0.part1.15_add_lines_4_14": partILine((lines) => lines.line15),
  "0.part1.16_schedule_d_net_loss": partILine((lines) => lines.line16),
  "0.part1.17_section_1202_exclusion": partILine((lines) => lines.line17),
  "0.part1.18_line16_less_line17": partILine((lines) => lines.line18),
  "0.part1.19_allowed_capital_loss": partILine((lines) => lines.line19),
  "0.part1.20_line18_over_line19": partILine((lines) => lines.line20),
  "0.part1.21_line19_over_line18": partILine((lines) => lines.line21),
  "0.part1.22_line15_less_line20": partILine((lines) => lines.line22),
  "0.part1.23_nol_deduction_other_years": partILine((lines) => lines.line23),
  "0.part1.24_net_operating_loss": partILine((lines) => lines.line24),
};

const files = (info: Info) => info.form172 !== undefined;
const joint = (info: Info) => info.filingStatus === "married_filing_jointly";

/*
 * MANUAL EDIT: the heading (irs-172-inst-2025::sec::specific-instructions::b01):
 * "enter the calendar year or other tax year you are using". The engine
 * prepares calendar-year returns, so the fiscal-year spaces are a gap. The
 * address and phone are the return's; the spouse's SSN prints on a joint return.
 */
const HEADER: Bindings = {
  "0.header.calendar_year": (_, info) => (files(info) ? "2025" : undefined),
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.ssn_or_ein": (_, info) => info.taxpayerSSN,
  "0.header.address_street": (_, info) => info.homeAddressLine1,
  "0.header.address_apt": (_, info) => info.homeAddressApt,
  "0.header.spouse_ssn": (_, info) => (joint(info) ? info.spouseSSN : undefined),
  "0.header.address_city": (_, info) => info.homeAddressCity,
  "0.header.address_state": (_, info) => info.homeAddressState,
  "0.header.address_zip": (_, info) => info.homeAddressZip,
  "0.header.daytime_phone": (_, info) => info.taxpayerPhone,
};

const FISCAL_YEAR =
  "Only a fiscal-year filer fills it; the engine prepares calendar-year returns, and no fact holds a fiscal year.";
const FOREIGN_ADDRESS = "No fact holds a foreign address; the engine models U.S. addresses only.";

export function register(): void {
  defineForm<Form172, Info>("form-172", {
    bindings: { ...HEADER, ...PART_I, ...partIIBindings() },

    formatters: {
      "0.header.ssn_or_ein": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.header.spouse_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.header.daytime_phone": (value) =>
        Phone.format(value as Parameters<typeof Phone.format>[0]),
    },

    unsupported: {
      "0.header.tax_year_beginning": FISCAL_YEAR,
      "0.header.tax_year_ending": FISCAL_YEAR,
      "0.header.foreign_country": FOREIGN_ADDRESS,
      "0.header.foreign_province": FOREIGN_ADDRESS,
      "0.header.foreign_postal_code": FOREIGN_ADDRESS,
    },
  });
}
