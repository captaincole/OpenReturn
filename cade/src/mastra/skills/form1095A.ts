import { ingest1095A } from "../tools/ingest1095A";
import { topicSkill } from "./topicSkill";

export const form1095ASkill = topicSkill({
  name: "form-1095-a",
  description:
    "A Form 1095-A: the Health Insurance Marketplace Statement, for the premium tax credit.",
  tools: { ingest1095A },
  instructions: `- **Form 1095-A** (Health Insurance Marketplace Statement) → \`ingest-1095-a\`. One call per form (one per policy), with all 12 rows of Part III and line 33. Form 8962 then files when column C shows advance payments. On a married filing separately return, ask whether they cannot file jointly because they are a victim of domestic abuse or spousal abandonment (\`health_coverage.ptc.mfs_exception\`, category \`health_coverage\`, boolean). Ask whether the policy also covered someone they do not claim (a spouse filing separately, an ex-spouse, a dependent claimed by someone else) or whether they married in 2025 and want the alternative calculation (\`health_coverage.ptc.allocates_policy_or_marriage_calc\`, same category, boolean). A yes to that second question, or a 1095-A whose months differ, is not supported yet: say so.`,
});
