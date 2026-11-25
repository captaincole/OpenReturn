/*
 * Parts V and VI, and the Part I and II summaries of them. One Part V row per
 * foreign deposit or custodial account, one Part VI row per other asset; an
 * asset with more than one issuer or counterparty takes one page 2 for each
 * (irs-8938-inst-2025::sec::lines-35d-and-35e::b01, "copy page 2 as many times
 * as needed and complete a separate line 36 for each issuer or counterparty").
 */

import type {
  ForeignEntity,
  ForeignFinancialAssetFact,
  ForeignInstitution,
  ForeignIssuer,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { assetConversion, type AssetConversion } from "./assetCurrency.js";
import { printedMaximum, valueRangeOf, type ValueRange } from "./lines.js";
import { hasNoTaxItem, type AssetTaxItems } from "./partIII.js";

interface RowCommon {
  accountNumber: string;
  /* Line 22c or 31c (line-22::b01, line-31::b01). */
  jointWithSpouse: boolean;
  /* Line 22d or 31d. */
  noTaxItem: boolean;
  /* Line 23 or 32, whole dollars: "report the maximum value of the entire jointly held account" (spouses-filing-separate-returns::b01). */
  maximumValue: number;
  /* Lines 24–25 or 33–34: undefined for an asset in U.S. dollars. */
  conversion?: AssetConversion;
}

export interface PartVRow extends RowCommon {
  /* Line 20: deposit (a) or custodial (b) (line-20::b01). */
  deposit: boolean;
  opened: boolean;
  closed: boolean;
  institution?: ForeignInstitution;
}

export interface PartVIRow extends RowCommon {
  description?: string;
  acquired?: string;
  disposed?: string;
  range: ValueRange;
  entity?: ForeignEntity;
  /* This page's issuer or counterparty (line 36). */
  issuer?: ForeignIssuer;
  /* A second or later page for the same asset: not counted again on lines 10–12. */
  repeatsAsset: boolean;
}

export interface ReportedAsset {
  fact: ForeignFinancialAssetFact;
  items: AssetTaxItems;
}

function commonOf(asset: ReportedAsset): RowCommon {
  const { value } = asset.fact;
  const conversion = assetConversion(value);
  return {
    accountNumber: value.accountNumber,
    jointWithSpouse: value.owner === "joint_with_spouse",
    noTaxItem: hasNoTaxItem(asset.items),
    maximumValue: printedMaximum(value.maximumValue, conversion?.rate),
    conversion,
  };
}

export function partVRows(assets: ReadonlyArray<ReportedAsset>): PartVRow[] {
  return assets
    .filter((asset) => asset.fact.value.part !== "other_asset")
    .map((asset) => {
      const { value } = asset.fact;
      return {
        ...commonOf(asset),
        deposit: value.part === "deposit_account",
        opened: value.openedOrAcquired !== undefined,
        closed: value.closedOrDisposed !== undefined,
        institution: value.institution,
      };
    });
}

export function partVIRows(assets: ReadonlyArray<ReportedAsset>): PartVIRow[] {
  return assets
    .filter((asset) => asset.fact.value.part === "other_asset")
    .flatMap((asset): PartVIRow[] => {
      const { value } = asset.fact;
      const common = commonOf(asset);
      const row = {
        ...common,
        description: value.description,
        acquired: value.openedOrAcquired,
        disposed: value.closedOrDisposed,
        range: valueRangeOf(common.maximumValue),
        entity: value.entity,
      };
      const issuers = value.entity === undefined ? (value.issuers ?? []) : [];
      if (issuers.length === 0) return [{ ...row, issuer: undefined, repeatsAsset: false }];
      return issuers.map((issuer, index) => ({ ...row, issuer, repeatsAsset: index > 0 }));
    });
}

/* Part I (part-i::b01, line-5::b01 to line-9::b01): the Part V accounts by type. */
export interface PartILines {
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9Yes: boolean;
}

export function partILines(rows: ReadonlyArray<PartVRow>): PartILines | undefined {
  if (rows.length === 0) return undefined;
  const deposits = rows.filter((row) => row.deposit);
  const custodial = rows.filter((row) => !row.deposit);
  return {
    line5: deposits.length,
    line6: sum(...deposits.map((row) => row.maximumValue)),
    line7: custodial.length,
    line8: sum(...custodial.map((row) => row.maximumValue)),
    line9Yes: rows.some((row) => row.closed),
  };
}

/* Part II (part-ii::b01, line-10::b01 to line-12::b01): each Part VI asset once. */
export interface PartIILines {
  line10: number;
  line11: number;
  line12Yes: boolean;
}

export function partIILines(rows: ReadonlyArray<PartVIRow>): PartIILines | undefined {
  const assets = rows.filter((row) => !row.repeatsAsset);
  if (assets.length === 0) return undefined;
  return {
    line10: assets.length,
    line11: sum(...assets.map((row) => row.maximumValue)),
    line12Yes: assets.some((row) => row.acquired !== undefined || row.disposed !== undefined),
  };
}
