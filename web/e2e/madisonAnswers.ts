/*
 * Values match engine/tests/scenarios/tcb-ca-005/{facts,decisions}.ts. The
 * return's conversation gets her answers and seven documents; the Form 1098
 * goes to the deductions conversation, which asks for it.
 */

import { resolve } from "node:path";
import type { Turn } from "./session";

const DOCS = resolve(__dirname, "../../engine/tests/scenarios/tcb-ca-005/docs");
const doc = (file: string) => resolve(DOCS, file);

export const FORM_1098 = doc("07-chase-bank-1098.pdf");

export const OPENING: Turn = {
  text:
    "Hi Cade. Please help me file our 2025 federal and California returns. " +
    "We are married filing jointly. I am Madison Gray, born 03/10/1983. My spouse is " +
    "Salvester Slone, born 09/22/1986. We lived at 1111 Grove Park Rd, Los Angeles, CA 90210 " +
    "(Los Angeles County) all of 2025, so we are full-year California residents, and our " +
    "mailing address is the same. Our niece Jessica Davies (SSN 900-45-6789, born 08/12/2014, " +
    "a U.S. citizen) lived with us all year. We had health coverage all 12 months, owe no " +
    "use tax, and had no crypto and no foreign accounts. Refund any overpayment. I will " +
    "upload seven tax documents, one in each message. I will do our deductions in the " +
    "Deductions tab, so please do not ask about them here.",
};

/* The documents of the return's conversation, in the order a taxpayer finds them. */
export const RETURN_DOCUMENTS: Turn[] = [
  { file: doc("01-employers-name-w2.pdf"), text: "Here is my W-2 from Employers Name." },
  { file: doc("02-temp-agency-w2.pdf"), text: "Here is my spouse's W-2 from the temp agency." },
  { file: doc("03-social-finance-1099-int.pdf"), text: "Here is my 1099-INT from Social Finance." },
  { file: doc("04-ibm-1099-div.pdf"), text: "Here is my 1099-DIV from IBM." },
  { file: doc("05-etrade-1099-b.pdf"), text: "Here is my spouse's 1099-B from Etrade." },
  {
    file: doc("06-adp-services-1099-r.pdf"),
    text: "Here is my spouse's 1099-R from ADP Services.",
  },
  { file: doc("08-ssa-1099.pdf"), text: "Here is my SSA-1099." },
];

const RETURN_ANSWERS: Array<[RegExp, string]> = [
  [/filing status|married/i, "We are married filing jointly."],
  [/birth|\bdob\b/i, "I was born 03/10/1983, and my spouse 09/22/1986."],
  [/county/i, "Los Angeles County."],
  [/coverage|insurance/i, "Yes, we had health coverage all 12 months of 2025."],
  [/use tax|out-of-state|online purchase/i, "No out-of-state purchases. We owe no use tax."],
  [/crypto|digital asset/i, "No, we had no digital assets in 2025."],
  [/foreign/i, "No foreign accounts and no foreign trusts."],
  [/dependent|niece|jessica/i, "Our niece Jessica Davies lived with us all 12 months of 2025."],
  [/resident|move|moved|part-year/i, "We were full-year California residents in Los Angeles."],
  [/mailing|address/i, "Our mailing address is 1111 Grove Park Rd, where we live."],
  [/refund|2026 estimated|apply/i, "Refund the full federal and California overpayments."],
  [/stock option|incentive|3921/i, "We exercised incentive stock options: a $275,000 spread."],
  [/shares|quantity/i, "The 1099-B does not show the number of shares, and I do not know it."],
  [/\bhsa\b|health savings/i, "We have no HSA."],
  [/last year's|prior.year|2024/i, "I do not have last year's return at hand."],
  [/deduction|itemiz|mortgage|charit|medical/i, "I will do deductions in the Deductions tab."],
];

/* Her answers to the questions in Cade's message, or undefined when no rule matches. */
export function returnAnswer(cadeMessage: string): string | undefined {
  const answers = RETURN_ANSWERS.filter(([pattern]) => pattern.test(cadeMessage)).map(
    ([, answer]) => answer,
  );
  return answers.length > 0 ? [...new Set(answers)].join(" ") : undefined;
}

/* The return's conversation answers what it can; the next document goes with it. */
export function returnReply(cadeMessage: string, next: Turn): Turn {
  const answers = returnAnswer(cadeMessage);
  return { ...next, text: answers ? `${answers} ${next.text}` : next.text };
}

/* Each life question by its words; a question with no rule fails the run. */
export const LIFE_ANSWERS: Array<[RegExp, boolean]> = [
  [/itemize deductions on last year/i, true],
  [/own your home/i, true],
  [/register a car/i, false],
  [/give money/i, true],
  [/give things/i, true],
  [/carried over from an earlier year/i, false],
  [/medical or dental/i, true],
  [/margin loan/i, true],
  [/investment adviser/i, false],
];

export const lifeAnswer = (question: string): boolean | undefined =>
  LIFE_ANSWERS.find(([pattern]) => pattern.test(question))?.[1];

/* At the open door: one expense that counts somewhere else (Schedule 1), then done. */
export const NAMED_EXPENSE = "Student loan interest";

const AMOUNT_ANSWERS: Array<[RegExp, string]> = [
  [/real estate|property tax/i, "We paid $1,900 of real estate tax on our home in 2025."],
  [/cash|check|card/i, "We gave $25,000 to charity by cash and check."],
  [/goods|securities|clothes|stock/i, "We gave $5,000 of goods and securities to charity."],
  [/medical|dental/i, "We paid $8,286 of medical and dental bills ourselves."],
  [
    /margin|borrowed|investment interest|carr(y|ied) ?over|3526/i,
    "We paid $1,250 of margin interest in 2025. Last year's Form 4952 and last year's " +
      "California FTB 3526 each carried over $650 of disallowed interest.",
  ],
  [/elect|qualified dividends/i, "We elect $1,570 of qualified dividends as investment income."],
  [/investment expenses/i, "We had no other investment expenses."],
  [/rough|exact|estimate/i, "These are exact amounts."],
  [/\bclose\b/i, "Yes, please close the deductions."],
];

export interface AmountProgress {
  sent1098: boolean;
  /** Each answer goes once, as a taxpayer gives it: Cade's summary of them asks nothing. */
  answered: Set<string>;
}

/* The deductions conversation's amounts; the Form 1098 goes with the first ask for it. */
export function amountReply(cadeMessage: string, progress: AmountProgress): Turn | undefined {
  const answers = AMOUNT_ANSWERS.filter(([pattern]) => pattern.test(cadeMessage))
    .map(([, answer]) => answer)
    .filter((answer) => !progress.answered.has(answer));
  const asks1098 = !progress.sent1098 && /1098|mortgage/i.test(cadeMessage);
  const text = [...(asks1098 ? ["Here is our Form 1098 from Chase Bank."] : []), ...answers];
  if (text.length === 0) return undefined;
  answers.forEach((answer) => progress.answered.add(answer));
  if (asks1098) progress.sent1098 = true;
  return { text: [...new Set(text)].join(" "), ...(asks1098 ? { file: FORM_1098 } : {}) };
}
