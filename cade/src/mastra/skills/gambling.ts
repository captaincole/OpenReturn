import { ingestW2G } from "../tools/ingestW2G";
import { topicSkill } from "./topicSkill";

export const gamblingSkill = topicSkill({
  name: "gambling",
  description: "A Form W-2G, gambling winnings with no form, or gambling losses.",
  tools: { ingestW2G },
  instructions: `- **W-2G** (gambling winnings) → \`ingest-w2g\`. One call per form. To correct a form, pass the \`winId\` the first call returned. Winnings with no W-2G (a casino or app that issued none) are an answer: record the total as \`gambling.winnings_not_on_w2g\`, category \`other\`, a number.
- **Gambling losses** → \`gambling.losses\`, category \`other\`, a number. Schedule A deducts them only up to the gambling winnings.`,
});
