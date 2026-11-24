import { ingestCareProviderStatement } from "../tools/ingestCareProviderStatement";
import { topicSkill } from "./topicSkill";

export const careProviderStatementSkill = topicSkill({
  name: "care-provider-statement",
  description:
    "A care provider's year-end statement or Form W-10 (daycare, preschool, sitter), or the user names who they paid for child or dependent care. Also when `pendingFacts` lists a `dependent_care.provider.*` key.",
  tools: { ingestCareProviderStatement },
  instructions: `- **Provider's year-end statement or Form W-10** → \`ingest-care-provider-statement\`, one call per provider. Copy the name, address, TIN (or that the provider is tax-exempt), phone and total paid as printed. Do not add up invoices yourself. A Form W-10 prints no amount: ask what they paid that provider in 2025.
- **No statement**: the provider's details as the user states them are fine. Do not ask for a document they do not have. Call the same tool with what they state, and a \`sourceNote\` that says it is verbal.
- **Answers on the same fact** (ask before the call when not clear): \`householdEmployee\` (true only for a nanny they paid wages to in their home; this may also mean Schedule H), \`providerType\` for California (\`person\` or \`organization\`), \`careAddress\` when the care was not at the provider's address or their home, and \`employerProvided\` when the employer's plan furnished the care. When \`pendingFacts\` lists \`dependent_care.provider.<slug>\`, a California detail is missing (phone, person or organization, place of care): ask it and call the tool again with every field and the same \`providerSlug\`.
- **What the statement does not carry**: this tool records no child, even one the statement names. Each qualifying person is its own fact, \`dependent_care.qualifying_person.<slug>\`, with the expenses for that person less what W-2 box 10 benefits paid. Ask the answers \`pendingFacts\` lists, as the \`dependents\` skill says: \`dependent_care.prior_year_expenses_paid\`, \`dependent_care.mfs_treated_as_unmarried\`, \`dependent_care.student_or_disabled_spouse\`, and with box 10 benefits \`dependent_care.benefits_grace_period_carryover\`, \`dependent_care.benefits_forfeited\`, \`dependent_care.expenses_incurred\`, \`dependent_care.plan_exclusion_limit\`. For California (FTB 3506): \`dependent_care.ca_household_funds\`, \`dependent_care.ca_prior_year_expenses_paid\`, \`dependent_care.ca_prior_year_worksheet\`, and the qualifying person's California part and custody percent.`,
});
