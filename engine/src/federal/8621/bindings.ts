/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. One copy for each fund that files (totals.ts);
 * the arithmetic is lines.ts, line15.ts, line16.ts and partVI.ts. This file
 * holds the header, Part I and Part II; partBindings.ts holds Parts III to VI.
 */

import { defineForm } from "../../defineForm.js";
import type { PficElections } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { yearEndValueUsd } from "./currency.js";
import type { Form8621FilingInfo } from "./filingInfo.js";
import { section1291Amount, section1293Amount, section1296Amount } from "./fund.js";
import {
  bracketedLoss,
  checked,
  fundLine,
  fundOf,
  monthDayYear,
  type Bindings,
} from "./fundLine.js";
import { TAX_YEAR } from "./line15.js";
import { valueBox, type ValueBox } from "./lines.js";
import { partBindings } from "./partBindings.js";
import type { Form8621 } from "./types.js";

const YEAR_IN_CENTURY = String(TAX_YEAR).slice(2);
const EXCEPTED_ASSETS_UNKNOWN =
  "Form 8938 files; whether it counts this Form 8621 on its Part IV line 4 is not modeled (irs-8621-inst-2025::sec::excepted-specified-foreign-financial::b01).";

/* The shareholder's lines: the return's names, SSN and home address. */
const shareholderBindings: Bindings = {
  // ::part-i::b01: "Shareholders filing a joint return may file a single Form 8621": both names.
  "0.header.shareholder_name": (_, info) => (fundOf(info) ? namesOnReturn(info) : undefined),
  // ::address-and-identifying-number::b01: an individual enters a social security number.
  "0.header.identifying_number": (_, info) => (fundOf(info) ? info.taxpayerSSN : undefined),
  "0.header.shareholder_street_address": (_, info) =>
    fundOf(info) ? info.homeAddressLine1 : undefined,
  "0.header.shareholder_room_suite": (_, info) => (fundOf(info) ? info.homeAddressApt : undefined),
  "0.header.shareholder_city": (_, info) => (fundOf(info) ? info.homeAddressCity : undefined),
  "0.header.shareholder_state_province": (_, info) =>
    fundOf(info) ? info.homeAddressState : undefined,
  // The engine's home address is in the United States: the country box is for a foreign address.
  "0.header.shareholder_country": () => undefined,
  "0.header.shareholder_zip_postal_code": (_, info) =>
    fundOf(info) ? info.homeAddressZip : undefined,
  // An individual's 2025 return is a calendar year: the other-year boxes stay blank.
  "0.header.shareholder_tax_year_calendar_year": (_, info) =>
    fundOf(info) ? YEAR_IN_CENTURY : undefined,
  "0.header.shareholder_tax_year_begin_month_day": () => undefined,
  "0.header.shareholder_tax_year_begin_year": () => undefined,
  "0.header.shareholder_tax_year_end_month_day": () => undefined,
  "0.header.shareholder_tax_year_end_year": () => undefined,
  "0.header.shareholder_type_individual": (_, info) => (fundOf(info) ? true : undefined),
  "0.header.shareholder_type_corporation": () => undefined,
  "0.header.shareholder_type_partnership": () => undefined,
  "0.header.shareholder_type_s_corporation": () => undefined,
  "0.header.shareholder_type_nongrantor_trust": () => undefined,
  "0.header.shareholder_type_estate": () => undefined,
  // ::excepted-specified-foreign-financial::b01: "only if the Form 8621 filer also files Form 8938".
  "0.header.excepted_specified_foreign_assets": (_, info) =>
    fundOf(info) && info.mustFile?.["form-8938"]?.value === true
      ? unsupported(EXCEPTED_ASSETS_UNKNOWN)
      : undefined,
  // ::election-to-be-treated-as-a-qualifying::b04: "Check the box on page 1".
  "0.header.qualifying_insurance_corporation_election": fundLine((fund) =>
    checked(fund.fact.qualifyingInsuranceElection),
  ),
};

/* "Tax year of foreign corporation": the calendar year, or the fund's other year. */
const otherYear = (iso: string | undefined, part: "monthDay" | "year") => {
  if (iso === undefined) return undefined;
  const [year, month, day] = iso.split("-");
  return part === "year" ? year.slice(2) : `${month}/${day}`;
};

const fundHeaderBindings: Bindings = {
  "0.header.pfic_name": fundLine((fund) => fund.fact.fundName),
  "0.header.pfic_ein": fundLine((fund) => fund.fact.fundEin),
  // ::address-and-identifying-number::b01: required only with no EIN; both are allowed.
  "0.header.pfic_reference_id_number": fundLine((fund) => fund.fact.referenceId),
  "0.header.pfic_address": fundLine((fund) => fund.fact.fundAddress),
  "0.header.pfic_tax_year_calendar_year": fundLine((fund) =>
    fund.fact.fundTaxYearBegin === undefined ? YEAR_IN_CENTURY : undefined,
  ),
  "0.header.pfic_tax_year_begin_month_day": fundLine((fund) =>
    otherYear(fund.fact.fundTaxYearBegin, "monthDay"),
  ),
  "0.header.pfic_tax_year_begin_year": fundLine((fund) =>
    otherYear(fund.fact.fundTaxYearBegin, "year"),
  ),
  "0.header.pfic_tax_year_end_month_day": fundLine((fund) =>
    otherYear(fund.fact.fundTaxYearEnd, "monthDay"),
  ),
  "0.header.pfic_tax_year_end_year": fundLine((fund) =>
    otherYear(fund.fact.fundTaxYearEnd, "year"),
  ),
};

/* Part I is left out for the qualifying insurance corporation election alone (::election-to-be-treated-as-a-qualifying::b04). */
const partILine = <V>(read: Parameters<typeof fundLine<V>>[0]) =>
  fundLine<V>((fund) => (fund.fact.qualifyingInsuranceElection === true ? undefined : read(fund)));

const valueBoxLine = (box: ValueBox) =>
  partILine((fund) => checked(valueBox(yearEndValueUsd(fund.fact)) === box));

const partIBindings: Bindings = {
  "0.line.1_share_class_description": partILine((fund) => fund.fact.shareClass),
  "0.line.1_shares_jointly_owned_spouse": partILine((fund) =>
    checked(fund.fact.jointlyOwnedWithSpouse),
  ),
  // ::line-2::b01: "the date during the tax year that the shares were acquired, if applicable".
  "0.line.2_date_shares_acquired": partILine((fund) =>
    fund.fact.acquiredDate.startsWith(`${TAX_YEAR}-`)
      ? monthDayYear(fund.fact.acquiredDate)
      : undefined,
  ),
  "0.line.3_shares_held_year_end": partILine((fund) => String(fund.fact.sharesAtYearEnd)),
  // ::line-4::b01: the value at the end of the year; above $200,000, line 4(e) lists it.
  "0.line.4a_share_value_0_to_50000": valueBoxLine("a"),
  "0.line.4b_share_value_50001_to_100000": valueBoxLine("b"),
  "0.line.4c_share_value_100001_to_150000": valueBoxLine("c"),
  "0.line.4d_share_value_150001_to_200000": valueBoxLine("d"),
  "0.line.4e_share_value_over_200000": partILine((fund) => {
    const value = yearEndValueUsd(fund.fact);
    return valueBox(value) === "e" ? roundDollars(value) : undefined;
  }),
  // ::line-5::b01: the type of PFIC and the amount under each section.
  "0.line.5a_section_1291_box": partILine((fund) => checked(fund.partV !== undefined)),
  "0.line.5a_section_1291_amount": partILine((fund) => {
    const amount = section1291Amount(fund.partV);
    return amount !== undefined && amount > 0 ? amount : undefined;
  }),
  "0.line.5b_section_1293_box": partILine((fund) => checked(fund.partIII !== undefined)),
  "0.line.5b_section_1293_amount": partILine((fund) => section1293Amount(fund.partIII)),
  "0.line.5c_section_1296_box": partILine((fund) => checked(fund.partIV !== undefined)),
  "0.line.5c_section_1296_amount": partILine((fund) => section1296Amount(fund.partIV)),
};

/* Part II: the elections made this year (the fund fact's elections). */
const election = (name: keyof PficElections) =>
  fundLine((fund) => checked(fund.fact.elections?.[name]));

const partIIBindings: Bindings = {
  "0.line.election_a_treat_pfic_as_qef": election("qef"),
  "0.line.election_b_extend_time_payment": election("extendTime"),
  "0.line.election_c_mark_to_market": election("markToMarket"),
  "0.line.election_d_deemed_sale": election("deemedSale"),
  "0.line.election_e_deemed_dividend": election("deemedDividend"),
  "0.line.election_f_gain_deemed_sale_pfic": election("formerPficDeemedSale"),
  "0.line.election_g_deemed_dividend_1297e_pfic": election("section1297eDeemedDividend"),
  "0.line.election_h_deemed_dividend_former_pfic": election("formerPficDeemedDividend"),
};

export function register(): void {
  defineForm<Form8621, Form8621FilingInfo>("form-8621", {
    bindings: {
      ...shareholderBindings,
      ...fundHeaderBindings,
      ...partIBindings,
      ...partIIBindings,
      ...partBindings,
    },
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.5c_section_1296_amount": bracketedLoss,
      "1.line.8e_undistributed_qef_earnings": bracketedLoss,
      "1.line.10c_mark_to_market_gain_loss": bracketedLoss,
      "1.line.12_mark_to_market_ordinary_loss": bracketedLoss,
      "1.line.13c_disposition_gain_loss": bracketedLoss,
      "1.line.14b_disposition_ordinary_loss": bracketedLoss,
      "1.line.14c_disposition_loss_over_inclusions": bracketedLoss,
      "2.line.15f_gain_or_loss_disposition": bracketedLoss,
    },
  });
}
