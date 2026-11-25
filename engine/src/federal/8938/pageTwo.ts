/*
 * Page 2: Part V (one foreign deposit or custodial account) and Part VI (one
 * other asset, with one issuer or counterparty). Each copy of the form prints
 * one page 2 (federal/index.ts appends page 2 only for the later copies):
 * "make additional copies of page 2 of this form and attach them"
 * (irs-8938-inst-2025::sec::specific-instructions::b01).
 */

import type { BindingFn } from "../../defineForm.js";
import type { ForeignPartyType } from "../../facts/index.js";
import { unsupported } from "../../types.js";
import type { AssetConversion } from "./assetCurrency.js";
import type { Form8938FilingInfo } from "./filingInfo.js";
import { cityLine, giinSegments, type ValueRange } from "./lines.js";
import type { PartVIRow, PartVRow } from "./rows.js";
import type { Form8938 } from "./types.js";

type Fn = BindingFn<Form8938, Form8938FilingInfo, keyof Form8938>;
type Value = string | number | boolean | undefined | ReturnType<typeof unsupported>;

const copyOf = (info: Form8938FilingInfo) => info.form8938CopyIndex ?? 0;

const partV =
  (pick: (row: PartVRow) => Value): Fn =>
  (_, info) => {
    const row = info.form8938?.partV[copyOf(info)];
    return row === undefined ? undefined : pick(row);
  };

const partVI =
  (pick: (row: PartVIRow) => Value): Fn =>
  (_, info) => {
    const row = info.form8938?.partVI[copyOf(info)];
    return row === undefined ? undefined : pick(row);
  };

const checked = (yes: boolean) => (yes ? true : undefined);

/*
 * Lines 24–25 and 33–34 (line-25::b01, line-34::b01): Yes with the currency
 * and the Treasury rate. Column (c), the source of a rate other than the
 * Treasury's, stays blank: the engine uses only the Treasury rate.
 */
function conversionLines(
  prefix: string,
  rowOf: (pick: (row: { conversion?: AssetConversion }) => Value) => Fn,
): Record<string, Fn> {
  const [yesNoLine, columnsLine, subject] =
    prefix === "account" ? ["24", "25", "account"] : ["33", "34", "asset"];
  return {
    [`1.line.${yesNoLine}_${subject}_exchange_rate_used_yes`]: rowOf((row) =>
      checked(row.conversion !== undefined),
    ),
    [`1.line.${yesNoLine}_${subject}_exchange_rate_used_no`]: rowOf((row) =>
      checked(row.conversion === undefined),
    ),
    [`1.line.${columnsLine}_${subject}_exchange_rate_col_a`]: rowOf((row) => row.conversion?.label),
    [`1.line.${columnsLine}_${subject}_exchange_rate_col_b`]: rowOf(
      (row) => row.conversion?.printed,
    ),
    [`1.line.${columnsLine}_${subject}_exchange_rate_col_c`]: rowOf(() => undefined),
  };
}

const GIIN_GAP =
  "The GIIN is not in its 19-character form (6, 5, 2 and 3 characters with dots between).";

/* Lines 26b and 35b: the four boxes of a GIIN (optional: blank with none). */
function giinLines(
  base: string,
  giinOf: (info: Form8938FilingInfo) => string | undefined,
): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (const index of [0, 1, 2, 3]) {
    out[`${base}_${index + 1}`] = (_, info) => {
      const giin = giinOf(info);
      if (giin === undefined) return undefined;
      const segments = giinSegments(giin);
      return segments === undefined ? unsupported(GIIN_GAP) : segments[index];
    };
  }
  return out;
}

export function partVBindings(): Record<string, Fn> {
  return {
    "1.line.20a_type_of_account_deposit": partV((row) => checked(row.deposit)),
    "1.line.20b_type_of_account_custodial": partV((row) => checked(!row.deposit)),
    "1.line.21_account_number": partV((row) => row.accountNumber),
    "1.line.22a_account_opened_during_year": partV((row) => checked(row.opened)),
    "1.line.22b_account_closed_during_year": partV((row) => checked(row.closed)),
    "1.line.22c_account_jointly_owned_spouse": partV((row) => checked(row.jointWithSpouse)),
    "1.line.22d_account_no_tax_item": partV((row) => checked(row.noTaxItem)),
    "1.line.23_account_maximum_value": partV((row) => row.maximumValue),
    ...conversionLines("account", (pick) => partV(pick)),
    "1.line.26a_financial_institution_name": partV((row) => row.institution?.name),
    ...giinLines(
      "1.line.26b_institution_giin_segment",
      (info) => info.form8938?.partV[copyOf(info)]?.institution?.giin,
    ),
    "1.line.27_financial_institution_street_address": partV(
      (row) => row.institution?.address.street,
    ),
    "1.line.28_financial_institution_city_country": partV(
      (row) => row.institution && cityLine(row.institution.address),
    ),
  };
}

const RANGE_FIELDS: Array<[ValueRange, string]> = [
  ["a", "1.line.32a_asset_maximum_value_0_to_50000"],
  ["b", "1.line.32b_asset_maximum_value_50001_to_100000"],
  ["c", "1.line.32c_asset_maximum_value_100001_to_150000"],
  ["d", "1.line.32d_asset_maximum_value_150001_to_200000"],
];

const ENTITY_TYPES = ["partnership", "corporation", "trust", "estate"] as const;
const PARTY_TYPES: ForeignPartyType[] = ["individual", ...ENTITY_TYPES];

/* Lines 35a–35e: stock of, or an interest in, a foreign entity (lines-35d-and-35e::b01 and the lines before it). */
function entityBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {
    "1.line.35a_foreign_entity_name": partVI((row) => row.entity?.name),
    ...giinLines(
      "1.line.35b_entity_giin_segment",
      (info) => info.form8938?.partVI[copyOf(info)]?.entity?.giin,
    ),
    "1.line.35d_foreign_entity_street_address": partVI((row) => row.entity?.address.street),
    "1.line.35e_foreign_entity_city_country": partVI(
      (row) => row.entity && cityLine(row.entity.address),
    ),
  };
  for (const type of ENTITY_TYPES) {
    out[`1.line.35c_foreign_entity_type_${type}`] = partVI((row) =>
      checked(row.entity?.type === type),
    );
  }
  return out;
}

/* Lines 36a–36e: any other asset, one issuer or counterparty a page (line-36a::b01 to lines-36d-and-36e::b01). */
function issuerBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {
    "1.line.36a_issuer_or_counterparty_name": partVI((row) => row.issuer?.name),
    "1.line.36a_information_is_for_issuer": partVI((row) => checked(row.issuer?.role === "issuer")),
    "1.line.36a_information_is_for_counterparty": partVI((row) =>
      checked(row.issuer?.role === "counterparty"),
    ),
    "1.line.36c_issuer_counterparty_us_person": partVI((row) =>
      checked(row.issuer?.usPerson === true),
    ),
    "1.line.36c_issuer_counterparty_foreign_person": partVI((row) =>
      checked(row.issuer?.usPerson === false),
    ),
    "1.line.36d_issuer_counterparty_street_address": partVI((row) => row.issuer?.address.street),
    "1.line.36e_issuer_counterparty_city_country": partVI(
      (row) => row.issuer && cityLine(row.issuer.address),
    ),
  };
  for (const type of PARTY_TYPES) {
    out[`1.line.36b_issuer_counterparty_type_${type}`] = partVI((row) =>
      checked(row.issuer?.type === type),
    );
  }
  return out;
}

export function partVIBindings(): Record<string, Fn> {
  const ranges: Record<string, Fn> = {};
  for (const [range, fieldId] of RANGE_FIELDS)
    ranges[fieldId] = partVI((row) => checked(row.range === range));
  return {
    "1.line.29_description_of_asset": partVI((row) => row.description),
    "1.line.30_asset_identifying_number": partVI((row) => row.accountNumber),
    "1.line.31a_date_asset_acquired": partVI((row) => row.acquired),
    "1.line.31b_date_asset_disposed": partVI((row) => row.disposed),
    "1.line.31c_asset_jointly_owned_spouse": partVI((row) => checked(row.jointWithSpouse)),
    "1.line.31d_asset_no_tax_item": partVI((row) => checked(row.noTaxItem)),
    ...ranges,
    "1.line.32e_asset_maximum_value_over_200000": partVI((row) =>
      row.range === "e" ? row.maximumValue : undefined,
    ),
    ...conversionLines("asset", (pick) => partVI(pick)),
    ...entityBindings(),
    ...issuerBindings(),
  };
}
