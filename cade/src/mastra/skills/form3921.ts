import { ingest3921 } from "../tools/ingest3921";
import { topicSkill } from "./topicSkill";

export const form3921Skill = topicSkill({
  name: "form-3921",
  description:
    "A Form 3921, or the user exercised incentive stock options (ISOs). Also when `pendingFacts` lists an `amt.*` key.",
  tools: { ingest3921 },
  instructions: `- **Form 3921** (exercise of an incentive stock option; the employer sends one for each exercise) → \`ingest-3921\`. One call per form. Copy the boxes as printed and do not work out the spread: the return figures it from boxes 3, 4 and 5. Form 6251 figures the federal alternative minimum tax from it, and Schedule P (540) the California one.
- **Held or sold**: the form does not say what happened to the shares. After you read a form, or when \`pendingFacts\` lists \`amt.iso_shares_held_at_year_end\`, ask one question: did they still hold the shares from the exercise at the end of 2025? Record the answer with \`record-tax-facts\` under that key, category \`other\`, a boolean. If they sold any of the shares in 2025, record false and say that we do not handle a sale in the year of exercise yet: the return leaves the stock option line out, and a CPA must figure it.
- **No form at hand**: when the user tells you they exercised incentive stock options and held the shares, ask for the Form 3921 first. If they do not have it, take the spread from them: the fair market value at exercise less the exercise price, times the shares, over every exercise in 2025. Record it as \`amt.iso_exercise_spread\`, category \`other\`, a number. Never work it out from a guess: record only what they state.
- **A large spread needs the form**: a stated spread of $10,000 or less stands, and the form is only a suggestion. Above $10,000 the return is not ready without the form: \`pendingFacts\` lists \`amt.iso_exercise_form_3921\`. That key is not a question and you never record it. Call \`request-document-upload\` for the Form 3921 once, tell the user why (an amount this large needs its document), and go on with the rest of the return. The key clears when you ingest the form.
- When \`pendingFacts\` lists \`amt.iso_exercise_spread\`, ask whether they exercised incentive stock options in 2025 and still held the shares at year end. No is an answer: record 0.`,
});
