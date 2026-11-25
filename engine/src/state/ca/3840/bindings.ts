/* FTB 3840 rules, written by hand from ca-3840-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import type { CaExchangePropertyPlace } from "../../../facts/index.js";
import { printedDate } from "../../../federal/4797/dates.js";
import { line5Date } from "../../../federal/8824/describe.js";
import { yearOf } from "../../../federal/8824/lines.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { Phone, SSN, ssnOf } from "../../../values.js";
import { filingTypeOf } from "./exchange.js";
import type { Form3840FilingInfo } from "./filingInfo.js";
import { APPORTIONMENT_DECIMALS, OWNERSHIP_DECIMALS, percentBoxes } from "./lines.js";
import {
  californiaLine,
  exchangeLine,
  federalLine,
  line8,
  realizedLine,
  recognizedLine,
  scheduleALine,
  yesNo,
  type LineFn,
} from "./selectors.js";
import type { Form3840 } from "./types.js";

type Info = Form3840FilingInfo;
type Bindings = Partial<{ [K in keyof Form3840]: BindingFn<Form3840, Info, K> }>;

/* The engine prepares an individual's calendar-year return: the entity and fiscal-year boxes stay blank. */
const blank = () => undefined;

const joint = (info: Info) => info.filingStatus === "married_filing_jointly";

/*
 * The signature area: "If form FTB 3840 is attached to a California tax return,
 * no signature is needed. If form FTB 3840 is filed separately, sign and
 * complete the signature area" (ca-3840-inst-2025::sec::e-signature::b01).
 */
const SIGNED_BY_HAND =
  "FTB 3840 filed separately is dated when the taxpayer signs it (ca-3840-inst-2025::sec::e-signature::b01); no fact holds that date.";
const NO_SPOUSE_PHONE =
  "FTB 3840 filed separately on a joint return: the spouse signs too, and no fact holds the spouse's phone.";
const separately =
  <T>(pick: (info: Info) => T | Unsupported | undefined) =>
  (_: unknown, info: Info) =>
    info.form3840Attached ? undefined : pick(info);

/* Question C: the related party's SSN, ITIN or FEIN, nine digits. */
const NUMBER_NOT_NINE_DIGITS =
  "The related party's identifying number is not nine digits (Question C, ca-3840-inst-2025::sec::general-question-a-through-question-c::b03).";

/* Schedule A line 1, row A, or line 9, row D: the one property given up, and the one received. */
const placeLines = (row: "1a" | "9d", side: "givenUp" | "received") => {
  const place = (pick: (place: CaExchangePropertyPlace) => string | undefined) =>
    californiaLine((california) => pick(california[side]));
  return {
    [`1.line.${row}_in_california`]: place((each) => yesNo(each.inCalifornia)),
    [`1.line.${row}_ownership_percentage`]: place((each) =>
      percentBoxes(each.ownershipPercent, OWNERSHIP_DECIMALS),
    ),
    [`1.line.${row}_property_address`]: place((each) => each.address),
    [`1.line.${row}_city`]: place((each) => each.city),
    [`1.line.${row}_state`]: place((each) => each.state),
    [`1.line.${row}_zip`]: place((each) => each.zip),
  } as Record<string, LineFn<string>> as Bindings;
};

/*
 * Rows B, C (given up) and E, F (received), and their columns: an exchange fact
 * describes one property given up and one received, so each is blank. More
 * properties are a multi-asset exchange the facts cannot describe (QUESTIONS.md).
 */
const OTHER_ROWS = ["1b", "1c", "9e", "9f"].flatMap((row) =>
  ["in_california", "ownership_percentage", "property_address", "city", "state", "zip"].map(
    (part) => `1.line.${row}_${part}`,
  ),
);
const OTHER_COLUMNS = [
  "1.line.2_prior_deferred_exchange_col_b",
  "1.line.2_prior_deferred_exchange_col_c",
  ...["3_consideration_sales_price", "4_selling_expenses", "5_amount_realized"].flatMap((line) => [
    `1.line.${line}_col_b`,
    `1.line.${line}_col_c`,
  ]),
  ...["6_california_adjusted_basis", "7_realized_gain_loss"].flatMap((line) => [
    `1.line.${line}_col_b`,
    `1.line.${line}_col_c`,
  ]),
  "1.line.10_allocation_deferred_gain_col_e",
  "1.line.10_allocation_deferred_gain_col_f",
];
const blankRows = Object.fromEntries(
  [...OTHER_ROWS, ...OTHER_COLUMNS].map((id) => [id, blank]),
) as Bindings;

export function register(): void {
  defineForm<Form3840, Info>("form-3840", {
    bindings: {
      ...blankRows,
      ...placeLines("1a", "givenUp"),
      ...placeLines("9d", "received"),

      // Header (ca-3840-inst-2025::sec::specific-instructions::b01): name, number and address.
      "0.header.fiscal_year_beginning": blank,
      "0.header.fiscal_year_ending": blank,
      "0.header.name": (_, info) => namesOnReturn(info),
      "0.header.california_corporation_number": blank,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.header.spouse_ssn": (_, info) => (joint(info) ? info.spouseSSN : undefined),
      "0.header.fein": blank,
      // For an "In-Care-Of" name only (additional-information::b01): the address facts hold none.
      "0.header.additional_information": blank,
      "0.header.secretary_of_state_file_number": blank,
      "0.header.street_address": (_, info) =>
        info.homeAddressLine1 && info.homeAddressApt
          ? `${info.homeAddressLine1} ${info.homeAddressApt}`
          : info.homeAddressLine1,
      // The street address fact holds a private mailbox number; no foreign address facts exist.
      "0.header.private_mailbox": blank,
      "0.header.city": (_, info) => info.homeAddressCity,
      "0.header.state": (_, info) => info.homeAddressState,
      "0.header.zip": (_, info) => info.homeAddressZip,
      "0.header.foreign_country_name": blank,
      "0.header.foreign_province_state_county": blank,
      "0.header.foreign_postal_code": blank,

      // Questions A–C (general-question-a-through-question-c::b01–b03).
      "0.header.a_taxpayer_type": () => "individual",
      "0.header.b_filing_type": exchangeLine((exchange) => filingTypeOf(exchange)),
      "0.header.b_exchange_taxable_year": exchangeLine((exchange) => {
        const type = filingTypeOf(exchange);
        if (type === undefined || exchange.federal === undefined) return undefined;
        return type === "initial"
          ? undefined
          : String(yearOf(exchange.federal.givenUp.dateTransferred));
      }),
      "0.header.c_exchange_involves": federalLine((federal) =>
        federal.relatedParty ? "related_party" : "real_property",
      ),
      "0.header.c_related_party_name": federalLine((federal) => federal.relatedParty?.name),
      "0.header.c_related_party_tin": federalLine((federal) => {
        const stated = federal.relatedParty?.identifyingNumber;
        if (stated === undefined) return undefined;
        return ssnOf(stated) ?? unsupported(NUMBER_NOT_NINE_DIGITS);
      }),

      // Part I: Form 8824 lines 1–6 (part-i-information-on-like-kind-exchange::b01).
      "0.line.1_property_given_up_description": federalLine(
        (federal) => federal.givenUp.description,
      ),
      "0.line.2_property_received_description": federalLine(
        (federal) => federal.received.description,
      ),
      "0.line.3_date_given_up_property_acquired": federalLine((federal) =>
        printedDate(federal.givenUp.dateAcquired),
      ),
      "0.line.4_date_property_transferred": federalLine((federal) =>
        printedDate(federal.givenUp.dateTransferred),
      ),
      "0.line.5_date_received_property_identified": federalLine((federal) => {
        const date = line5Date(federal);
        return date === undefined ? undefined : printedDate(date);
      }),
      "0.line.6_date_property_received": federalLine((federal) =>
        printedDate(federal.received.dateReceived),
      ),

      // Part II: Form 8824 lines 12–25 on lines 7–20 (lines.ts FORM_8824_LINE_OFFSET).
      "0.line.7_fmv_other_property_given_up": realizedLine((lines) => lines.line12),
      "0.line.8_adjusted_basis_other_property": realizedLine((lines) => lines.line13),
      "0.line.9_gain_loss_other_property": realizedLine((lines) => lines.line14),
      "0.line.10_cash_and_other_property_received": realizedLine((lines) => lines.line15),
      "0.line.11_fmv_like_kind_property_received": realizedLine((lines) => lines.line16),
      "0.line.12_total_amount_received": realizedLine((lines) => lines.line17),
      "0.line.13_adjusted_basis_like_kind_given_up": realizedLine((lines) => lines.line18),
      "0.line.14_realized_gain_loss": realizedLine((lines) => lines.line19),
      "0.line.15_smaller_of_line_10_or_14": realizedLine((lines) => lines.line20),
      "0.line.16_ordinary_income_recapture": recognizedLine((lines) => lines.line21),
      "0.line.17_line_15_minus_line_16": recognizedLine((lines) => lines.line22),
      "0.line.18_recognized_gain": recognizedLine((lines) => lines.line23),
      "0.line.19_deferred_gain_loss": recognizedLine((lines) => lines.line24),
      "0.line.20_basis_like_kind_property_received": recognizedLine((lines) => lines.line25),

      "0.signing.date_signed": separately(() => unsupported(SIGNED_BY_HAND)),
      "0.signing.taxpayer_phone": separately((info) => info.taxpayerPhone),
      "0.signing.spouse_date_signed": separately((info) =>
        joint(info) ? unsupported(SIGNED_BY_HAND) : undefined,
      ),
      "0.signing.spouse_phone": separately((info) =>
        joint(info) ? unsupported(NO_SPOUSE_PHONE) : undefined,
      ),
      // An individual signs for herself: the representative and firm lines are for an entity or a representative.
      "0.signing.representative_title": blank,
      "0.signing.representative_date_signed": blank,
      "0.signing.firm_name": blank,
      "0.signing.firm_address": blank,

      // Schedule A (Side 2).
      "1.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "1.header.taxpayer_id": (_, info) => info.taxpayerSSN,
      "1.line.2_prior_deferred_exchange_col_a": californiaLine((california) =>
        yesNo(california.givenUp.priorDeferredExchange),
      ),
      "1.line.3_consideration_sales_price_col_a": scheduleALine((lines) => lines.line3),
      "1.line.4_selling_expenses_col_a": scheduleALine((lines) => lines.line4),
      "1.line.5_amount_realized_col_a": scheduleALine((lines) => lines.line5),
      "1.line.6_california_adjusted_basis_col_a": scheduleALine((lines) => lines.line6),
      "1.line.7_realized_gain_loss_col_a": scheduleALine((lines) => lines.line7),
      "1.line.8_california_sourced_deferred_gain": line8,
      // Line 10: "If only one property was received ... enter the amount from Part I, line 8, in column D" (part-iii-…::b01).
      "1.line.10_allocation_deferred_gain_col_d": line8,
      "1.line.11_apportionment_percentage": californiaLine((california) =>
        california.apportionmentPercent === undefined
          ? undefined
          : percentBoxes(california.apportionmentPercent, APPORTIONMENT_DECIMALS),
      ),
    },

    formatters: {
      "0.signing.taxpayer_phone": (value) =>
        Phone.format(value as Parameters<typeof Phone.format>[0]),
      "1.header.taxpayer_id": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
