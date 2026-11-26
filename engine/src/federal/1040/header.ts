/*
 * Form 1040 header: names, address, filing status, digital assets and the
 * Dependents table.
 */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import type { DependentCredit, DependentFactValue } from "../../facts/kinds/dependents.js";
import { ssn } from "../../values.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import type { Form1040 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form1040]: BindingFn<Form1040, Form1040FilingInfo, K> }>;
type RowBinding = (form: FormAccessor<Form1040>, info: Form1040FilingInfo) => unknown;

/*
 * MANUAL EDIT: this box is on every return, not only nonresident ones. "Your
 * main home can be any location where you regularly live"
 * (irs-1040-inst-2025::sec::yes-continue-no-stop-11::b01): a Form 2555 whose
 * qualifying period holds more than half of 2025 (lines 31 and 38) leaves it
 * blank, as the box covers both spouses on a joint return.
 */
const HALF_OF_2025_DAYS = 182;

export const headerMainHomeUsOverHalfYear = (_: unknown, info: Form1040FilingInfo) => {
  const abroad = (info.form2555Filers ?? []).some((filer) => filer.days > HALF_OF_2025_DAYS);
  if (abroad && info.mustFile?.["form-2555"]?.value === true) return undefined;
  return info.homeAddressState ? true : undefined;
};

// MANUAL EDIT: mandatory for every filer. Undefined fills neither box, so the gap shows.
export const headerDigitalAssetsYes = (_: unknown, info: Form1040FilingInfo) =>
  info.hasDigitalAssets === true ? true : undefined;

export const headerDigitalAssetsNo = (_: unknown, info: Form1040FilingInfo) =>
  info.hasDigitalAssets === false ? true : undefined;

// No middle-initial fact; the first name fills this combined field.
export const headerFirstNameMi = (_: unknown, info: Form1040FilingInfo) => info.taxpayerFirstName;

export const headerLastName = (_: unknown, info: Form1040FilingInfo) => info.taxpayerLastName;

export const headerSsn = (_: unknown, info: Form1040FilingInfo) => info.taxpayerSSN;

export const headerHomeAddress = (_: unknown, info: Form1040FilingInfo) => info.homeAddressLine1;

export const headerApartment = (_: unknown, info: Form1040FilingInfo) => info.homeAddressApt;

export const headerCity = (_: unknown, info: Form1040FilingInfo) => info.homeAddressCity;

export const headerState = (_: unknown, info: Form1040FilingInfo) => info.homeAddressState;

export const headerZip = (_: unknown, info: Form1040FilingInfo) => info.homeAddressZip;

export const filingStatusSingle = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "single";

export const filingStatusHoh = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "head_of_household";

export const filingStatusMfj = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_jointly";

export const filingStatusQss = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "qualifying_surviving_spouse";

export const filingStatusMfs = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_separately";

/*
 * MANUAL EDIT: the spouse's name line is "If joint return". A separate return
 * names the spouse "below the filing status checkboxes instead of below your
 * name" (irs-1040-inst-2025::sec::name-and-address::b01), so it stays blank
 * there; a qualifying surviving spouse files alone. Like the taxpayer's field,
 * the first name fills this combined field and the middle initial is left out.
 */
const joint = (info: Form1040FilingInfo) => info.filingStatus === "married_filing_jointly";

export const headerSpouseFirstNameMi = (_: unknown, info: Form1040FilingInfo) =>
  joint(info) ? info.spouseFirstName : undefined;

export const headerSpouseLastName = (_: unknown, info: Form1040FilingInfo) =>
  joint(info) ? info.spouseLastName : undefined;

// MANUAL EDIT: a joint or a separate return shows the spouse's SSN in the header.
export const headerSpouseSsn = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_separately" ||
  info.filingStatus === "married_filing_jointly"
    ? info.spouseSSN
    : undefined;

export const headerMfsSpouseFullName = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_separately" && info.spouseFirstName && info.spouseLastName
    ? `${info.spouseFirstName} ${info.spouseLastName}`
    : undefined;

/*
 * MANUAL EDIT: the form's text: MFS or HOH, and lived apart the last 6 months
 * (living apart all year covers it) or legally separated and apart at year end
 * (irs-1040-inst-2025::sec::definitions-and-special-rules-2::b08).
 */
export const headerLivedApartMfsHoh = (_: unknown, info: Form1040FilingInfo) =>
  (info.filingStatus === "married_filing_separately" ||
    info.filingStatus === "head_of_household") &&
  (info.livedApartFromSpouseAllYear === true ||
    info.livedApartFromSpouseLastSixMonths === true ||
    info.legallySeparatedApartAtYearEnd === true)
    ? true
    : undefined;

/*
 * MANUAL EDIT: column (2) prints the SSN, else the ITIN or ATIN (the 1040
 * instructions: "You must enter each dependent's social security number").
 * Like the header SSN, the comb widget takes the nine digits.
 */
function dependentTin(dep: DependentFactValue | undefined) {
  const raw = dep?.ssn ?? dep?.tin;
  return raw === undefined ? undefined : ssn(raw);
}

/*
 * MANUAL EDIT: the Dependents table, rows 1 to 4, one row per dependent fact in
 * the order recorded. Rows (5) and (7) print what Schedule 8812's resolver
 * decided for the person (the one place that applies the tax year); a box stays
 * blank while an answer is still missing. A row with no dependent stays blank.
 */
export function dependentRowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (const row of [1, 2, 3, 4]) {
    const entry = (info: Form1040FilingInfo) => info.dependents?.[row - 1];
    const dep = (info: Form1040FilingInfo) => entry(info)?.dependent;
    const checks = (info: Form1040FilingInfo, box: DependentCredit) => {
      const credit = entry(info)?.credit;
      return credit === undefined ? undefined : credit === box;
    };
    bindings[`dependents.dep${row}_first_name`] = (_, info) => dep(info)?.firstName;
    bindings[`dependents.dep${row}_last_name`] = (_, info) => dep(info)?.lastName;
    bindings[`dependents.dep${row}_ssn`] = (_, info) => dependentTin(dep(info));
    bindings[`dependents.dep${row}_relationship`] = (_, info) => dep(info)?.relationship;
    bindings[`dependents.dep${row}_lived_with_you`] = (_, info) =>
      entry(info)?.livedWithYouOverHalfYear;
    bindings[`dependents.dep${row}_lived_in_us`] = (_, info) => entry(info)?.livedWithYouInUs;
    bindings[`dependents.dep${row}_full_time_student`] = (_, info) => dep(info)?.fullTimeStudent;
    bindings[`dependents.dep${row}_permanently_disabled`] = (_, info) =>
      dep(info)?.permanentlyDisabled;
    bindings[`dependents.dep${row}_child_tax_credit`] = (_, info) =>
      checks(info, "child_tax_credit");
    bindings[`dependents.dep${row}_other_dependent_credit`] = (_, info) =>
      checks(info, "other_dependents");
  }
  return bindings as Bindings;
}

// The attached statement for the fifth dependent onward is not modeled.
export const moreThanFourDependents = (_: unknown, info: Form1040FilingInfo) =>
  info.dependents === undefined ? undefined : info.dependents.length > 4;
