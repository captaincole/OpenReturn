# Form 8826: open points

The form (Rev. September 2017) and its instructions publish no example with numbers. The rules come from the lines and the instructions. One outside example has numbers: the Department of Justice's ADA Tax Incentives Packet ($20,000 spent, a $5,000 credit, $15,000 left to deduct); it is a unit test. Section 44 of the statute agrees with each rule below (law library, 2026-11-27).

## Two texts conflict

1. **The deduction falls by the credit, not by the expenditures.** The Schedule C instructions say "you can't take both a credit (on Form 8826) and a deduction for the same expenditures" (`irs-1040sc-inst-2025::sec::part-v::b03`). Form 8826 says "To the extent of the credit shown on line 6" (`irs-8826-form-2025::sec::line-6::b01`). The engine follows the form. Decided: row A104 of `docs/rule-decisions.md`, comment in `figures.ts`.
2. **A K-1 rounds before the add on line 7.** The 1040 rule rounds only a total; Form 3800 Part V lists one amount for each pass-through EIN. The engine rounds each K-1, so line 8 equals Form 3800 line 1e. Decided: row A103 of `docs/rule-decisions.md`.

## Should we do this now

3. **One form for the return.** "All members of the same controlled group and all persons under common control generally are considered to be one person" (`irs-8826-form-2025::sec::purpose-of-form::b01`). The engine files one Form 8826 for the return and adds the expenditures of every Schedule C business on it. On a joint return, the spouses' businesses share the $250 floor and the $10,250 ceiling. The instructions do not say whether spouses on a joint return are one person. Not now: no text settles it, and it changes dollars only when both spouses' businesses spend more than $10,250 together.
4. **The prior-year answers are the return's.** The gross receipts and the full-time employees of 2024 are one answer each for the return, for all of the taxpayer's businesses and any predecessor (`purpose-of-form::b01`). Done.
5. **Gross receipts are net of returns and allowances.** "Gross receipts are reduced by returns and allowances made during the tax year" (`purpose-of-form::b01`). The fact holds the net amount; Schedule C line 3 of 2024 is the natural source. Done.
6. **The employees are asked only when needed.** The test is "gross receipts ... did not exceed $1 million **or** had no more than 30 full-time employees" (`purpose-of-form::b01`). The engine asks the employees only when the receipts are above $1,000,000. Done.
7. **Cents boxes.** Every line is whole dollars (the 1040 rule, `irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Line 1 rounds the total of the expenditures once; line 6 rounds 50% of line 5, so an odd line 5 rounds the half dollar up ($2,851 gives $1,426). The cents box prints 00 next to each amount, as the form prints on lines 2 and 4. Done.
8. **Line 6 is split by expenditures.** Each group of expenditures takes a share of line 6 in proportion to its amount (`prorateDollars`), and that share comes off its expense line. The instructions say only "To the extent of the credit shown on line 6" (`line-6::b01`). Done; the total is exact and the split between two Schedule C lines can move by $1.
9. **Expenditures deducted in Part V.** The Schedule C instructions list the deduction for removing barriers under Part V, other expenses (`irs-1040sc-inst-2025::sec::part-v::b03`). Done (2026-11-27): a fact with `deductedOn: "otherExpenses"` names the Part V entry by its description (`otherExpense`), and its part of line 6 comes off that entry, so lines 48 and 27b fall with it. The engine does not check the $15,000 limit of that deduction: the entry is the business's stated amount.
10. **California adds the whole reduction back.** "California law conforms to this provision, but the maximum credit is $125 (50% of eligible expenses up to $250)" (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b04`). California denies a deduction only for the California credit (FTB 3548). The engine does not file FTB 3548, so it claims no California credit, and Schedule CA line 3 column B subtracts the whole federal reduction. Not now: FTB 3548 is a form of its own; a taxpayer who claims it outside the engine would subtract $125 less, at most. Schedule CA (540NR) is not changed: it does not take the work opportunity credit either.
11. **The election.** The taxpayer "Elects (by filing Form 8826) to claim the disabled access credit" (`purpose-of-form::b01`). A disabled access fact is the claim. The decision `decisions.scope.must_file_8826` false with a fact present makes Form 3800 line 1e a gap, because the Schedule C reduction reads only facts (`form3800.ts`). Done.
12. **A K-1 alone.** "Taxpayers, other than partnerships or S corporations, whose only source of this credit is from those pass-through entities, are not required to complete or file this form" (`purpose-of-form::b01`). The form files then only with the decision; Form 3800 takes the K-1 directly. Done.
13. **Gaps (unsupported, with a reason).** Not now, each for the reason given:
    - Expenditures that were capitalized. Section 44(d)(7)(B): no increase in basis for the credit. The depreciation facts hold the basis as stated, so the engine cannot lower it. Lines 1 to 8 and Form 3800 line 1e are a gap. See the proposal below.
    - A member of a controlled group or of businesses under common control. Line 6 is the member's share of the group's credit, with a statement (`member-of-controlled-group-or::b01`). The facts do not hold the group's expenditures.
    - Expenditures of a business that is not a Schedule C business on the return (a farm, a rental). The reduction needs that schedule's expense line. See the proposal below.
    - A Schedule C business the owner does not materially participate in. The credit is passive and Form 8582-CR limits it; the engine does not figure a passive Schedule C business (as for Form 8846).
    - A share of line 6 above the stated expense line or the named Part V entry, or a Part V entry the business does not list. The stated amount must hold the expenditures before the credit.
    - A stated Form 3800 line 1e credit with no entity, next to the expenditure facts. The engine cannot tell whether they are the same credit.
    - A K-1 code K with no amount. The entity's statement gives it.
14. **Rows.** Form 8826 has no repeating rows: line 1 is one total, and one form files for the return. Past nine Part V entries, Schedule C leaves its rows blank (its own rule).

## Pattern change

None made. The Part V entry of item 9 is a field of this fact kind only.

### Proposals for a discussion

- **Farms and rentals.** Before: a disabled access fact that names a farm or a rental is a gap. After: Schedule F and Schedule E take the reduction the same way, on the expense line the fact names (`facts/kinds/activitiesOnReturn.ts` has a `rentalsOnReturn` and farm facts of their own).
- **Capitalized expenditures.** Before: a capitalized expenditure is a gap, because the depreciation facts hold the basis as stated. After: a depreciation fact names the disabled access fact whose credit lowers its basis, so Form 4562 takes the lower basis.

## Second opinions

- **Blind fill** (15 cases, from the blank form and instructions only): one dollar difference, settled for the engine.
  - Case 13, line 7 ($600 against $601) and line 8 ($975 against $976): two K-1s of $300.40. The blind fill added the cents and rounded the total (the 1040 rule, `irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). The engine rounds each K-1 first, so line 8 equals Form 3800 line 1e, whose Part V lists one amount "by the EIN of the pass-through entity" (`irs-3800-inst-2025::sec::part-v-3::b01`). That is row A103, the same rule as row A96 for Form 8846; kept, with a unit test (item 2).
  - Case 12 (a K-1 alone, the form filed anyway): lines 1 to 6 blank in the engine, $0 in the blind fill. No dollar change (item 12).
  - Blind doubts with no dollar change match the engine's defaults: a form with a zero credit (cases 2 and 3), line 7 blank with no K-1, the $5,000 limit on lines 6 and 7 together, the half dollar on line 6 rounding up (item 7), and the "or" of the two prior-year tests (item 6).
- **PolicyEngine-US 2.154.1** (commit 0fbed6ddb1): it does not model Form 8826. `general_business_credit` is a bare input ("General business credit from Form 3800") with no formula, and no variable or parameter names the disabled access credit or section 44. Nothing to compare.
- **Other projects:** the repository names no other reference implementation of business credits.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | Stated rule (as every credit form) |
| Line 1 | Stated rule |
| Lines 3, 5, 6 (with the printed lines 2 and 4) | Published example with numbers (ADA Tax Incentives Packet, the $10,250 cap) and the form's arithmetic |
| Line 7 | Stated rule; the rounding is decision A103 |
| Line 8 and its $5,000 limit | Stated rule |
| Cents boxes | Own reading (item 7) |
| Who files and the eligible small business test | Stated rule |
| Schedule C expense line or Part V entry less line 6 | Published example with numbers (the same packet); the amount is decision A104 |
| Schedule CA line 3 column B | Own reading (item 10) |
