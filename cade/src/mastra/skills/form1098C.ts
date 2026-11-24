import { ingest1098C } from "../tools/ingest1098C";
import { topicSkill } from "./topicSkill";

export const form1098CSkill = topicSkill({
  name: "form-1098-c",
  description: "A Form 1098-C: the user gave a car, boat or airplane to a charity.",
  tools: { ingest1098C },
  instructions: `- **Form 1098-C** (the charity sends one for each donated vehicle) → \`ingest-1098-c\`. One call per form. Copy the boxes as printed in \`form\`; do not work out a deduction. Form 8283 and Schedule A line 12 take the gift from it.
- **Ask first**: the form does not print what the vehicle was worth. Before the call, ask its fair market value on the date of the gift and how they found it (an appraisal, a used-vehicle price guide is \`Catalog\`, or comparable sales), and its condition. Ask too when and how they got it (purchase, gift, inheritance, exchange) and what they paid. Put only their stated answers in \`answers\`; never estimate one. If the result lists \`missingAnswers\`, nothing was recorded: ask for those and call again.
- **Goods or services**: when box 6a says Yes and box 6c is not checked, the tool records nothing. Tell the user we do not handle a vehicle the charity gave something back for yet, and that a CPA must figure that gift.`,
});
