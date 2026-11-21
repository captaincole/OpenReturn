/*
 * Section 1256 contracts: regulated futures, foreign currency contracts and
 * nonequity options (Form 6781 Part I line 1, irs-6781-form-2025::sec::specific-instructions::b01).
 *
 * Two kinds of fact, each one row on line 1:
 * - a statement: one Form 1099-B (or substitute statement) that fills boxes 8
 *   through 11. Such a 1099-B fills no other numbered box except 1a and 4
 *   (irs-1099b-inst-2025::sec::regulated-futures-contracts-foreign-currency::b01),
 *   so it is not a trade fact.
 * - a contract with no 1099-B for the tax year: the taxpayer states it.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface Section1256StatementFactValue {
  brokerName: string;
  accountNumber?: string;
  box8?: number; // Profit or (loss) realized in 2025 on closed contracts
  box9?: number; // Unrealized profit or (loss) on open contracts, 12/31/2024
  box10?: number; // Unrealized profit or (loss) on open contracts, 12/31/2025
  box11?: number; // Aggregate profit or (loss) on contracts
}

export interface Section1256ContractFactValue {
  description: string;
  /* The 2025 gain (positive) or loss (negative) under the mark-to-market rules. */
  gainOrLoss: number;
}

export type Section1256Fact =
  | { kind: "statement"; key: string; value: Section1256StatementFactValue }
  | { kind: "contract"; key: string; value: Section1256ContractFactValue };

const SECTION_1256_CATEGORY = "capital_gains";
const STATEMENT_KEY_END = "section_1256";
const CONTRACT_KEY_START = "capital_gains.section_1256.";

/* The 1099-B is an account document: one fact per account, like the other 1099s. */
export function makeSection1256StatementFactKey(accountSlug: string): string {
  return `account.${accountSlug}.${STATEMENT_KEY_END}`;
}

export function makeSection1256ContractFactKey(contractSlug: string): string {
  return `${CONTRACT_KEY_START}${contractSlug}`;
}

export function isSection1256StatementFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 3 && parts[0] === "account" && parts[2] === STATEMENT_KEY_END;
}

export function isSection1256ContractFactKey(key: string): boolean {
  return key.startsWith(CONTRACT_KEY_START) && key.split(".").length === 3;
}

/* Every section 1256 fact, in the order the facts arrive. */
export function getSection1256Facts(facts: ReadonlyArray<FactRow>): Section1256Fact[] {
  const out: Section1256Fact[] = [];
  for (const fact of facts) {
    if (fact.category !== SECTION_1256_CATEGORY) continue;
    if (isSection1256StatementFactKey(fact.key)) {
      out.push({
        kind: "statement",
        key: fact.key,
        value: fact.value as Section1256StatementFactValue,
      });
    } else if (isSection1256ContractFactKey(fact.key)) {
      out.push({
        kind: "contract",
        key: fact.key,
        value: fact.value as Section1256ContractFactValue,
      });
    }
  }
  return out;
}
