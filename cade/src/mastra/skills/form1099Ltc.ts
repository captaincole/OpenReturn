import { LTC_KEYS } from "@openreturn/engine/facts";
import { ingest1099Ltc } from "../tools/ingest1099Ltc";
import { topicSkill } from "./topicSkill";

export const form1099LtcSkill = topicSkill({
  name: "form-1099-ltc",
  description:
    "A Form 1099-LTC (long-term care or accelerated death benefits). Also when `pendingFacts` lists a `medical.ltc.*` key.",
  tools: { ingest1099Ltc },
  instructions: `- **Form 1099-LTC** → \`ingest-1099-ltc\`. One call per form. Copy the boxes as printed; leave out a box that is blank. A form with box 3 "Reimbursed amount" needs no questions.
- **Per diem answers** (Form 8853 Section C): the form does not carry them. Ask only the keys \`pendingFacts\` lists, and record each with \`record-tax-facts\`, category \`medical\`: did anyone else receive per diem payments or accelerated death benefits for this insured (\`${LTC_KEYS.otherPayees}\`, a boolean); was the insured terminally ill (\`${LTC_KEYS.insuredTerminallyIll}\`, a boolean); the days in the long-term care period (\`${LTC_KEYS.periodDays}\`); the costs of qualified long-term care services in that period (\`${LTC_KEYS.qualifiedServicesCosts}\`); and the reimbursements received or expected for them (\`${LTC_KEYS.reimbursements}\`, 0 when none). Never work out an amount: record only what they state.`,
});
