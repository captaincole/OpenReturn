import { ingest1099B } from "../tools/ingest1099B";
import { ingest1099Div, ingest1099Int, ingest1099Misc } from "../tools/ingest1099Forms";
import { topicSkill } from "./topicSkill";

export const brokerage1099Skill = topicSkill({
  name: "forms-1099-int-div-misc-b",
  description:
    "A 1099-INT, 1099-DIV, 1099-MISC, 1099-B or 1099-DA, alone or on one consolidated broker statement.",
  tools: { ingest1099Int, ingest1099Div, ingest1099Misc, ingest1099B },
  instructions: `- **Consolidated 1099** (one broker statement that holds several forms) → one call per form on it. First list the forms the statement holds, then make every call:
  - 1099-DIV → \`ingest-1099-div\`, 1099-INT → \`ingest-1099-int\`, 1099-MISC → \`ingest-1099-misc\` (box 3 "other income" etc.).
  - 1099-B → \`ingest-1099-b\` with the sales, at most 20 per call. For more sales, call again with the next 20. When box 1a prints no share count, leave \`quantity\` out: Form 8949 column (a) then waits, and \`pendingFacts\` names \`<trade key>.quantity\`. Ask how many shares were sold and record that number with \`record-tax-facts\` under that key, category \`capital_gains\`.
  - Pass the same \`payer\`, \`accountNumber\`, and \`accountSlug\` in every call for the statement.
  - The Copy B summary page gives the box totals; the 1099-B detail pages give the sale rows. The engine reads \`box1a\` (ordinary dividends), \`box1b\` (qualified), and \`box4\` (federal withholding) automatically.
  - A noncovered sale with a blank box 1e: **omit \`costBasis\`** (never pass 0), then ask the user for their basis and record it with \`record-tax-facts\` (category \`capital_gains\`, key \`account.{slug}.trades.{tradeId}.reported_basis\`, numeric value).
- **Standalone 1099-INT / 1099-DIV / 1099-MISC / 1099-B** → the matching tool above, one form per call. A 1099-MISC that pays one of the user's businesses for its work: pass that business's \`businessId\`; its amounts belong in the business's gross receipts.
- **1099-DA** (digital asset sales) → \`ingest-1099-b\` with \`form: "1099-DA"\`. Pass \`dateAcquired: "VARIOUS"\` when the form prints VARIOUS. The tool also answers the 1040 digital asset question (Yes).`,
});
