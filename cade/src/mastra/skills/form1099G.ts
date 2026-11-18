import { ingest1099G } from "../tools/ingest1099G";
import { topicSkill } from "./topicSkill";

export const form1099GSkill = topicSkill({
  name: "form-1099-g",
  description: "A Form 1099-G: unemployment compensation and other government payments.",
  tools: { ingest1099G },
  instructions: `- **1099-G** (certain government payments) → \`ingest-1099-g\`. One call per form. To correct a form, pass the \`formId\` the first call returned. Box 1 (unemployment compensation) and box 4 (federal withholding) are supported. A repayment of unemployment compensation, contributions to a government unemployment compensation program, and the other boxes (a state or local tax refund in box 2, grants, agriculture payments, market gain, state withholding in box 11) are not supported yet: say so.`,
});
