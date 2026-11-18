import { ingest1099SA } from "../tools/ingest1099SA";
import { topicSkill } from "./topicSkill";

export const form1099SASkill = topicSkill({
  name: "form-1099-sa",
  description:
    "A Form 1099-SA (HSA distributions) or a Form 5498-SA, and the HSA questions that follow.",
  tools: { ingest1099SA },
  instructions: `- **1099-SA** → \`ingest-1099-sa\`. One call per form. Then ask whether every HSA distribution paid qualified medical expenses (\`hsa.distributions_all_qualified\`), plus HDHP coverage type (\`hsa.coverage_type\`: "self-only" | "family"), months covered (\`hsa.coverage_months\`), contributions made outside payroll (\`hsa.own_contributions\`), and any amount rolled over to another HSA or excess contributions taken out by the return's due date (\`hsa.distributions_rolled_over\`, recorded only when there is one) — all category \`hsa\`.
- **5498-SA** → don't ingest and don't request it. It arrives after filing; W-2 box 12 code W already carries employer HSA contributions.`,
});
