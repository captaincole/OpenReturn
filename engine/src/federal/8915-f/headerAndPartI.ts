/*
 * The header (name, SSN, items A to D) and Part I of the printed Form 8915-F.
 * Block ids are in irs-8915f-inst-2025.
 */

import type { FormSpec } from "../../defineForm.js";
import { unsupported } from "../../types.js";
import type { Form8915FCopy, Form8915FFilingInfo } from "./filingInfo.js";
import type { PartILine } from "./lines.js";
import { copyOf, datesText, lineOf, tableCell } from "./printed.js";
import type { Form8915F } from "./types.js";

type Bindings = FormSpec<Form8915F, Form8915FFilingInfo>["bindings"];

/* "If you file a joint return, enter only the name and SSN of the spouse whose information is being reported" (specific-instructions::b01). */
function personOf(info: Form8915FFilingInfo) {
  if (!files(info)) return { name: undefined, ssn: undefined };
  const spouse = copyOf(info)?.figure.owner === "spouse";
  const first = spouse ? info.spouseFirstName : info.taxpayerFirstName;
  const last = spouse ? info.spouseLastName : info.taxpayerLastName;
  return {
    name: first && last ? `${first} ${last}` : undefined,
    ssn: spouse ? info.spouseSSN : info.taxpayerSSN,
  };
}

const files = (info: Form8915FFilingInfo) => info.mustFile?.["form-8915-f"]?.value === true;

/* Item B: "the calendar year in which the disaster(s) ... began" (required-general-information::b01). */
const itemB = (year: number) =>
  lineOf((copy) => (copy.figure.disasterYear === year ? true : undefined));

/* Item C: each disaster's FEMA number, in order; six places. */
const itemC = (index: number) =>
  lineOf((copy) =>
    copy.printGaps.itemC
      ? unsupported(copy.printGaps.itemC)
      : copy.figure.disasters[index]?.femaNumber,
  );

function headerBindings(): Bindings {
  return {
    "0.header.taxpayer_name": (_, info) => personOf(info).name,
    "0.header.ssn": (_, info) => personOf(info).ssn,
    // Item A: "If the tax year of the return ... is 2025, check '2025'" (required-general-information::b01).
    "0.header.item_a_tax_year_2025": (_, info) => (files(info) ? true : undefined),
    "0.header.item_b_disaster_year_2021": itemB(2021),
    "0.header.item_b_disaster_year_2022": itemB(2022),
    "0.header.item_b_disaster_year_2023": itemB(2023),
    "0.header.item_b_disaster_year_2024": itemB(2024),
    "0.header.item_b_disaster_year_2025": itemB(2025),
    "0.header.item_b_disaster_year_2026": itemB(2026),
    "0.header.item_c_fema_number_1": itemC(0),
    "0.header.item_c_fema_number_2": itemC(1),
    "0.header.item_c_fema_number_3": itemC(2),
    "0.header.item_c_fema_number_4": itemC(3),
    "0.header.item_c_fema_number_5": itemC(4),
    "0.header.item_c_fema_number_6": itemC(5),
  };
}

/*
 * Boxes no 2025 Form 8915-F checks: item A is 2025, and item B is 2021 to 2026
 * (2020 disasters have no 2025 lines, Appendix A; a 2027 disaster cannot have a
 * 2025 distribution). Item D is the coronavirus, a 2020 disaster whose
 * distributions "can NOT be repaid after 2023" (appendix-a-which-lines-should-i-use::b08).
 */
function blankHeaderBindings(): Bindings {
  const blank = () => undefined;
  return {
    "0.header.item_a_tax_year_2021": blank,
    "0.header.item_a_tax_year_2022": blank,
    "0.header.item_a_tax_year_2023": blank,
    "0.header.item_a_tax_year_2024": blank,
    "0.header.item_a_tax_year_2026": blank,
    "0.header.item_a_tax_year_2027": blank,
    "0.header.item_a_tax_year_2028": blank,
    "0.header.item_a_tax_year_other": blank,
    "0.header.item_a_tax_year_other_year": blank,
    "0.header.item_b_disaster_year_2020": blank,
    "0.header.item_b_disaster_year_2027": blank,
    "0.header.item_b_disaster_year_other": blank,
    "0.header.item_b_disaster_year_other_year": blank,
    "0.header.item_d_coronavirus": blank,
  };
}

const partI = <T>(pick: (part: NonNullable<Form8915FCopy["figure"]["partI"]>) => T | undefined) =>
  lineOf((copy) => (copy.figure.partI ? pick(copy.figure.partI) : undefined));

const partITable = (row: number, field: "femaNumber" | "declarationDate" | "beginningDate") =>
  partI((part) => tableCell(part.disasters, row, field));

/* The Part I table, the statement box and the dates (part-i-total-distributions-from-all::b01). */
function partITableBindings(): Bindings {
  return {
    "1.line.part1_disaster_table_row1_fema_number": partITable(0, "femaNumber"),
    "1.line.part1_disaster_table_row1_declaration_date": partITable(0, "declarationDate"),
    "1.line.part1_disaster_table_row1_beginning_date": partITable(0, "beginningDate"),
    "1.line.part1_disaster_table_row2_fema_number": partITable(1, "femaNumber"),
    "1.line.part1_disaster_table_row2_declaration_date": partITable(1, "declarationDate"),
    "1.line.part1_disaster_table_row2_beginning_date": partITable(1, "beginningDate"),
    "1.line.part1_disaster_table_more_than_two_disasters": lineOf((copy) =>
      copy.printGaps.partIStatement ? unsupported(copy.printGaps.partIStatement) : undefined,
    ),
    "1.line.part1_distribution_dates_this_year": partI((part) =>
      datesText(
        part.pieces.filter((_, index) => part.qualified[index] > 0).map((piece) => piece.date),
      ),
    ),
  };
}

const columnA = (line: PartILine) => partI((part) => part.columns.columnA[line]);
const columnB = (line: PartILine) => partI((part) => part.columns.columnB?.[line]);

/* Lines 1a to 7 (lines.ts). */
function partILineBindings(): Bindings {
  return {
    "1.line.1a_disaster_distribution_limit_col_b": partI((part) => part.line1?.line1a),
    "1.line.1b_prior_year_disaster_distributions_col_b": partI((part) => part.line1?.line1b),
    "1.line.1c_limit_less_prior_distributions_col_b": partI((part) => part.line1?.line1c),
    "1.line.1d_limit_for_new_disasters_col_b": partI((part) => part.line1?.line1d),
    "1.line.1e_total_available_disaster_distribution_col_b": partI((part) => part.line1?.line1e),
    "1.line.2_retirement_plan_distributions_col_a": columnA("plan"),
    "1.line.2_retirement_plan_distributions_col_b": columnB("plan"),
    "1.line.3_traditional_ira_distributions_col_a": columnA("traditional"),
    "1.line.3_traditional_ira_distributions_col_b": columnB("traditional"),
    "1.line.4_roth_ira_distributions_col_a": columnA("roth"),
    "1.line.4_roth_ira_distributions_col_b": columnB("roth"),
    "1.line.5a_distributions_not_disaster_col_a": partI((part) => part.columns.line5a),
    "1.line.5b_distributions_less_line_5a_col_a": partI((part) => part.columns.line5bColumnA),
    "1.line.5b_distributions_less_line_5a_col_b": partI((part) => part.columns.line5bColumnB),
    "1.line.6_total_qualified_disaster_distributions": partI((part) => part.columns.line6),
    "1.line.7_taxable_amount": partI((part) => part.columns.line7),
  };
}

export function headerAndPartIBindings(): Bindings {
  return {
    ...headerBindings(),
    ...blankHeaderBindings(),
    ...partITableBindings(),
    ...partILineBindings(),
  };
}
