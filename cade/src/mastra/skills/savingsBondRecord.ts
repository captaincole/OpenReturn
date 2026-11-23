import { ingestSavingsBondRecord } from "../tools/ingestSavingsBondRecord";
import { topicSkill } from "./topicSkill";

export const savingsBondRecordSkill = topicSkill({
  name: "savings-bond-record",
  description:
    "A record of U.S. savings bonds cashed (Form 8818, or a bank or TreasuryDirect redemption record), or the user cashed series EE or I savings bonds in 2025 and paid for college or other postsecondary education: the education savings bond exclusion (Form 8815).",
  tools: { ingestSavingsBondRecord },
  instructions: `- **Record of bonds cashed** (Form 8818, or the redemption record from the bank or TreasuryDirect) → \`ingest-savings-bond-record\`. One call per record, with every row in \`bonds\`. Copy each row as printed: serial number, series, paper or electronic, issue date, face value and the bond's total redemption proceeds. Include a bond issued before 1990: the return leaves it out. Never work out interest or a total.
- **The interest**: the record does not replace the Form 1099-INT. Ingest the 1099-INT from each payer too; box 3 holds the bonds' interest.
- **Ownership test** (\`ownerQualifies\`, each bond): the bond is in the filer's name, or both spouses' names, and the owner was 24 or older before the issue date. A bond in a child's name fails it. Ask before the call when the record or the identity facts do not settle it.
- **Interest reported before** (\`interestReportedInPriorYears\`, each bond): ask once for the record whether they reported any of the bonds' interest on an earlier return. Leave it out when they did not.
- **No exclusion** on a married filing separately return: say so, and still ingest the record and the 1099-INT.
- **Education expenses**: the record does not carry them, and no pending key asks for them. After the record, ask who the bonds paid for and record one fact per student and institution with \`record-tax-facts\`, category \`education\`, key \`education.savings_bond_expense.<slug>\` (the student's first name and the school, lowercased: \`ana-city-college\`): \`{ studentName, institutionName, institutionAddress, qualifiedExpenses, nontaxableBenefits }\`. The student is the filer, the spouse or a dependent on this return. \`qualifiedExpenses\` is tuition and fees paid in 2025, and contributions to a Coverdell ESA or a 529 plan (the institution is then "Coverdell ESA" or "QTP" and the plan's name). Leave out room and board, expenses used for an education credit, and expenses paid with a tax-free Coverdell or 529 distribution. \`nontaxableBenefits\` is the part covered by tax-free grants or other benefits not paid directly to or by the school; leave it out when none. A Form 1098-T can confirm the tuition; record only amounts they state.`,
});
