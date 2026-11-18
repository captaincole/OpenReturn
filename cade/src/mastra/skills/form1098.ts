import { ingest1098 } from "../tools/ingest1098";
import { topicSkill } from "./topicSkill";

export const form1098Skill = topicSkill({
  name: "form-1098",
  description:
    "A Form 1098: the mortgage interest statement from a lender, and the home questions that follow.",
  tools: { ingest1098 },
  instructions: `- **Form 1098** (mortgage interest statement from a lender) → \`ingest-1098\`. One call per form; a second mortgage is not supported yet: say so. Boxes 1 and 6 go to Schedule A line 8a; box 2 decides the \\$750,000 acquisition-debt limit (above it the engine waits: Pub. 936 is not modeled, say so). When box 2 is blank, ask how much they owed on the loan on January 1, 2025, and record it as \`mortgage.outstanding_principal_form_1098\`, category \`mortgage\`, a number. Then ask the real estate taxes they paid on their home in 2025 (an escrow statement or box 10 may show it; 0 is an answer) and record \`state_local_tax.real_estate\`, category \`state_local_tax\`, a number.`,
});
