/*
 * Alex's side of the conversation. The values match
 * engine/tests/scenarios/alex/{facts,decisions}.ts.
 *
 * The test does not measure how smart the model is, so the replies are
 * direct and specific. The opening turns give every fact up front. After
 * that, replyTo() answers Cade's follow-up questions by keyword.
 */

import { resolve } from "node:path";

export interface Turn {
  text: string;
  file?: string;
}

const W2_PDF = resolve(__dirname, "../../engine/tests/scenarios/alex/docs/01-alex-w2.pdf");

const GENERATE = "That is everything. Please generate my 2025 tax documents now.";

export const OPENING_TURNS: Turn[] = [
  {
    text:
      "Hi Cade. Please help me file my 2025 federal and California returns. " +
      "Please record my filing status as single. I lived in Oakland, California " +
      "(Alameda County) for all of 2025, so I am a full-year California resident. " +
      "My mailing address is the same as where I live. My only income is one W-2. " +
      "I have no dependents, no stock or other sales, no crypto or digital assets, " +
      "no interest, no dividends, and no other income. I take the standard deduction. " +
      "I will upload my W-2 in my next message.",
  },
  {
    text: "Here is my 2025 W-2 from Brightside Logistics. Please ingest it.",
    file: W2_PDF,
  },
  {
    text:
      "Please record these facts: my date of birth is 01/01/2002, my occupation is " +
      "Engineer, and my phone number is 703-953-0253.",
  },
  {
    text:
      "More facts: I had health coverage through my employer for all 12 months of 2025. " +
      "I made no out-of-state purchases, so I owe no California use tax. I have no " +
      "California adjustments, so I do not need Schedule CA. Refund my full federal " +
      "and California overpayments. Use my login email on the forms.",
  },
];

/* replyTo joins the answer of every rule that matches, in this order. */
const ANSWERS: Array<[RegExp, string]> = [
  [/filing status|married/i, "Please record my filing status as single."],
  [/birth|\bdob\b/i, "My date of birth is 01/01/2002."],
  [/occupation|what do you do/i, "My occupation is Engineer."],
  [/phone/i, "My phone number is 703-953-0253."],
  [/county/i, "Alameda County."],
  [/coverage|insurance/i, "Yes, I had employer health coverage for all 12 months of 2025."],
  [/use tax|out-of-state|online purchase/i, "No out-of-state purchases. I owe no use tax."],
  [/crypto|digital asset/i, "No, I had no digital assets in 2025."],
  [/1099|brokerage|sale|stock|other (income|documents)/i, "No. The W-2 is my only tax document."],
  [/schedule ca/i, "I have no California adjustments, so I do not need Schedule CA."],
  [/resident|move|moved|part-year/i, "I was a full-year California resident in Oakland."],
  [/mailing|address/i, "My mailing address is the same as where I live, the address on my W-2."],
  [/refund|2026 estimated|apply/i, "Refund my full federal and California overpayments."],
  [/email/i, "Use my login email."],
  [/dependent/i, "I have no dependents."],
  [/deduction|itemiz/i, "I take the standard deduction."],
  [/generate|go ahead|proceed|ready|look (right|correct)|confirm/i, GENERATE],
];

/*
 * The reply to Cade's last message. A message with no question gets the
 * generate request. A question that no rule matches returns undefined,
 * so the test fails and shows the transcript.
 */
export function replyTo(cadeMessage: string): string | undefined {
  const matched = ANSWERS.filter(([pattern]) => pattern.test(cadeMessage)).map(([, a]) => a);
  if (matched.length > 0) return [...new Set(matched)].join(" ");
  return cadeMessage.includes("?") ? undefined : GENERATE;
}
