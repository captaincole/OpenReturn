/*
 * Form 8833 rules: each content line prints a stated answer of this copy's
 * treaty position (facts/kinds/treatyPosition.ts); the layout of the address
 * boxes and of line 6 is in lines.ts.
 */

import { defineForm, type FormSpec } from "../../defineForm.js";
import type { TreatyPositionFact, TreatyPositionFactValue } from "../../facts/index.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form8833FilingInfo } from "./filingInfo.js";
import {
  LINE_6_ROWS,
  countryOfResidenceAddress,
  line6Of,
  unitedStatesAddress,
  type HomeAddress,
} from "./lines.js";
import type { Form8833 } from "./types.js";

type Bindings = FormSpec<Form8833, Form8833FilingInfo>["bindings"];
type Answer<T> = (form: unknown, info: Form8833FilingInfo) => T | Unsupported | undefined;

const DUAL_RESIDENT =
  "A dual-resident taxpayer who claims treaty benefits as a resident of the other country files Form 1040-NR with Form 8833 (irs-8833-form-2025::sec::form-8833-rev-12-2022-page-4::b02, b03); the engine prepares Form 1040 only.";

/* The position this copy prints; undefined on a copy with none. */
const positionOf = (info: Form8833FilingInfo): TreatyPositionFact | undefined =>
  info.form8833Positions?.[info.form8833CopyIndex ?? 0];

const files = (info: Form8833FilingInfo): boolean =>
  info.form8833Positions !== undefined || info.form8833Gap !== undefined;

/* A line of this copy's position: a gap when the decision files the form with no position. */
function answer<T>(
  pick: (value: Partial<TreatyPositionFactValue>) => T | Unsupported | undefined,
): Answer<T> {
  return (_, info) => {
    if (info.form8833Gap) return unsupported(info.form8833Gap);
    const position = positionOf(info);
    return position === undefined ? undefined : pick(position.value);
  };
}

/* A checkbox: checked (true) or blank. */
const checked = (on: boolean | undefined): true | undefined => (on === true ? true : undefined);

/* "Name": the person who takes the position (QUESTIONS.md item 2); the taxpayer on a copy with none. */
function personName(info: Form8833FilingInfo): string | undefined {
  const spouse = positionOf(info)?.owner === "spouse";
  const [first, last] = spouse
    ? [info.spouseFirstName, info.spouseLastName]
    : [info.taxpayerFirstName, info.taxpayerLastName];
  return first && last ? `${first} ${last}` : undefined;
}

const homeAddress = (info: Form8833FilingInfo): HomeAddress => ({
  street: info.homeAddressLine1,
  apt: info.homeAddressApt,
  city: info.homeAddressCity,
  state: info.homeAddressState,
  zip: info.homeAddressZip,
});

/*
 * Line 6, row `row` (1 to 25): the explanation laid out over the rows
 * (lines.ts). Text that needs more than 25 rows makes every row a gap: the
 * engine prints no continuation statement (QUESTIONS.md item 6).
 */
const line6Row = (row: number): Answer<string> =>
  answer((value) => {
    if (value.explanation === undefined) return undefined;
    const line6 = line6Of(value.explanation);
    if (line6.kind === "overflow") {
      return unsupported(
        `The line 6 explanation needs ${line6.rowsNeeded} rows and the form has ${LINE_6_ROWS}; the engine writes no continuation statement.`,
      );
    }
    return line6.rows[row - 1];
  });

function line6Bindings(): Record<string, Answer<string>> {
  const rows = Array.from({ length: LINE_6_ROWS }, (_, index) => index + 1);
  return Object.fromEntries(
    rows.map((row) => [`0.line.6_treaty_position_explanation_row_${row}`, line6Row(row)]),
  );
}

function headerBindings(): Record<string, Answer<unknown>> {
  return {
    "0.header.taxpayer_name": (_, info) => personName(info),
    // "The identifying number of an individual is his or her social security number" (specific-instructions::b01).
    "0.header.us_taxpayer_id_number": (_, info) =>
      positionOf(info)?.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN,
    // "If the taxpayer is a foreign corporation" (reference-id-number::b01): never for a Form 1040 filer.
    "0.header.reference_id_number": () => undefined,
    "0.header.address_country_of_residence": (_, info) =>
      files(info) ? countryOfResidenceAddress(homeAddress(info)) : undefined,
    "0.header.address_united_states": (_, info) =>
      files(info) ? unitedStatesAddress(homeAddress(info)) : undefined,
    // "Check one or both of the following boxes as applicable" (face-page-1::b01).
    "0.header.disclosing_under_section_6114": answer((value) =>
      checked(value.section6114Disclosure),
    ),
    "0.header.dual_resident_disclosing_under_7701b": answer((value) =>
      value.dualResidentDisclosure === true ? unsupported(DUAL_RESIDENT) : undefined,
    ),
    /*
     * Form 1040 is the return of a U.S. citizen or resident; "Most nonresident
     * aliens and dual-status aliens ... may have to file Form 1040-NR"
     * (irs-1040-inst-2025::sec::do-you-have-to-file::b03). Checked on every copy.
     */
    "0.header.us_citizen_or_resident": (_, info) => (files(info) ? true : undefined),
  };
}

function lineBindings(): Record<string, Answer<unknown>> {
  return {
    "0.line.1a_treaty_country": answer((value) => value.treatyCountry),
    "0.line.1b_treaty_articles": answer((value) => value.articles),
    "0.line.2_code_provisions_overruled": answer((value) => value.codeProvisions),
    // Line 3, "if fixed or determinable annual or periodical" (line-3::b01): blank when not stated.
    "0.line.3_us_payor_name_address": answer((value) => value.payor),
    // Line 4, "(if any)" (line-4::b01): blank when not stated.
    "0.line.4_limitation_on_benefits_provisions": answer((value) => value.limitationOnBenefits),
    "0.line.5_reporting_required_6114_1b_yes": answer((value) =>
      checked(value.specificallyRequired === true),
    ),
    "0.line.5_reporting_required_6114_1b_no": answer((value) =>
      checked(value.specificallyRequired === false),
    ),
    // "If 'Yes,' enter the specific subsection(s)" (face-page-1::b03, line-5::b01).
    "0.line.5_6114_1b_subsections": answer((value) =>
      value.specificallyRequired === true ? value.requiredSubsections : undefined,
    ),
  };
}

export function register(): void {
  defineForm<Form8833, Form8833FilingInfo>("form-8833", {
    bindings: {
      // The rows of line 6 are built in a loop, so the records' keys are strings.
      ...(headerBindings() as Bindings),
      ...(lineBindings() as Bindings),
      ...(line6Bindings() as Bindings),
    },

    // The number widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.us_taxpayer_id_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
