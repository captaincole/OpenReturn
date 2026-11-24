# Form 2210 (2025): open questions

Each item is a place where the form and the 2025 instructions do not settle a rule. It names the source text, the default the engine applies, and whether the default changes a dollar amount.

## 1. Withholding on a due date that pays an earlier underpayment

- Source: "Do not enter any withheld federal income tax and excess social security or tier 1 RRTA on line 1b" (irs-2210-inst-2025::sec::line-1b::b01).
- Default: withholding counts as paid on each due date (one-fourth each). On that day it first pays an earlier unpaid underpayment, as Section A line 15 does, and the worksheet counts the days to that date.
- Changes dollars: yes. Read literally, that part would stay unpaid to April 15, 2026, and the penalty would be higher.

## 2. The payment with the return

- Source: "Any payment made on your balance due return for 2025. Use the date you filed (or will file) your return or April 15, 2026, whichever is earlier" and the January 31 rule (line-11::b01, table-1-estimated-tax-payments::b02).
- Default: the engine has no filing date. It treats the balance as paid on April 15, 2026, the last day the worksheet counts. The January 31 rule never applies.
- Changes dollars: yes, for a filer who files and pays before April 15, 2026 (a lower penalty).

## 3. Line 38 when no box B, C or D applies

- Source: "If you didn't check box B, C, or D in Part II, you don't need to figure the penalty. ... Leave the penalty line on your return blank" (the-irs-will-figure-the-penalty-for::b01); "If you want to figure it, you may use Part III as a worksheet" (the blank form).
- Default: the engine figures the penalty only when box B, C or D applies. Otherwise Form 1040 line 38 stays blank and the IRS sends a bill.
- Changes dollars: yes, on Form 1040 line 37 (the penalty is not in the amount owed).

## 4. Rounding

- Source: the IRS whole-dollar rule (CLAUDE.md); the worksheet's lines 4, 7, 10 and 13 are "$" amounts.
- Default: each payment is rounded to whole dollars; line 10 is 25% of line 9 to the nearest dollar in each column; withholding splits into four whole-dollar parts that add up to line 6; the worksheet keeps cents and rounds line 14 once.
- Changes dollars: by at most a dollar.

## 5. Household employment taxes on line 2

- Source: "Don't include household employment taxes if both of the following are true: (1) you didn't have federal income tax withheld from your income, and (2) you wouldn't be required to make estimated tax payments even if the household employment taxes weren't included" (line-2::b01).
- Default: (2) is read as "Part I without them shows no possible penalty (line 9 not more than line 6, or the form stops)".
- Changes dollars: yes, in rare cases.

## 6. Line 3 and Schedule 3 lines 13a, 13c, 13d and 13z

- Source: line 3 lists refundable credits "for example" (line-3::b01) and names neither Form 2439 nor the other Schedule 3 line 13 amounts.
- Default: the form is unsupported when one of them has an amount.
- Changes dollars: not applicable (unsupported).

## 7. Box A with box C or D

- Source: "If you checked box A, complete only page 1 of Form 2210" (waiver-of-penalty::b01).
- Default: box A (waive the whole penalty) leaves boxes C and D clear and page 2 blank; Form 1040 line 38 stays blank.
- Changes dollars: no.

## 8. Choosing box C, box D, or both

- Source: box C "your penalty is reduced or eliminated when figured using the annualized income installment method"; box D "Your penalty is lower when figured by treating the federal income tax withheld ... as paid on the dates it was actually withheld" (the blank form).
- Default: the engine figures every method the facts allow and keeps the lowest penalty. A tie keeps the method with fewer boxes.
- Changes dollars: no (it picks the lowest).

## 9. Schedule AI line 9, the QBI deduction for a period

- Source: "Enter your deduction for qualified business income" (line-9::b01). Line 9 is added to line 8, which is annualized.
- Default: the period fact holds the deduction figured on the period's annualized income, and line 9 takes it as stated.
- Changes dollars: yes, when a filer states the period's deduction before annualizing.

## 10. Schedule AI lines 14 and 16 that the instructions leave open

- Source: line 14 "You may adjust your 2025 taxable income here for any provision you did not account for elsewhere" (Schedule 1-A deductions, line-14::b01); line 16 names Part I line 2 taxes, Form 4972, Form 8814 and AMT, but not Schedule 2 line 1 (the excess advance premium tax credit), which is in Part I line 1 (line-16::b01).
- Default: Schedule AI is unsupported with a Schedule 1-A deduction, Form 8615, a Form 4952 line 4g election, or an amount on Schedule 2 line 1z.
- Changes dollars: not applicable (unsupported).

## 11. Schedule AI column (d) line 18

- Source: "the same type of credits as allowed on Form 2210, Part I, lines 1 and 3" (line-18::b01).
- Default: Form 1040 line 18 minus line 22 (the nonrefundable credits that line 22 used) plus Part I line 3.
- Changes dollars: no; it keeps column (d) line 19 equal to Part I line 4.

## 12. The 2024 AGI for the 110% test after a change to or from a joint return

- Source: "If the AGI shown on your 2024 tax return is more than $150,000" (line-19::b02); the joint-return rules for the 2024 tax (line-19::b03).
- Default: the stated 2024 AGI (prior_year.federal_agi). For two 2024 returns, Cade records the two AGIs added.
- Changes dollars: yes, when one spouse's 2024 AGI is under $150,000 and the sum is over it.

## 13. Farmers and fishers

- Source: "If at least two-thirds of your gross income for 2024 or 2025 is from farming and fishing, substitute 66 2/3% for 90%" and Form 2210-F (who-must-pay-the-underpayment::b01, exceptions-to-the-penalty::b02).
- Default: the form is unsupported when Schedule F or Form 4835 files; the engine does not figure the two-thirds share.
- Changes dollars: not applicable (unsupported).

## 14. Smaller defaults

- The 2024 overpayment applied always counts on April 15, 2025; the engine has no date for a 2024 balance paid later (table-1-estimated-tax-payments::b02). Changes dollars: rarely.
- Section 965 net tax liability and section 1062(a) elections are not taken out or added (line-1::b01, line-3::b01): the engine has no facts for them. Changes dollars: only with those elections.
- Line 28 below $400 is tested on net earnings (profit × 92.35%), as Schedule SE line 4c does (line-28::b01). Changes dollars: no in practice.
- "Line 8 (additional tax on distributions only)" (line-2::b01): the engine's Schedule 2 line 8 holds only Form 5329 Part I, so it is taken whole. Changes dollars: no today.
- Schedule AI Part II prints all four columns when any period has net earnings from self-employment.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I lines 1–9 and the line 9 boxes | stated rule |
| Part II box A, B, E | stated rule |
| Part II box C, D (lowest penalty) | own reading (item 8) |
| Part III line 10 (regular), line 11 | published example with numbers (Example 1) |
| Part III lines 12–18 | published example with numbers (Example 3) |
| Part III line 19 (penalty worksheet) | published example with numbers (Examples 2–4, Table 2); item 1 and 2 defaults |
| Schedule AI lines 1–8, 10–13, 17, 19–27 | stated rule |
| Schedule AI line 9 | own reading (item 9) |
| Schedule AI line 14 | stated rule; unsupported cases (item 10) |
| Schedule AI lines 15–16, 18 | stated rule; column (d) own reading (items 10, 11) |
| Schedule AI Part II lines 28–36 | stated rule |
| Form 1040 lines 26, 35a, 37, 38 | stated rule (irs-1040-inst-2025::sec::line-26::b01, figuring-the-penalty::b01) |
