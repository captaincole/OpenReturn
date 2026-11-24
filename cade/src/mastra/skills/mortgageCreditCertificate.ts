import { ingestMortgageCreditCertificate } from "../tools/ingestMortgageCreditCertificate";
import { topicSkill } from "./topicSkill";

export const mortgageCreditCertificateSkill = topicSkill({
  name: "mortgage-credit-certificate",
  description:
    "A Mortgage Credit Certificate (MCC) from a state or local housing agency, or a mortgage interest credit carried forward from the 2024 Form 8396. Also when `pendingFacts` lists `mortgage.credit_certificate` or a `prior_year.mortgage_credit_carryforward_*` key.",
  tools: { ingestMortgageCreditCertificate },
  instructions: `- **Mortgage Credit Certificate** (from a state or local housing agency; Form 8396) → \`ingest-mortgage-credit-certificate\`. One call; a second certificate is not supported: say so. Copy the issuer, certificate number, date of issue, certificate credit rate and certified indebtedness as printed. The credit rate is not the loan's interest rate.
- **Not on the certificate**, so get each before the call, and never fill one from a guess or from another amount:
  - \`interestPaid\`: box 1 of the Form 1098 for this loan, not box 6. If the Form 1098 is not in yet, ask for it first.
  - \`originalLoanAmount\`: ask the loan's original amount (the loan papers show it). It can be more than the certified indebtedness.
  - Ask whether anyone other than a spouse on a joint return also owns the home. If yes, pass \`ownershipShare\` (their share, 0 to 1) and only their share of the interest.
  - Ask whether the loan was refinanced and the certificate reissued. If yes, pass \`reissued\` with the credit the original certificate would allow this year, as the user or the issuer states it.
- **Carryforwards**: the return also asks the credit carried forward on the 2024 Form 8396: \`prior_year.mortgage_credit_carryforward_2022\` (line 16), \`prior_year.mortgage_credit_carryforward_2023\` (line 14) and \`prior_year.mortgage_credit_carryforward_2024\` (line 17). Ask for each; 0 is an answer, also when they filed no 2024 Form 8396. Record each with \`record-tax-facts\`, category \`other\`, a number.
- When \`pendingFacts\` lists \`mortgage.credit_certificate\`, ask for the certificate.`,
});
