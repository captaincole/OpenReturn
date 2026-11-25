/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { RelatedPartyExchange } from "../../facts/index.js";
import { SSN } from "../../values.js";
import { printedDate } from "../4797/dates.js";
import { namesOnReturn } from "../returnNames.js";
import { line15aDescription, line19Entry, line5Date } from "./describe.js";
import type { ExchangeForm } from "./exchange.js";
import type { Form8824FilingInfo } from "./filingInfo.js";
import { SUMMARY } from "./printed.js";
import { AFTER_LABEL, FULL_LINE, certificateParts, twoLines } from "./printing.js";
import {
  divestitureLine,
  exchangeLine,
  noBox,
  realizedLine,
  recognizedLine,
  summaryTotal,
  yesBox,
} from "./selectors.js";
import type { Form8824 } from "./types.js";

/* MANUAL EDIT: a description over two entry lines (printing.ts); the summary form prints "Summary" on line 1. */
const describedRow = (row: 0 | 1, text: (form: ExchangeForm) => string) =>
  exchangeLine((form) => twoLines(text(form), FULL_LINE)[row]);

/* A line of Part II: blank with no related party (the form's text under line 7). */
const relatedParty = <T>(pick: (party: RelatedPartyExchange) => T | undefined) =>
  exchangeLine((form) => (form.value.relatedParty ? pick(form.value.relatedParty) : undefined));

export function register(): void {
  defineForm<Form8824, Form8824FilingInfo>("form-8824", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: page 2 says "Do not enter name and identifying number if shown on other side."
      "1.header.taxpayer_name": () => undefined,
      "1.header.identifying_number": () => undefined,

      // MANUAL EDIT: Part I (irs-8824-inst-2025::sec::lines-1-and-2::b01, line-5::b01, line-6::b01).
      "0.line.1_property_given_up_description_row1": exchangeLine(
        (form) => twoLines(form.value.givenUp.description, FULL_LINE)[0],
        () => SUMMARY,
      ),
      "0.line.1_property_given_up_description_row2": describedRow(
        1,
        (form) => form.value.givenUp.description,
      ),
      "0.line.2_property_received_description_row1": describedRow(
        0,
        (form) => form.value.received.description,
      ),
      "0.line.2_property_received_description_row2": describedRow(
        1,
        (form) => form.value.received.description,
      ),
      "0.line.3_date_given_up_property_acquired": exchangeLine((form) =>
        printedDate(form.value.givenUp.dateAcquired),
      ),
      "0.line.4_date_property_transferred": exchangeLine((form) =>
        printedDate(form.value.givenUp.dateTransferred),
      ),
      "0.line.5_date_received_property_identified": exchangeLine((form) => {
        const date = line5Date(form.value);
        return date === undefined ? undefined : printedDate(date);
      }),
      "0.line.6_date_property_received": exchangeLine((form) =>
        printedDate(form.value.received.dateReceived),
      ),
      // MANUAL EDIT: line 7 (irs-8824-inst-2025::sec::line-7::b01): Yes for an exchange with a related party.
      "0.line.7_related_party_exchange_yes": exchangeLine((form) =>
        yesBox(form.value.relatedParty !== undefined),
      ),
      "0.line.7_related_party_exchange_no": exchangeLine((form) =>
        noBox(form.value.relatedParty !== undefined),
      ),

      // MANUAL EDIT: Part II, only for a related party exchange (the form's text under line 7).
      "0.line.8_related_party_name": relatedParty((party) => party.name),
      "0.line.8_related_party_relationship": relatedParty((party) => party.relationship),
      "0.line.8_related_party_identifying_number": relatedParty((party) => party.identifyingNumber),
      "0.line.8_related_party_address": relatedParty((party) => party.address),
      "0.line.9_related_party_disposed_property_yes": relatedParty((party) =>
        yesBox(party.relatedPartyDisposed),
      ),
      "0.line.9_related_party_disposed_property_no": relatedParty((party) =>
        noBox(party.relatedPartyDisposed),
      ),
      "0.line.10_you_disposed_property_yes": relatedParty((party) =>
        yesBox(party.taxpayerDisposed),
      ),
      "0.line.10_you_disposed_property_no": relatedParty((party) => noBox(party.taxpayerDisposed)),
      // MANUAL EDIT: line 11, for a disposition (or a sale into the exchange) an exception covers (lines-11a-through-11c::b01).
      "0.line.11a_exception_death_related_party": exchangeLine((form) =>
        yesBox(form.line11 === "death"),
      ),
      "0.line.11b_exception_involuntary_conversion": exchangeLine((form) =>
        yesBox(form.line11 === "involuntary_conversion"),
      ),
      "0.line.11c_exception_no_tax_avoidance": exchangeLine((form) =>
        yesBox(form.line11 === "no_tax_avoidance"),
      ),

      // MANUAL EDIT: Part III lines 12–20 (lines.ts realizedLines).
      "1.line.12_fmv_other_property_given_up": realizedLine((lines) => lines.line12),
      "1.line.12a_description_other_property_given_up": realizedLine((_, form) =>
        form.value.otherPropertyGivenUp
          ? twoLines(form.value.otherPropertyGivenUp.description, AFTER_LABEL)[0]
          : undefined,
      ),
      "1.line.12a_description_other_property_given_up_line2": realizedLine((_, form) =>
        form.value.otherPropertyGivenUp
          ? twoLines(form.value.otherPropertyGivenUp.description, AFTER_LABEL)[1]
          : undefined,
      ),
      "1.line.13_adjusted_basis_other_property_given_up": realizedLine((lines) => lines.line13),
      "1.line.14_gain_loss_other_property_given_up": realizedLine((lines) => lines.line14),
      "1.line.15_cash_other_property_received": realizedLine((lines) => lines.line15),
      "1.line.15a_description_other_property_received": realizedLine((_, form) => {
        const text = line15aDescription(form.value);
        return text === undefined ? undefined : twoLines(text, AFTER_LABEL)[0];
      }),
      "1.line.15a_description_other_property_received_line2": realizedLine((_, form) => {
        const text = line15aDescription(form.value);
        return text === undefined ? undefined : twoLines(text, AFTER_LABEL)[1];
      }),
      "1.line.16_fmv_like_kind_property_received": realizedLine((lines) => lines.line16),
      "1.line.17_add_lines_15_and_16": realizedLine((lines) => lines.line17),
      "1.line.18_adjusted_basis_like_kind_given_up": realizedLine((lines) => lines.line18),
      "1.line.19_realized_gain_loss_entry_space": realizedLine((_, form) =>
        line19Entry(form.value),
      ),
      "1.line.19_realized_gain_loss": realizedLine((lines) => lines.line19),
      "1.line.20_smaller_of_line_15_or_19": realizedLine((lines) => lines.line20),

      // MANUAL EDIT: lines 21–25c (lines.ts); the summary form's lines 23 and 25 (printed.ts).
      "1.line.21_ordinary_income_recapture": recognizedLine((lines) => lines.line21),
      "1.line.22_subtract_line_21_from_20": recognizedLine((lines) => lines.line22),
      "1.line.23_recognized_gain": recognizedLine(
        (lines) => lines.line23,
        summaryTotal((summary) => summary.line23),
      ),
      "1.line.24_deferred_gain_loss": recognizedLine((lines) => lines.line24),
      "1.line.25_basis_like_kind_property_received": recognizedLine(
        (lines) => lines.line25,
        summaryTotal((summary) => summary.line25),
      ),
      "1.line.25a_basis_section_1250_property": recognizedLine(
        (_, form) => form.basisParts?.section1250,
      ),
      "1.line.25b_basis_section_1245_property": recognizedLine(
        (_, form) => form.basisParts?.section1245,
      ),
      "1.line.25c_basis_intangible_property": recognizedLine(
        (_, form) => form.basisParts?.intangible,
      ),

      // MANUAL EDIT: Part IV (lines.ts partIVLines; divestiture.ts).
      "1.line.26_certificate_of_divestiture_number_part1": divestitureLine(
        (form) => certificateParts(form.value.certificateNumber)[0],
      ),
      "1.line.26_certificate_of_divestiture_number_part2": divestitureLine(
        (form) => certificateParts(form.value.certificateNumber)[1],
      ),
      "1.line.27_description_divested_property": divestitureLine(
        (form) => twoLines(form.value.divestedDescription, AFTER_LABEL)[0],
      ),
      "1.line.27_description_divested_property_line2": divestitureLine(
        (form) => twoLines(form.value.divestedDescription, AFTER_LABEL)[1],
      ),
      "1.line.28_description_replacement_property": divestitureLine(
        (form) => twoLines(form.value.replacementDescription, AFTER_LABEL)[0],
      ),
      "1.line.28_description_replacement_property_line2": divestitureLine(
        (form) => twoLines(form.value.replacementDescription, AFTER_LABEL)[1],
      ),
      "1.line.29_date_divested_property_sold": divestitureLine((form) =>
        printedDate(form.value.dateSold),
      ),
      "1.line.30_sales_price_divested_property": divestitureLine((form) => form.line30),
      "1.line.31_basis_divested_property": divestitureLine((form) => form.line31),
      "1.line.32_realized_gain": divestitureLine((form) => form.line32),
      "1.line.33_cost_replacement_property": divestitureLine((form) => form.line33),
      "1.line.34_subtract_line_33_from_30": divestitureLine((form) => form.line34),
      "1.line.35_ordinary_income_recapture": divestitureLine((form) => form.lines?.line35, true),
      "1.line.36_subtract_line_35_from_34": divestitureLine((form) => form.lines?.line36, true),
      "1.line.37_deferred_gain": divestitureLine((form) => form.lines?.line37, true),
      "1.line.38_basis_replacement_property": divestitureLine((form) => form.lines?.line38, true),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
