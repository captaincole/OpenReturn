# Form 8396 (2025): open questions

Each item is a place where the form and its instructions do not settle a rule. Each names the source text, the default the engine applies, and whether the default changes a dollar amount.

## 1. Line 1 reads its own interest amount, not the Form 1098 fact

- Source: "In most cases, this will be the amount in box 1 on Form 1098" (`irs-8396-form-2025::sec::specific-instructions::b01`).
- The engine's Form 1098 fact (`mortgage.interest_form_1098`) is box 1 plus box 6 (points). Line 1 takes box 1 only.
- Default: the certificate fact carries `interestPaid` (box 1, the filer's share). Cade records it from the 1098.
- Changes dollars: yes, when the 1098 has points in box 6.

## 2. The allocation fraction for a loan larger than the certified indebtedness

- Source: "If the loan amount on your MCC is less than your total mortgage loan, you must allocate the interest … See Pub. 530" (`specific-instructions::b01`). Pub. 530 uses certified indebtedness over the original loan amount (`irs-pub-530-2025::sec::figuring-the-credit::b01`).
- Default: the Pub. 530 fraction, rounded once on line 1. Line 3 multiplies the rounded line 1, as with any line the form defines from another line. A blind fill rounded the same way; in its case both orders gave the same line 3.
- Changes dollars: no (a published example); the order of rounding can move line 3 by $1 at most.

## 3. A co-owner's share of the $2,000 limit

- Source: "the $2,000 limit must be allocated to each owner in proportion to the interest held" (`line-3::b01`).
- Default: `ownershipShare` (0 to 1) divides the limit. Absent means the filer holds the whole interest. Line 1's `interestPaid` is already the filer's share; the engine does not check it against the ownership share.
- "Your share of the interest paid" (`specific-instructions::b01`) is the interest the filer paid, not the ownership share of the total: the Pub. 530 example multiplies "the mortgage interest you paid this year ($5,400)" (`irs-pub-530-2025::sec::dividing-the-credit::b01`).
- Changes dollars: yes, when a co-owner exists and the share is wrong or missing.

## 4. Credit Limit Worksheet B (a qualifying child under 17)

- Source: "If you are directed to complete Form 8396 by Credit Limit Worksheet B … include the amount from line 14 of Credit Limit Worksheet B instead of … line 19" (`line-8-credit-limit-worksheet::b01`); Worksheet B applies with this credit and Schedule 8812 line 4 above 0 (`irs-1040s8-inst-2025::sec::line-21::b03`).
- Rule: Worksheet B lines 1 to 14 (`schedule-8812/worksheetB.ts`) give worksheet line 2's first amount. Schedule 8812 line 13 subtracts Schedule 3 line 6g as Credit Limit Worksheet A line 4 (Worksheet B line 15).
- Gaps: Form 2555 and Puerto Rico residence have no fact, so the engine reads both as absent. Self-employment leaves Worksheet B line 3 unsupported, as it does Schedule 8812 line 18a.
- When line 9 is an engine gap (this item, item 5, 8 or 9), Schedule 3 line 6g is unsupported with the same reason. Schedule 8812 line 13 then leaves 6g out, as Schedule 3 leaves out its other unsupported credits, so the child tax credit still prints.
- Changes dollars: no, except in those gaps.

## 5. Worksheet line 2 credits the engine does not compute

- Source: worksheet line 2 lists Schedule 3 lines 1 through 4, 6d, 6f, 6l and 6m (`line-8-credit-limit-worksheet::b01`).
- Schedule 3 lines 1, 4, 6f, 6l and 6m are unsupported in the engine. Line 3 (Form 8863) is computed; a gap in Form 8863 reads as 0 here.
- Default: while Form 1116, 8880, 8936 or 8978 files, lines 8 to 17 are unsupported.
- Changes dollars: yes, for those filers only.

## 6. The outdated list in "Before you begin Part I"

- Source: "figure the amounts of … credit for the elderly or the disabled, alternative motor vehicle credit, and qualified plug-in electric drive motor vehicle credit" (`irs-8396-form-2025::sec::omb-no-1545-0074::b01`).
- The last two credits no longer exist. Default: the worksheet's own list decides line 2.
- Changes dollars: no.

## 7. Schedule A line 8a when line 3 is more than the Form 1098 interest

- Source: "subtract the amount shown on Form 8396, line 3, from the total deductible interest you paid … Enter the result on line 8a" (`irs-1040sa-inst-2025::sec::line-8a::b02`).
- The certificate's loan can be reported on line 8b (no Form 1098). The text puts the whole result on line 8a.
- Default: line 8a less line 3. When line 3 is more than the 1098 interest, line 8a is unsupported and lines 8e, 10 and 17 wait.
- Changes dollars: yes, for that case only.

## 8. A reissued certificate

- Source: "multiply the interest that was scheduled to be paid on your original mortgage by the certificate rate on your original MCC. The result may limit your line 3" (`refinanced-mortgage::b01`).
- Default: the fact states that original-certificate credit; line 3 is the smaller amount. Line 1 stays the interest paid, because the rule limits line 3. Different rates in the year of refinancing need an attached statement (`refinanced-mortgage::b02`): lines 1 to 3 are unsupported.
- Changes dollars: yes, when the stated original credit is wrong.

## 9. A rate outside 10% to 50%

- Source: "The certificate credit rate cannot be less than 10% or more than 50%" (`line-2::b01`).
- Default: line 3 is unsupported, with a reason that asks for the rate to be checked.
- Changes dollars: no (no valid certificate has such a rate).

## 10. Who can claim

- Source: FHA, VA and Farmers Home certificates do not qualify; the home must be the main home; no credit when the interest is paid to a related person (`who-can-claim-the-credit::b01`).
- Default: a certificate fact means the filer qualifies. Cade asks these questions before recording it.
- Changes dollars: yes, if a fact is recorded for a certificate that does not qualify.

## 11. A carryforward with no certificate this year

- Source: Part II carries unused credit "to the next 3 tax years or until used" (`part-ii-mortgage-interest-credit-carryforward-to-2026::b01`).
- Default: a carryforward above 0 files the form, and the form asks for the certificate (the header needs it). Its `interestPaid` may be 0.
- Changes dollars: no.

## 12. Schedule CA (540) line 8 column C

- Source: "increase your California itemized deductions by the same amount. Enter the amount of your federal mortgage interest credit on line 8, column C" (`ca-540-sched-ca-inst-2025::sec::line-8-home-mortgage-interest::b01`).
- "The same amount" is the federal reduction, Form 8396 line 3; "your federal mortgage interest credit" could mean line 9.
- Default: line 3, and only while federal Schedule A line 8a prints (no federal limit open). Line 8e column C is the same while lines 8b and 8c print nothing.
- Changes dollars: yes, when line 9 is less than line 3.

## 13. Blank or 0

- Lines 4 to 6 print blank when there is no carryforward. Part II prints blank when line 9 equals line 7 ("Complete only if line 9 is less than line 7"). Schedule 3 files whenever Form 8396 files, even when line 9 is 0.
- Changes dollars: no.

## Blind check

A preparer filled 14 cases by hand from the blank form and instructions only. The fill matched the engine on every line, blank lines included. Its doubts are items 2, 3, 8 and 13, and two that the text settles:

- A rate of exactly 20% has no $2,000 limit: the limit applies when the rate "is more than 20%" (`line-3::b01`).
- The adoption credit (Schedule 3 line 6c) is not on worksheet line 2, which lists "Form 1040 or 1040-SR, line 19; Schedule 3 (Form 1040), lines 1 through 4, 6d, 6f, 6l, and 6m; and Form 5695, line 32" (`line-8-credit-limit-worksheet::b01`).

## Second opinions

- PolicyEngine-US 2.152.15 (commit b274cacc): it does not model Form 8396. Its list of nonrefundable credits in order (`parameters/gov/irs/credits/non_refundable.yaml`) has only a comment, "Adoption expense credit, home mortgage credit", after the child tax credit. The credits it lists before that comment are the credits on worksheet line 2: Schedule 3 lines 1 to 4, 6d, 6f and 6m, Form 5695 Part II and Form 1040 line 19. That agrees with the engine's line 2 and with leaving out the adoption credit. Nothing to compare for the rate, the $2,000 limit, the allocation or Part II.
- IRS Direct File (IRS-Public/direct-file): a code search finds no Form 8396 or mortgage interest credit. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN, issuer, number, date, home address) | stated rule |
| Line 1 (allocation fraction) | published example with numbers (Pub. 530) |
| Line 2 | stated rule |
| Line 3, rate 20% or less | stated rule |
| Line 3, rate above 20% and the $2,000 limit, co-owner share | published example with numbers (Pub. 530) |
| Line 3, reissued certificate | own reading (item 8); unsupported with different rates |
| Lines 4 to 7 | stated rule |
| Line 8 and the Credit Limit Worksheet | stated rule (Worksheet B with a child under 17); unsupported with an uncomputed credit |
| Line 9 | published example with numbers (Pub. 530 carryforward) |
| Lines 10 to 17 | stated rule; the $600 carryforward is a published example |
| Schedule A line 8a | stated rule; unsupported when line 3 is more than the 1098 interest |
| Schedule 3 line 6g | stated rule; unsupported when line 9 is |
| Schedule CA line 8a and 8e column C | own reading (item 12) |
