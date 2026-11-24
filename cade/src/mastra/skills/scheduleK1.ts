import { ingestScheduleK1 } from "../tools/ingestScheduleK1";
import { recordK1Holding } from "../tools/recordK1Holding";
import { topicSkill } from "./topicSkill";

export const scheduleK1Skill = topicSkill({
  name: "schedule-k1",
  description:
    "A Schedule K-1 (Form 1120-S, 1065 or 1041), or the user owns part of an S corporation or a partnership, or is the beneficiary of a trust or an estate. Also when `pendingFacts` lists a `k1.*` key.",
  tools: { ingestScheduleK1, recordK1Holding },
  instructions: `- **Schedule K-1** (from an S corporation, Form 1120-S; a partnership, Form 1065; or an estate or trust, Form 1041) → \`ingest-schedule-k1\`. One call per K-1. Set \`form\` from the K-1's title and fill only that form's object. Copy every Part III box as printed, one entry per box and code, a loss as a negative amount, and a box that prints only STMT with no amount. Never add, net or move amounts: the return routes each box. Copy the section 199A statement when the K-1 has one. The call returns an \`entityId\`: pass it again to correct the K-1.
- **The owner's answers** (no K-1 prints them) → \`record-k1-holding\` with the same \`entityId\`. A field you leave out keeps its earlier answer. After each K-1, and while \`pendingFacts\` lists \`k1.holding.<entityId>\`, ask the questions that apply:
  - On a joint return, whose K-1 it is: Part II names the person.
  - An S corporation or partnership with business or rental income or loss: did the owner materially participate (the seven tests, for example more than 500 hours)?
  - A loss or deduction from the activity: is all of the owner's investment at risk?
  - An S corporation with a loss, a deduction, a distribution (box 16 code D) or a loss carried from last year: stock basis at the start of 2025 (last year's Form 7203 line 15), capital contributed or stock bought in 2025, how the stock was acquired, loans to the corporation at the start of 2025 and new loans (0 if none), and with loans the debt basis at the start of 2025 (Form 7203 line 21).
  - Losses held back in earlier years: by item for the basis limit (last year's Form 7203 Part III column (e)), the at-risk loss (Form 6198) and the passive loss (Form 8582), and the qualified (QBI) part of a carried ordinary loss. Did they sell or give up the whole interest in 2025?
  Record only what the user states or a document shows. A trust or estate K-1 needs only whose it is, and only on a return that is not joint.
- **Limits**: where the return marks a K-1 line unsupported (for example a partnership loss, a passive activity, a loss from a trust, a foreign tax credit, Schedule K-3), say that we do not handle it yet and a CPA must figure that part.`,
});
