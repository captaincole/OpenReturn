# Form 8900 — open questions

Form and instructions: Rev. December 2023, for tax years from 2023 (`irs-8900-inst-2025::sec::which-revision-to-use::b01`). The rules were written without the law library. The second pass (2026-11-27) read section 45G and Regulations section 1.45G-1 in it; items 5 and 10 quote them.

## Two texts conflict

### A. The K-1 credits on line 6 round one by one (decision A134)

- Text A, the Form 1040 instructions: "include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`).
- Text B: line 7 goes to "Form 3800, Part III, line 4g" (`irs-8900-face-2025::sec::face-page-1::b02`), broken down "by the EIN of the pass-through entity ... in Part V" (`irs-3800-inst-2025::sec::part-v-3::b01`), one whole-dollar amount for each K-1.
- Decided: text B, as A96, so line 7 equals Form 3800 line 4g (`resolveInfo.ts`, `docs/rule-decisions.md` A134). The blind fill (below) read text A; `form.test.ts` pins text B.
- Dollars: at most $1 for each K-1 with cents. None in `nieda`.

### B. The credit "allowed" or "allowable" lowers the basis (item 5; for `docs/law-findings.md`)

- Instructions: "Use the amount of RTMC to reduce the basis of a qualifying railroad structure (including railroad track) asset or intangible asset, if applicable. The reduction is limited to the amount of QRTME capitalized for the asset" (`irs-8900-inst-2025::sec::adjustments-to-basis::b01`).
- Regulation: "The adjusted basis of the railroad track is reduced by the amount of the RTMC allowable (as determined under paragraph (c) of this section) by the eligible taxpayer for the taxable year, but not below zero" (`cfr-26-2025::sec::s1.45g-1::e-2`). Paragraph (c) is lines 1 to 5: the credit before Form 3800 limits it.
- Statute, section 45G(e)(3): "the basis of such track shall be reduced by the amount of the credit so allowed" (`usc-26-2025::sec::s45g::e`).
- Engine: line 5, up to the amount capitalized, whether or not Form 3800 allows all of it this year (`figures.ts`, `basisReductionOf`). The instructions and the regulation agree, so this is no DECISION; a person decides whether the statute's "allowed" overrides them.
- Dollars: only when Form 3800 carries part of the credit forward. None in `nieda`: Form 3800 line 38 allows the whole $166,075.

## Should we do this now

1. **No published example.** The instructions have no worked example; Regulations section 1.45G-1(c)(4) and (e)(3) have examples with the 50% rate of years before 2023. Not now: the tests are limit tests and the `nieda` scenario, checked by hand. No dollars.
2. **Miles with decimals.** "Enter the number of eligible railroad track miles ... owned or leased by you" (`irs-8900-inst-2025::sec::line-3a::b01`); neither the instructions nor section 1.45G-1 say whether a part of a mile counts. Done: miles keep two decimals on lines 3a to 3d (`lines.ts`, `MILES_PLACES`), and line 4 rounds to the dollar. Dollars only for miles with more than two decimals ($35 for each 0.01 mile).
3. **More miles assigned than owned.** "You can only assign each mile of railroad track once during your tax year" (`line-3b::b01`); the excess "will be used to reduce each assignee's allocation" (`line-3c::b01`). Done: line 3b above line 3a is a gap on the assignor's form; an assignee states line 3c after the reduction. No dollars.
4. **A member of a controlled group or a group under common control.** "Enter your share of the credit on line 5. Attach a statement showing how your share of the credit was figured" (`member-of-controlled-group-or::b01`); the text does not say what a member enters on lines 1 to 4. Done: lines 1 to 4 are the member's own figures, and line 5 is the stated share (`groupShareOfCredit`). "See Attached" does not print: line 5 is a number field. No dollars.
5. **Which amount lowers the basis.** See "Two texts conflict", B.
6. **A structure not placed in service in 2025.** Form 4562 lowers the basis of an asset placed in service in the year (`irs-4562-inst-2025::sec::section-b::b08`). Not now: prior-year assets are one stated amount (`priorYearMacrs`), so the engine has no asset to carry a lowered basis to a later year. Dollars in a later year, not 2025.
7. **California.** No California text in the corpus names this credit. Not now: no Schedule CA adjustment; the asset's `californiaBasis` field can state the unreduced cost for form FTB 3885A. Dollars for a California resident if California does not lower the basis; `nieda` is federal only.
8. **The deducted part of line 1.** The instructions reduce only the basis of a capitalized asset (`adjustments-to-basis::b01`), and Example 1 of the regulation deducts the whole track maintenance allowance (`cfr-26-2025::sec::s1.45g-1::e-3-ex1-p2`). Done: the deducted expenditures (Schedule C line 21 in `nieda`) keep their full deduction. No dollars.
9. **Cases the engine leaves as gaps.** Not now, each for its reason:
   - A Schedule C business the owner does not materially participate in: the credit is a passive activity credit (Form 8582-CR), and the engine does not figure a passive Schedule C business.
   - Expenditures capitalized in more than one asset: the regulation allocates the reduction "among each of the assets subject to the reduction in proportion to the unadjusted basis of each asset" (`cfr-26-2025::sec::s1.45g-1::e-2-p2`). The fact holds each asset's capitalized amount, not its unadjusted basis, and the case is rare.
   - Expenditures capitalized in an intangible asset (an amortized cost): the engine lowers only the cost of a 2025 asset (see "Pattern change").
   - An asset with a section 179 election, or not wholly business use, as for Form 8882.
   - The decision `decisions.scope.must_file_8900` false while the fact lowers a basis: Form 3800 line 4g is a gap until the two agree, so the return never loses the credit and keeps the lowered basis.
10. **The whole credit or a share of it lowers the basis.** Settled by the regulation's Example 1: "X reduces the capitalized amount of $250,000 by the RTMC of $500,000 claimed by X for 2006, but not below zero" (`cfr-26-2025::sec::s1.45g-1::e-3-ex1-p2`), although X deducts the other $750,000. Done: the whole of line 5 lowers the basis, up to the amount capitalized (`basisReductionOf`). In `nieda` the basis goes down by $163,625, not by a share.
11. **Several taxpayers in one row.** Form 8900 has one line for each amount and no rows; several K-1s add on line 6, and a sole proprietor's railroads are one taxpayer. Nothing to do.

## Pattern change

### Proposals for a discussion

- **Intangible assets.** Before: `BusinessCreditReduction` (facts/kinds/activitiesOnReturn.ts) lowers a Schedule C line, a Part V expense or a 2025 asset's cost, so an assignee that capitalizes its payment as an intangible asset (the regulation's Example 2, `cfr-26-2025::sec::s1.45g-1::e-3-ex2-p2`) gets a gap. After: a fourth kind of reduction, an amortized cost by its description, would lower that cost before its amortization; it changes the shape every credit's reduction uses, so it waits for a person.

## Blind fill (2026-11-27)

A preparer filled 14 cases from the blank form and the instructions only. Every line matched the engine except one.

- Case 7, line 6 and line 7: two K-1s of $1,200.40 and $800.40. The blind fill added the cents and rounded once ($2,001). The engine rounds each K-1 first ($2,000): "Two texts conflict", A.
- The blind doubts that change dollars are items 5 and 10, both now read against the regulation. The others change no dollars (items 4 and 2, blank against 0 on lines 3b, 3c and 6) or follow the form's arithmetic (line 2 is 40% of line 1 as rounded).

## Second opinions

- PolicyEngine-US 2.154.2 (commit c1fea42a38, 2026-11-27): it does not model Form 8900 or section 45G. `general_business_credit` is a bare input with no formula, so it has no constant or formula to compare.
- No other reference implementation the repository names (IRS Direct File) covers business credits.
- Section 45G(a) and (b) agree with the form: 40% for taxable years beginning after 2022, and $3,500 times the miles owned or leased plus the miles assigned (`usc-26-2025::sec::s45g::a`, `usc-26-2025::sec::s45g::b`). Regulations section 1.45G-1(c)(1) still reads 50%, the rate before 2023.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 1 and 2 | stated rule; section 45G(a) agrees |
| Lines 3a to 3d | stated rule; decimals are my own reading (item 2) |
| Lines 4 and 5 | stated rule; the group share is my own reading of lines 1 to 4 (item 4) |
| Line 6 | stated rule; rounding each K-1 is a decision (A134) |
| Line 7 | stated rule |
| Basis reduction (Form 4562) | stated rule; the regulation's Example 1 settles the amount; the statute's "allowed" is a law finding |
| No published example with numbers for any line | — |
