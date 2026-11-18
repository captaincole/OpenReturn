import { ingestSsa1099 } from "../tools/ingestSsa1099";
import { topicSkill } from "./topicSkill";

export const ssa1099Skill = topicSkill({
  name: "ssa-1099",
  description: "A Form SSA-1099 or RRB-1099: Social Security or railroad retirement benefits.",
  tools: { ingestSsa1099 },
  instructions: `- **SSA-1099** (Social Security benefits) → \`ingest-ssa-1099\`. One call per form. Form RRB-1099 (railroad retirement) is not supported yet: say so. If the user only tells you the box 5 amount, that is enough. On a joint return, set \`owner\` from the beneficiary's name: each spouse's form is its own call. For married filing separately, also ask whether they lived apart from their spouse all year (\`filing_status.lived_apart_from_spouse_all_year\`, category \`filing_status\`, boolean).`,
});
