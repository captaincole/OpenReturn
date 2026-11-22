# Form 2106: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides.

## 1. The impairment-related share of line 10

- Source: "enter the part of the line 10 amount attributable to impairment-related work expenses on Schedule A (Form 1040), line 16" (irs-2106-inst-2025::sec::line-10::b04).
- Default: the impairment-related expenses inside line 4 take their share of column A after reimbursements: line 9A × expenses ÷ line 6A. A person whose qualification is impairment-related work expenses and who states no amount counts all of line 4. Vehicle, travel and meals (lines 1–3 and 5) never go: these expenses are workplace expenses (::line-10::b03), and the rest is not deductible (::general-instructions::b01).
- Why a doubt: the text does not say how a reimbursement splits between the two parts. A reimbursement that paid only for travel would leave the interpreter's cost whole.
- Changes dollars: yes (Schedule A line 16, Schedule 1 line 12).
- Blind fill (case 15: a fee-basis official, 6,000 travel, a 4,000 interpreter, 2,000 column A reimbursement) agrees with the default: Schedule A 2,400, Schedule 1 5,600. Other readings: a reimbursement of the travel only gives 3,000 and 5,000. An interpreter's cost also fits "expenses you paid or incurred for services performed in that job" (::line-10::b02), so all 8,000 on Schedule 1 is a third reading.

## 2. A stated impairment amount and a Form 2106 on one return

- Source: Pub. 463: "After you complete Form 2106, enter your impairment-related work expenses from Form 2106, line 10, on Schedule A (Form 1040), line 16" (irs-pub-463-2025::sec::impairment-related-work-expenses-of::b01).
- Default: Schedule A line 16 adds the stated `other_itemized.impairment_related_work_expenses` and every Form 2106's part. Cade should not record the same expense both ways.
- Changes dollars: yes, if both name the same expense.

## 3. A reservist's limit

- Source: "The amount of expenses you can deduct on Schedule 1 (Form 1040), line 12, is limited to the regular federal per diem rate (for lodging, meals, and incidental expenses) and the standard mileage rate (for car expenses), plus any parking fees, ferry fees, and tolls" (irs-2106-inst-2025::sec::line-10::b01, b02).
- Default: Schedule 1 line 12 takes the smaller of line 10 and a limit: lodging up to the lodging per diem, meals up to the M&IE per diem at line 9B's rate (50%), fares (line 3 less lodging), line 2, line 22, and each actual-expense vehicle up to its business miles × $0.70. Line 4 has no room in it.
- Why a doubt: the text names no order for the 50% meals limit and the per diem limit, and says nothing of airfare. The engine keeps fares outside the limit, because the per diem covers only lodging and M&IE.
- Changes dollars: yes (Schedule 1 line 12 for a reservist).
- Blind fill (case 13: lodging 1,800 against a lodging per diem of 1,500; meals 1,500 against an M&IE per diem of 1,000; mileage 1,680) agrees with the default: 3,680. Other readings: the 50% before the cap gives 3,930; one combined cap for lodging and M&IE (2,500) gives 4,180.
- The fact holds only reserve travel more than 100 miles from home; Cade leaves other reserve expenses out.

## 4. Performing artist, test 3 and test 4

- Source: "Had allowable business expenses attributable to the performing arts of more than 10% of gross income from the performing arts" and "Had adjusted gross income of $16,000 or less before deducting expenses as a performing artist" (irs-2106-inst-2025::sec::line-10::b02).
- Default: test 3 compares line 10 (after reimbursements and the 50% meals limit) with 10% of the stated gross income. Test 4 uses Form 1040 line 9 less every other adjustment.
- Gap: with Social Security benefits, an IRA deduction or student loan interest, AGI depends on line 12 itself. Line 12 is unsupported then.
- Changes dollars: yes, at the edges of the tests.

## 5. Line 14 in the arithmetic

- Source: line 27 "Multiply line 26 by the percentage on line 14"; line 14 "Divide line 13 by line 12" (the blank form).
- Default: the ratio is rounded to four places (the printed percentage with two decimals), and lines 27, 32 and 37 use that rounded ratio.
- Changes dollars: at most $1 on a line.

## 6. The special allowance at 40%

- Source: the worksheet's line 7 is "the smaller of line 4 or line 6", with no rate; the note gives 40% for property acquired before January 20, 2025, and 100% after January 19, 2025 (irs-2106-inst-2025::sec::worksheet-for-the-special-depreciation-allowance::b01).
- Default: line 7 is the smaller of line 4 × the rate and line 6. At 100% this is the worksheet as printed.
- Also: Pub. 463 allows an election of 40% instead of 100% (irs-pub-463-2025::sec::special-depreciation-allowance::b01). The fact names it as `elected_40_percent`.
- Changes dollars: yes, only for a car acquired before January 20, 2025, or under the election.

## 7. The section 179 income limit

- Source: "Your section 179 deduction for the year can't be more than the income from your job and any other active trade or business" (irs-2106-inst-2025::sec::line-31::b02).
- Default: the owner's W-2 box 1 wages. A deduction above them is unsupported, because other active business income could raise the limit.
- Changes dollars: no (unsupported, not a guess).

## 8. Two vehicle methods on one form

- Source: line 1 "Vehicle expense from line 22 or line 29"; Section B line 22 has one box.
- Default: line 22 is the business miles of every standard-mileage vehicle × $0.70, rounded once; line 1 is line 22 plus both columns of line 29.
- Changes dollars: no (each vehicle counts once).

## 9. Column B excess reimbursement

- Source: "if line 7 is greater than line 6 in Column A, report the excess as income on Form 1040 ... line 1a" (the blank form, line 8).
- Default: only a column A excess goes on line 1a. A column B excess is not carried anywhere; the form names none.
- Changes dollars: yes, for a meals reimbursement above the meals.

## 10. Who files

- Source: the flowchart (irs-2106-inst-2025::sec::general-instructions::b01–b03) and "If line 4 is your only entry, don't complete Form 2106 unless you are claiming" performing-arts, fee-basis or impairment-related expenses (::line-4::b01).
- Default: a fact files when its total expenses (both columns of line 6) are more than its total line 7, it is not a reservist with only line 4, and a performing artist passes tests 1–3. The flowchart's prior-year vehicle branch (boxes E and G) is not modeled: a person in the four groups with expenses files anyway.
- Changes dollars: no.

## 11. Things the engine takes as stated

- The lease inclusion amount (line 24b): the Pub. 463 appendix tables are not in the corpus.
- The basis on line 30 (cost, sales tax, credits, a conversion's lower FMV) and the earlier section 179 and allowance for line 32.
- The federal per diem for a reservist.
- The mid-quarter rule: the chart row is the vehicle's own placed-in-service date; the caution about other property placed in service after September is not applied (Pub. 463 Table 4-1 caution).

## 12. The 80% meals rate outside transportation work

- Source: Pub. 463: "If you are subject to the Department of Transportation's "hours of service" limits ..., use 80% instead of 50% for meals while away from your tax home" (irs-pub-463-2025::sec::completing-form-2106::b07). The Form 2106 instructions say only "Generally, you can deduct only 50%" (irs-2106-inst-2025::sec::line-9::b01).
- Default: the fact `hoursOfServiceLimits` makes line 9B 80% for any of the four groups.
- Why a doubt: the four groups that file Form 2106 rarely work under the hours-of-service rules; the fact is for the rare case. The blind fill also used 80% (case 6: 1,200, not 750).
- Changes dollars: yes (line 9B).

## 13. Line 32 after a capped special allowance

- Source: "From that result, subtract the total amount of any section 179 deduction and special depreciation allowance claimed this year (see line 31)" (irs-2106-inst-2025::sec::line-32::b01).
- Default: line 32 subtracts line 31 as entered, which the worksheet's line 7 caps at the business share of the line 36 limit.
- Why a doubt: the full allowance before the cap (line 30 × line 14 × 100%) is another reading of "claimed". It leaves line 32 at 0 and line 34 at 0.
- Blind fill agrees (case 9: line 32 6,240, line 34 1,248). Line 38 is the same either way when line 37 is the smaller; it changes when line 35 is the smaller.
- Changes dollars: yes (lines 32, 34, 35; line 38 at the edge).

## 14. The conversion percentage on the line 23 costs

- Source: line 14: "If you entered on line 12 the total number of miles driven after the change to business use, multiply the percentage you figured by the number of months you drove the vehicle for business and divide the result by 12" (irs-2106-inst-2025::sec::line-14::b01); line 27: "Multiply line 26 by the percentage on line 14" (the blank form).
- Default: line 27 uses the reduced line 14, as printed.
- Why a doubt: when line 23 holds only the costs after the change, the reduced percentage counts the months twice. Case 12 of the blind fill: 1,600 × 40% = 640; the business share of those costs is 80% (1,280).
- Changes dollars: yes (line 27 for a car converted during the year).

## 15. The section 179 input

- Source: "multiply the part of the cost of the vehicle that you choose to expense by the percentage on line 14" (irs-2106-inst-2025::sec::line-31::b02).
- Default: the fact `section179Cost` is the part of the cost chosen to expense, before line 14. Cade must not record the deduction itself there.
- Blind fill agrees (case 10: line 31 3,000 from 5,000 × 60%). If the 5,000 were the deduction, line 31 is 5,000 and line 38 is 5,308.
- Changes dollars: yes, if Cade records the wrong amount.

## 16. Professional dues on line 4

- Source: "No deduction is allowed for certain entertainment expenses, membership dues, and facilities used in connection with these activities" (irs-2106-inst-2025::sec::line-4::b02); Pub. 463 bars dues to a club whose principal purpose is entertainment (irs-pub-463-2025::sec::examples-of-nondeductible-entertainment::b02).
- Default: line 4 takes the stated other expenses. The engine does not test what they are; Cade leaves club dues out and keeps professional dues.
- Changes dollars: yes, if Cade records club dues.

## Unsupported cases

- More than one Form 2106 on a return: the printed lines; the totals still reach Schedule 1, Schedule A and line 1a.
- More than two vehicles (a second page 2).
- A vehicle placed in service before 2020; a vehicle that used the standard mileage rate in its first year and now uses actual expenses; a declining-balance car whose business use fell to 50% or less (Form 4797 recapture); a car placed in service and sold in 2025.
- An owned car on actual expenses with no Section D facts; an employer-provided car on the standard mileage rate.
- A W-2 code L with no stated reimbursements (the column split is unknown).
- Schedule CA (540) line 12 columns B and C when a Form 2106 claims depreciation (FTB Pub. 1001). Schedule CA line 19 stays unsupported: it needs a Form 2106 with California amounts for every employee.

## Second opinions

- Blind fill (2026-11-22): a preparer filled 15 cases from the blank form and the 2025 instructions only. All 480 values match the engine (no blank-against-0 differences either). The preparer's doubts that change dollars are in questions 1, 3, 10 and 12–16.
- PolicyEngine-US 2.152.16 (commit 794e17e675): does not model Form 2106. It has no Schedule 1 line 12 adjustment (its above-the-line list has no reservist, performing-artist or fee-basis entry), no standard mileage rate and no vehicle depreciation limits. Its only trace is the input `unreimbursed_business_employee_expenses` in the miscellaneous itemized deduction list (suspended after 2017). Nothing to compare.
- IRS Direct File (commit e365f9f): its fact dictionary (backend/src/main/resources/tax) has no Form 2106, Schedule 1 line 12 or vehicle module. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, occupation, SSN) | stated rule |
| Lines 1–6 | stated rule (sums of stated amounts) |
| Line 7 and the allocation worksheet | published example with numbers (Pub. 463 2025) |
| Lines 8–10 | published example with numbers (Pub. 463 2025, through line 7); stated rule |
| Line 9B at 80% | stated rule (Pub. 463) |
| Lines 11–17 | stated rule; line 14 conversion: published example with numbers |
| Lines 18–21 | stated rule (the person's answers) |
| Line 22 | stated rule; own reading for two vehicles (question 8) |
| Lines 23–29 | stated rule; line 24b taken as stated |
| Lines 30–38 | published examples with numbers (2106 instructions line 31; Pub. 463 2025, four examples); own reading for the 40% rate (question 6) |
| Line 10 split: Schedule 1 line 12 (fee basis) | stated rule |
| Line 10 split: reservist limit | own reading (question 3) |
| Line 10 split: performing artist tests | stated rule; own reading for test 3 (question 4) |
| Line 10 split: Schedule A line 16 | stated rule; own reading for the share (question 1) |
| Form 1040 line 1a excess | stated rule (the form's line 8) |
| Schedule CA line 12 column A | stated rule; columns B and C unsupported with depreciation |
