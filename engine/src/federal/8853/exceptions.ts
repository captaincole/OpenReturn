/*
 * Which taxable MSA distributions meet an exception to the additional tax
 * (lines 9a and 13a). A 1099-SA carries no date, so the facts settle it only
 * when every distribution falls the same way; otherwise the taxpayer states
 * the excepted part.
 */

import { bornBeforeJan2_1960, bornBeforeJan2_1961 } from "../../birthDate.js";
import { SPOUSE_KEYS, type HsaDistributionFactValue } from "../../facts/index.js";

export type AccountHolder = "taxpayer" | "spouse";

/* "all": every distribution is excepted; "none": none is; "ask": the facts cannot tell. */
export type ExceptionRule = { rule: "all" | "none" | "ask" } | { rule: "waits"; dobKey: string };

/* 1099-SA box 3, distribution code 3: disability (the trustee's report). */
export const DISABILITY_CODE = "3";
/* Codes 4 and 6 (death) and 5 (prohibited transaction) follow rules the engine does not model. */
export const DEATH_OR_PROHIBITED_CODES: ReadonlyArray<string> = ["4", "5", "6"];

export const TAXPAYER_DOB_KEY = "identity.dob";

export const holderOf = (distribution: HsaDistributionFactValue): AccountHolder =>
  distribution.owner ?? "taxpayer";

export const distributionCode = (distribution: HsaDistributionFactValue): string =>
  String(distribution.box3 ?? "").trim();

type Status = "excepted" | "not" | "unknown";

function combine(statuses: ReadonlyArray<Status>): ExceptionRule {
  if (statuses.every((status) => status === "excepted")) return { rule: "all" };
  if (statuses.every((status) => status === "not")) return { rule: "none" };
  return { rule: "ask" };
}

/*
 * Archer MSA: no 20% tax on distributions made after the account holder dies,
 * becomes disabled or turns 65 (irs-8853-inst-2025::sec::exceptions-to-the-additional-20-tax::b01).
 * Code 3 is a disability distribution. A holder who turned 65 by the end of
 * 2024 is past the date for every 2025 distribution; one born after January 1,
 * 1961 turns 65 after 2025; one who turns 65 during 2025 may have both kinds.
 */
export function archerExceptionRule(
  distributions: ReadonlyArray<HsaDistributionFactValue>,
  dobOf: (holder: AccountHolder) => string | undefined,
): ExceptionRule {
  const statuses: Status[] = [];
  for (const distribution of distributions) {
    if (distributionCode(distribution) === DISABILITY_CODE) {
      statuses.push("excepted");
      continue;
    }
    const holder = holderOf(distribution);
    const dob = dobOf(holder);
    const past65 = bornBeforeJan2_1960(dob);
    const before65 = bornBeforeJan2_1961(dob) === false;
    if (past65 === undefined) {
      return { rule: "waits", dobKey: holder === "spouse" ? SPOUSE_KEYS.dob : TAXPAYER_DOB_KEY };
    }
    statuses.push(past65 ? "excepted" : before65 ? "not" : "unknown");
  }
  return combine(statuses);
}

/*
 * Medicare Advantage MSA: no 50% tax on distributions made on or after the
 * holder dies or becomes disabled (irs-8853-inst-2025::sec::exceptions-to-the-additional-50-tax::b01).
 * There is no age exception.
 */
export function medicareAdvantageExceptionRule(
  distributions: ReadonlyArray<HsaDistributionFactValue>,
): ExceptionRule {
  return combine(
    distributions.map((distribution) =>
      distributionCode(distribution) === DISABILITY_CODE ? "excepted" : "not",
    ),
  );
}

/*
 * The excepted part of the taxable amount: the stated answer when there is one,
 * else the whole amount or none by the rule; undefined while it waits.
 */
export function exceptedPart(
  taxable: number,
  stated: number | undefined,
  rule: ExceptionRule,
): number | undefined {
  if (stated !== undefined) return stated;
  if (rule.rule === "all") return taxable;
  if (rule.rule === "none") return 0;
  return undefined;
}
