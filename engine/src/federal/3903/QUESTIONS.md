# Form 3903: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides.

## 1. Line 4 when the move does not state it

- Source: "This excluded amount should be identified on Form W-2, box 12, with code P." (irs-3903-inst-2025::sec::line-4::b01; the form's line 4 says the same.)
- Default: a move that does not state its government reimbursements takes the code P total of every W-2 on the return. With no code P, line 4 is 0.
- Why a doubt: "should be" is not "is". A reimbursement the government paid that is missing from box 12 would be missed.
- Changes dollars: yes (line 4, line 5, Schedule 1 line 14, Form 1040 line 1h).

## 2. Dislocation and temporary lodging allowances

- Line 4: "don't include any part of a dislocation allowance, a temporary lodging allowance, a temporary lodging expense, or a move-in housing allowance" (irs-3903-inst-2025::sec::line-4::b01).
- Lines 1 and 2: "don't include any expenses that were reimbursed by an allowance you don't have to include in your income" (irs-3903-inst-2025::sec::line-1::b02, ::sec::line-2::b01). These allowances are not income (irs-3903-inst-2025::sec::purpose-of-form::b02).
- Pub. 3: the deduction is for "qualified expenses that exceed your reimbursements and allowances (including dislocation allowances, temporary lodging expenses, temporary lodging allowances, or move-in housing allowances that are excluded from gross income)" (irs-pub-3-2025::sec::how-to-report-moving-expenses::b01).
- Settled (blind fill, 2026-11-21): the allowance lowers lines 1 and 2, and line 4 leaves it out so it does not count twice. The move fact states it as `excludedAllowances`; the engine takes it off the paid amounts. An allowance over both lines leaves them at 0 and is not line 1h income (purpose-of-form::b02 names these allowances as the exception).
- Open: which line it comes off. The text does not say. Default: line 1 first, then line 2. Lines 3, 4 and 5 do not depend on the split; the printed lines 1 and 2 do.
- Open: a dislocation allowance pays for costs that are not deductible too (meals, deposits). The default takes the whole allowance off, as Pub. 3 reads.
- Changes dollars: yes (line 5, Schedule 1 line 14).

## 3. Both vehicle methods on one move

- Source: "If you use your own vehicle(s), you can figure the expenses by using either: actual out-of-pocket expenses for gas and oil, or mileage at the rate of 21 cents a mile." (irs-3903-inst-2025::sec::line-2::b01)
- Default: a move that states both miles and gas and oil is unsupported. The text does not say whether two vehicles may use different methods.
- Changes dollars: yes, only for that input.

## 4. More than one move

- Source: "If you qualify to deduct expenses for more than one move, use a separate Form 3903 for each move." (irs-3903-inst-2025::sec::purpose-of-form::b01)
- Default: the engine prints one copy, so with two moves the form's lines are unsupported. Schedule 1 line 14 still adds each move's line 5 when every move states its line 4. The code P total is not split among moves: then line 14 and Form 1040 line 1h are unsupported.
- Changes dollars: no (an engine limit, not a rule choice).

## 5. Storage fees alone and a move in the same year

- Source: "Do not file Form 3903 if all of the following apply. You moved in an earlier year. You are claiming only storage fees during your absence from the United States. ..." (irs-3903-inst-2025::sec::line-1::b01)
- Default: storage fees alone go on Schedule 1 line 14 with the box checked. With a Form 3903 for a 2025 move too, the fees are not the only claim, so line 14 is unsupported. The text does not say how the box and the two amounts combine.
- Changes dollars: no (unsupported, not a guess).

## 6. A move the member does not certify

- Source: "You can deduct moving expenses only if you are a member of the Armed Forces on active duty and, due to a military order, ... move because of a permanent change of station." "Check the box to certify ..." (irs-3903-inst-2025::sec::specific-instructions::b01)
- Default: a move fact with the certification false files no Form 3903. A reimbursement over the cost of such a move is not carried to Form 1040 line 1h.
- Changes dollars: no for the deduction (none is allowed). Possibly yes for line 1h income, a case the instructions do not address.

## 7. Line 5 when line 3 equals line 4

- Source: "If line 3 is equal to or less than line 4, you don't have a moving expense deduction." (irs-3903-inst-2025::sec::line-5::b01)
- Default: No is checked, line 5 is blank, and nothing goes to line 1h (the difference is 0). The form prints line 5's amount only under Yes.
- Changes dollars: no.

## 8. Two vehicles on one move

- Source: "If you use your own vehicle(s) ..." and "you can only include expenses for one trip per person" (irs-3903-inst-2025::sec::line-2::b01).
- Default: the engine adds every mile the move states. The member states the miles of each vehicle that a different household member drove, once.
- Why a doubt: a fact does not say who drove. One person who drove twice (two cars, two trips) may count only one trip.
- Changes dollars: yes (line 2, line 5).

## Second opinions

- PolicyEngine-US 2.152.15 (commit b274cacc2c): it does not model Form 3903 or the moving expense adjustment. `parameters/gov/irs/ald/deductions.yaml` lists no moving expense item, and no variable or parameter under `gov/irs` names moving, dislocation or 3903. Nothing to compare.
- IRS Direct File (issue #140): no checkout in this worktree. Not compared.

## Confidence by field group

| Field group                                                       | Confidence                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Header name and SSN                                               | stated rule (the return's names and SSN)                                                                                      |
| Certification box                                                 | stated rule                                                                                                                   |
| Lines 1 and 2 (amounts stated by the member; mileage at 21 cents) | stated rule; Pub. 521 (2017) example with numbers for the line 2 arithmetic; own reading for the allowance split (question 2) |
| Line 3                                                            | published example with numbers (Pub. 521, 2017)                                                                               |
| Line 4                                                            | published example with numbers for code P; own reading for the default (question 1)                                           |
| Line 5 Yes/No and amount                                          | published example with numbers (Yes branch); stated rule (No branch)                                                          |
| Schedule 1 line 14 and box                                        | stated rule                                                                                                                   |
| Form 1040 line 1h excess                                          | stated rule                                                                                                                   |
| Schedule CA (540) line 14 column A                                | stated rule; column C unsupported (needs FTB 3913)                                                                            |
