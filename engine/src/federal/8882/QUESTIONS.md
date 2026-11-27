# Form 8882 — doubts and defaults

Form 8882 gives an employer a credit for childcare it provides to employees: 25% of the facility expenditures (line 1) and 10% of the resource and referral expenditures (line 3), up to $150,000 (line 7). Line 7 goes to Form 3800 Part III line 1k. The engine files it for an individual with a Schedule C business; the entity's own return stays out.

## 1. Which rates and limit apply to 2025

- Source: the form (Rev. December 2017): "The credit is 25% ... plus 10% ... limited to $150,000 per tax year" (`irs-8882-form-2025::sec::how-to-figure-the-credit::b01`); the 2025 Form 3800 instructions: "don't enter more than $150,000" (`irs-3800-inst-2025::sec::line-1k::b01`).
- The statute in the law library is the amended text: 40% (50% for an eligible small business) and $500,000 ($600,000) (`usc-26-2025::sec::s45f::a`, `::b`). Its effective-date note ("amounts paid or incurred after December 31, 2025") is not a block of the library.
- The IRS page "Employer-provided child care credit: tax year 2025 and earlier" (irs.gov, read 2026-11-27) keeps 25%, 10% and $150,000 "For amounts paid or incurred before January 1, 2026".
- Default: 25%, 10%, $150,000 (DECISION in `lines.ts`, docs/rule-decisions.md). Changes dollars: yes, if the new rates were applied to 2025.
- For docs/law-findings.md: the statute text and the 2025 instructions differ; the difference is the amendment's date.

## 2. The cents boxes

- Source: every line has a cents box. The Form 1040 instructions: "If you do round to whole dollars, you must round all amounts" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`).
- Default: whole dollars; a line with an amount prints 00 in its cents box, a blank line leaves it blank. Changes dollars: no.

## 3. Rounding of line 2 and line 4

- Source: "Enter 25% (0.25) of line 1" (face).
- Default: line 1 adds its amounts with cents and rounds; line 2 is 25% of the rounded line 1, rounded. Changes dollars: at most $1.

## 4. The part of line 7 each expenditure gives

- Source: "the amount of the credit on line 7 allocable to capital expenditures ... allocable to those deductions" (`irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01`); above the limit "the limited amount allowed is allocated pro rata" (`irs-3800-inst-2025::sec::limitation-on-certain-credits-reported-in-part-iii::b01`).
- Default: each expenditure's share of line 7 follows its rate times its amount (`prorateDollars`); the shares add to line 7 exactly. Changes dollars: at most $1 between places.
- Checked against CRS In Focus IF12379: $700,000 of contract costs, a $150,000 credit, a $550,000 deduction.

## 5. Line 5 with the limit

- Source: "For credits entered on line 5, only the pass-through entity is required to make this reduction" (page-2::b01).
- Default: with line 5 above 0 and line 6 over $150,000, the own share of line 7 is less than lines 2 and 4. The facts layer lowers the deductions before it can read the K-1s, so Form 3800 line 1k is a gap (`form3800.ts`). Lines 1 to 7 print. Changes dollars: the gap only.

## 6. Where the reduction is taken

- Source: page-2::b01, and Form 4562 column (c): "subtract any credits ... Credit for employer-provided childcare facilities and services" (`irs-4562-inst-2025::sec::section-b::b08`, `::b09`).
- Default: each expenditure fact names its place: a 2025 asset (its cost drops), a Schedule C expense line, or a Part V expense. A place that cannot hold the share is a gap on lines 1 to 7 and on line 1k, and nothing is reduced. Changes dollars: no, when the facts are right.
- An asset with a section 179 election, or not used 100% in the business, is a gap: the instructions do not give the order of the reductions or the business-use share of the credit.
- Property not placed in service in 2025 lowers no 2025 depreciation. Its later basis must start from the reduced amount; the engine does not carry it forward.

## 7. "Any expenditures used to figure any other credit"

- Source: page-2::b01, third bullet.
- Default: not applied. No fact links a childcare expenditure to another credit (for example the work opportunity wages of a facility employee). Changes dollars: yes, only when the same wages are used for both credits.

## 8. California

- Source: Schedule CA lists the federal credits whose reduced deductions differ for California, and this credit is not on the list (`ca-540-sched-ca-inst-2025::sec::business-deductions-related-to::b01`). FTB Pub. 1001 names only the expired California childcare credits (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b02`, `::b03`).
- Default: no Schedule CA adjustment and no FTB 3885A basis difference, as for Form 8846. Changes dollars: yes for a California resident, if California allows the full deduction and basis.

## 9. A farm, a rental or a passive business

- Default: an expenditure of anything but a Schedule C business of the return is a gap. A business the owner does not materially participate in makes line 1k a gap (Form 8582-CR for a passive Schedule C business is not figured), as for Form 8846.

## 10. Recapture, controlled groups, estates and trusts

- Recapture (`recapture-of-credit::b01`) is a later year's tax; no fact holds a recapture event.
- A member of a controlled group enters its share of the group's credit on lines 2 and 4 with a statement (`member-of-controlled-group-or-business::b01`). Not modeled: an individual's Schedule C business is treated as its own group.
- Lines 8 and 9 are for estates and trusts. An individual's return stops at line 7; both stay blank.

## Proposals for a discussion

- **The facts layer and the K-1s (item 5).** Before: `businessesOnReturn` reads facts only, so the reduction cannot see line 5. After: pass the K-1 childcare amounts to the reduction (a pass-through receipt read before the businesses), so the own share of a limited line 7 comes off the deductions.
- **Basis carried to later years (item 6).** Before: property not placed in service in 2025 keeps no record of its reduction. After: the depreciation asset of a later year names its Form 8882 reduction.
- **California (item 8).** Add the reductions to Schedule CA line 3 column B and the FTB 3885A basis, if a person agrees California allows the full deduction.
- **A farm (item 9).** Take the share off a Schedule F expense line, the same way as Schedule C.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | stated rule (the same as Form 8846) |
| Lines 1, 2 | published example with numbers (CRS IF12379) |
| Lines 3, 4 | stated rule |
| Line 5 | stated rule; rounding by decision (A96) |
| Line 6 | stated rule |
| Line 7 | published example with numbers (the $150,000 limit) |
| Lines 8, 9 | stated rule (estates and trusts only) |
| Cents boxes | own reading (item 2) |
| Reductions on Schedule C and Form 4562 | published example with numbers (CRS), places by own reading (item 6) |
