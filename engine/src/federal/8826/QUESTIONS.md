# Form 8826: open points

The form (Rev. September 2017) and its instructions publish no example with numbers. The rules come from the lines and the instructions. One outside example has numbers: the Department of Justice's ADA Tax Incentives Packet ($20,000 spent, a $5,000 credit, $15,000 left to deduct); it is a unit test. Section 44 of the statute agrees with each rule below (law library, 2026-11-27).

## Doubts and defaults

1. **One form for the return.** "All members of the same controlled group and all persons under common control generally are considered to be one person" (`irs-8826-form-2025::sec::purpose-of-form::b01`). The engine files one Form 8826 for the return and adds the expenditures of every Schedule C business on it. On a joint return, the spouses' businesses share the $250 floor and the $10,250 ceiling. The instructions do not say whether spouses on a joint return are one person. Changes dollars: yes, for a joint return where both spouses' businesses spend more than $10,250 together.
2. **The prior-year answers are the return's.** The gross receipts and the full-time employees of 2024 are one answer each for the return, for all of the taxpayer's businesses and any predecessor (`purpose-of-form::b01`). Changes dollars: no, when the answer is given that way.
3. **Gross receipts are net of returns and allowances.** "Gross receipts are reduced by returns and allowances made during the tax year" (`purpose-of-form::b01`). The fact holds the net amount; Schedule C line 3 of 2024 is the natural source. Changes dollars: no.
4. **The employees are asked only when needed.** The test is "gross receipts ... did not exceed $1 million **or** had no more than 30 full-time employees" (`purpose-of-form::b01`). The engine asks the employees only when the receipts are above $1,000,000. Changes dollars: no.
5. **Cents boxes.** Every line is whole dollars (the 1040 rule, `irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Line 1 rounds the total of the expenditures once; line 6 rounds 50% of line 5, so an odd line 5 rounds the half dollar up ($2,851 gives $1,426). The cents box prints 00 next to each amount, as the form prints on lines 2 and 4. Changes dollars: at most $1 on line 6.
6. **Line 6 is split by expenditures.** Each group of expenditures takes a share of line 6 in proportion to its amount (`prorateDollars`), and that share comes off its expense line. The instructions say only "To the extent of the credit shown on line 6" (`line-6::b01`). Changes dollars: no in total; the split between two Schedule C lines can move by $1.
7. **The deduction falls by the credit, not by the expenditures.** Decided: row A104 of `docs/rule-decisions.md`.
8. **A K-1 rounds before the add on line 7.** Decided: row A103 of `docs/rule-decisions.md`.
9. **California adds the whole reduction back.** "California law conforms to this provision, but the maximum credit is $125 (50% of eligible expenses up to $250)" (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b04`). California denies a deduction only for the California credit (FTB 3548). The engine does not file FTB 3548, so it claims no California credit, and Schedule CA line 3 column B subtracts the whole federal reduction. A taxpayer who claims FTB 3548 would subtract $125 less, at most. Changes dollars: up to $125 of California income, for a taxpayer who files FTB 3548 outside the engine. Schedule CA (540NR) is not changed: it does not take the work opportunity credit either.
10. **The election.** The taxpayer "Elects (by filing Form 8826) to claim the disabled access credit" (`purpose-of-form::b01`). A disabled access fact is the claim. The decision `decisions.scope.must_file_8826` false with a fact present makes Form 3800 line 1e a gap, because the Schedule C reduction reads only facts (`form3800.ts`). Changes dollars: no.
11. **A K-1 alone.** "Taxpayers, other than partnerships or S corporations, whose only source of this credit is from those pass-through entities, are not required to complete or file this form" (`purpose-of-form::b01`). The form files then only with the decision; Form 3800 takes the K-1 directly. Changes dollars: no.

## Gaps (unsupported, with a reason)

- **Expenditures that were capitalized.** Section 44(d)(7)(B): no increase in basis for the credit. The depreciation facts hold the basis as stated, so the engine cannot lower it. Lines 1 to 8 and Form 3800 line 1e are a gap.
- **A member of a controlled group or of businesses under common control.** Line 6 is the member's share of the group's credit, with a statement (`member-of-controlled-group-or::b01`). The facts do not hold the group's expenditures.
- **Expenditures of a business that is not a Schedule C business on the return** (a farm, a rental). The reduction needs that schedule's expense line, and only Schedule C has one in the engine for this credit.
- **A Schedule C business the owner does not materially participate in.** The credit is passive and Form 8582-CR limits it; the engine does not figure a passive Schedule C business (as for Form 8846).
- **A share of line 6 above the stated expense line.** The stated line must hold the expenditures before the credit.
- **A stated Form 3800 line 1e credit with no entity, next to the expenditure facts.** The engine cannot tell whether they are the same credit.
- **A K-1 code K with no amount.** The entity's statement gives it.

## Proposals for a discussion

- **Farms and rentals.** Schedule F and Schedule E could take the reduction the same way, on the expense line the fact names (`facts/kinds/activitiesOnReturn.ts` has a `rentalsOnReturn` and farm facts of their own). Today such a fact is a gap.
- **Capitalized expenditures.** A depreciation fact could name the disabled access fact whose credit lowers its basis, so Form 4562 takes the lower basis.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | Stated rule (as every credit form) |
| Line 1 | Stated rule |
| Lines 3, 5, 6 (with the printed lines 2 and 4) | Published example with numbers (ADA Tax Incentives Packet, the $10,250 cap) and the form's arithmetic |
| Line 7 | Stated rule; the rounding is decision A103 |
| Line 8 and its $5,000 limit | Stated rule |
| Cents boxes | Own reading (item 5) |
| Who files and the eligible small business test | Stated rule |
| Schedule C expense line less line 6 | Published example with numbers (the same packet); the amount is decision A104 |
| Schedule CA line 3 column B | Own reading (item 9) |
