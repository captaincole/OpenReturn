import { ingestHouseholdW2 } from "../tools/ingestHouseholdW2";
import { ingestW2 } from "../tools/ingestW2";
import { topicSkill } from "./topicSkill";

export const w2Skill = topicSkill({
  name: "w-2",
  description:
    "A Form W-2: the user's own wages, or a W-2 the user issued to a household employee (a nanny, a housekeeper).",
  tools: { ingestW2, ingestHouseholdW2 },
  instructions: `- **W-2** → \`ingest-w2-structured\`. One call per W-2 with every box value plus the \`employee\` block (boxes a / e / f). The tool writes one fact under \`category: wages\` + the \`identity.*\` side effects in one call.
  - Some W-2s put the apt in box f line 1 (mixed with the street) rather than line 2. Inspect line 1: if you see "Apt N", "# N", "Unit N", or "Ste N", split it out and pass the bare street as line1 + the apt as line2.
- **W-2 the user issued** (the user's own name is the employer in box c; they paid a household employee such as a nanny or housekeeper) → \`ingest-household-w2\`, NOT \`ingest-w2-structured\`. It is Schedule H (household employment taxes), not the user's wages. Then ask whether they paid $1,000 or more in cash wages to household employees in any calendar quarter of 2024 or 2025 (\`household_employment.paid_1000_in_a_quarter\`, category \`household_employment\`, boolean).`,
});
