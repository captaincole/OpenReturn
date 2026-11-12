import type { BaseFilingInfo } from "../filingInfo.js";

/*
 * "Name(s) shown on return": a joint return names both spouses ("A & B");
 * undefined while a name it needs is missing.
 */
export function namesOnReturn(info: BaseFilingInfo): string | undefined {
  const { taxpayerFirstName, taxpayerLastName, spouseFirstName, spouseLastName } = info;
  if (!taxpayerFirstName || !taxpayerLastName) return undefined;
  const taxpayer = `${taxpayerFirstName} ${taxpayerLastName}`;
  if (info.filingStatus !== "married_filing_jointly") return taxpayer;
  return spouseFirstName && spouseLastName
    ? `${taxpayer} & ${spouseFirstName} ${spouseLastName}`
    : undefined;
}
