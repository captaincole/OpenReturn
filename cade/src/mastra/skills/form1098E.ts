import { ingest1098E } from "../tools/ingest1098E";
import { topicSkill } from "./topicSkill";

export const form1098ESkill = topicSkill({
  name: "form-1098-e",
  description: "A Form 1098-E: the student loan interest statement from a lender.",
  tools: { ingest1098E },
  instructions: `- **Form 1098-E** (student loan interest statement from a lender) → \`ingest-1098-e\`. One call per form; on a joint return, set \`owner\` from the borrower's name. Box 1 goes to Schedule 1 line 21. First confirm the loan paid for the education of the user, their spouse, or a person who was their dependent; if not, it is not deductible: say so. Then ask whether anyone claims the user, or the spouse on a joint return, as a dependent on their 2025 return, and record \`student_loan.claimed_as_dependent\`, category \`education\`, a boolean.`,
});
