/*
 * Shared pieces of the Ask dataset (cases.ts): the case type, block-id
 * helpers, and passage groups more than one case accepts.
 */

export type Coverage = "covered" | "partial" | "not_covered";
export type Tier = 1 | 2 | 3;
export type Kind = "standard" | "false_premise" | "insufficient";

export interface AskCase {
  name: string;
  tier: Tier;
  kind: Kind;
  question: string;
  coverage: Coverage[];
  authority: string[][];
  facts: string[][];
}

export const CA540 = "ca-540-inst-2025::sec::";
export const blocks = (section: string, ns: number[]) => ns.map((n) => `${section}::b0${n}`);

export const IRA_LIMIT = [
  "irs-pub-590a-2025::sec::what-s-new-for-2025::b01",
  "irs-1040-inst-2025::sec::benefits-of-direct-deposit::b02",
  ...blocks("irs-1040-inst-2025::sec::your-ira-spouse-s-ira", [2, 3]),
  "irs-pub-590a-2025::sec::general-limit::b01",
  "irs-pub-590a-2025::sec::question-answer::b01",
  "irs-pub-17-2025::sec::how-much-can-be-contributed::b01",
  "irs-pub-17-2025::sec::excess-contributions::b01",
];
export const CA_EXEMPTION_LIMIT = [
  ...blocks(`${CA540}line-32-exemption-credits`, [1, 2, 3]),
  `${CA540}agi-limitation-worksheet::b01`,
];
export const FEDERAL_110 = [
  "irs-1040es-form-2025::sec::special-rules::b01",
  "irs-1040es-form-2025::sec::line-12b::b01",
  "irs-2210-inst-2025::sec::who-must-pay-the-underpayment::b01",
  "irs-pub-505-2025::sec::higher-income-taxpayers::b01",
];
export const CA_GAINS = [
  "ca-540-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01",
  "ca-540-sched-d-inst-2025::sec::purpose::b01",
  "ca-540nr-booklet-2025::sec::line-7a-capital-gain-or-loss::b01",
];

export const insufficient = (
  name: string,
  tier: Tier,
  question: string,
  coverage: Coverage[] = ["not_covered"],
): AskCase => ({ name, tier, kind: "insufficient", question, coverage, authority: [], facts: [] });
