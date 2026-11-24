import { ingestCleanVehicleReport } from "../tools/ingestCleanVehicleReport";
import { topicSkill } from "./topicSkill";

export const cleanVehicleReportSkill = topicSkill({
  name: "clean-vehicle-report",
  description:
    "A clean vehicle seller report (the dealer's time-of-sale report), or the user bought an electric or plug-in vehicle in 2025. Also when `pendingFacts` lists a `clean_vehicle_credit.*` key.",
  tools: { ingestCleanVehicleReport },
  instructions: `- **Seller report** (the dealer gives one for each new or previously owned clean vehicle; Form 8936 and its Schedule A) → \`ingest-clean-vehicle-report\`. One call per vehicle. Copy the values as printed and do not work out a credit: the return figures it.
- **Answers the report does not carry**: ask them before the call and pass them in \`answers\`. For each vehicle: bought to use and not to resell, false for a leased vehicle (\`acquiredForUse\`); sold or traded within 30 days (\`resoldWithin30Days\`). A new vehicle: the business or investment use percentage, 0 for personal use (\`businessUsePercent\`). A previously owned vehicle: a previously owned clean vehicle credit claimed for a vehicle bought in the 3 years before (\`claimedUsedCreditInPrior3Years\`). An answer that comes later: call the tool again with the same \`vehicleSlug\` and every value.
- **No report at hand**: a credit needs the dealer's report. Call \`request-document-upload\` for it once. Never take a credit amount or a sales price from memory.
- **Return answers**: when \`pendingFacts\` lists one of these keys, ask it and record it with \`record-tax-facts\`, category \`other\`: the 2024 Form 1040 line 11 (\`prior_year.federal_agi\`, a number), the 2024 filing status (\`clean_vehicle_credit.prior_year_filing_status\`: single, married_filing_jointly, married_filing_separately, head_of_household or qualifying_surviving_spouse), and whether someone can claim them as a dependent (\`clean_vehicle_credit.claimable_as_dependent\`, a boolean).
- A commercial clean vehicle (section 45W) has no seller report: say we do not handle it yet.`,
});
