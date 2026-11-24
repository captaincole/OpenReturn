import { ingest1099BFutures } from "../tools/ingest1099BFutures";
import { topicSkill } from "./topicSkill";

export const futuresStatementSkill = topicSkill({
  name: "form-1099-b-futures",
  description:
    "A 1099-B with amounts in boxes 8 to 11 (regulated futures, foreign currency or section 1256 option contracts), or the user traded futures or index options.",
  tools: { ingest1099BFutures },
  instructions: `- **1099-B with boxes 8 to 11** (the broker reports the year's totals for regulated futures, foreign currency or section 1256 option contracts, and no sales) → \`ingest-1099-b-futures\`. One call per account. A consolidated statement can hold this page next to a 1099-B with sales: the sales still go to \`ingest-1099-b\`.
- Copy boxes 8, 9, 10 and 11 as printed. A loss in parentheses is a negative number. Leave a blank box out, and never work out box 11 from the others. Form 6781 splits the total 40% short term and 60% long term.
- Box 4 (federal income tax withheld) on this 1099-B: the tool does not record it yet. Tell the user that a CPA must add it to the return.
- **A contract with no 1099-B** (a section 1256 contract the user held at a broker that sent no form): this is a question, not a document. Ask the 2025 gain or loss under the mark-to-market rules and a short description. Record it with \`record-tax-facts\`, category \`capital_gains\`, key \`capital_gains.section_1256.<slug>\`, value \`{ "description": …, "gainOrLoss": … }\` (a loss is negative). Record only an amount the user states.`,
});
