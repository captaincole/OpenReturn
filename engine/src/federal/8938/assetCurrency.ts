/*
 * The value of an asset kept in a foreign currency, in U.S. dollars: "In most
 * cases, you must use the U.S. Treasury Bureau of the Fiscal Service foreign
 * currency exchange rate for purchasing U.S. dollars"
 * (irs-8938-inst-2025::sec::foreign-currency-conversion::b01), "on the last day
 * of the tax year ... even if you sold or otherwise disposed of the specified
 * foreign financial asset before the last day of the tax year"
 * (currency-determination-date::b01). The rate comes from the engine's
 * Treasury table (currency/rates.ts yearEndRate), never from the fact.
 */

import { currencyLabel } from "../../currency/currencies.js";
import { yearEndRate } from "../../currency/rates.js";
import type { ForeignFinancialAssetFactValue } from "../../facts/index.js";
import type { UnitsPerDollar } from "../../money.js";

/* The calendar year of the return (bindings.ts prints "25"). */
const TAX_YEAR = 2025;

/* Lines 24–25 or 33–34 of one asset. */
export interface AssetConversion {
  /* Column (a): "Euro (EUR)". */
  label: string;
  rate?: UnitsPerDollar;
  /* Column (b), as the Treasury prints it: "0.851". */
  printed?: string;
  /* Why the value cannot be converted: a currency the engine does not support. */
  gap?: string;
}

/* Undefined for an asset in U.S. dollars. */
export function assetConversion(
  value: ForeignFinancialAssetFactValue,
): AssetConversion | undefined {
  const code = value.foreignCurrency?.code;
  if (code === undefined) return undefined;
  const found = yearEndRate(code, TAX_YEAR);
  if (!found.ok) return { label: currencyLabel(code), gap: found.gap };
  return { label: currencyLabel(code), rate: found.rate, printed: found.printed };
}

/* The rate of an asset's value: undefined in U.S. dollars, or while its currency is a gap. */
export function assetRate(value: ForeignFinancialAssetFactValue): UnitsPerDollar | undefined {
  return assetConversion(value)?.rate;
}
