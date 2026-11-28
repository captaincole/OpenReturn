# Form 8900 — open questions

Form and instructions: Rev. December 2023, for tax years from 2023 (`irs-8900-inst-2025::sec::which-revision-to-use::b01`). The law library was not installed when these rules were written, so no statute text was read.

## 1. No published example

- Source: the instructions have no worked example, and no publication in the corpus has one.
- Default: the tests are limit tests from the form's own lines and the `nieda` scenario, checked by hand.
- Changes dollars: no.

## 2. Miles with decimals

- Source: "Enter the number of eligible railroad track miles ... owned or leased by you" (`irs-8900-inst-2025::sec::line-3a::b01`). No text says whether a part of a mile counts, or how it rounds.
- Default: miles keep two decimals on lines 3a to 3d (`lines.ts`, `MILES_PLACES`), and line 4 rounds to the dollar. The PDF prints them as entered.
- Changes dollars: only for miles stated with more than two decimals ($35 for each 0.01 mile).

## 3. More miles assigned than owned

- Source: "You can only assign each mile of railroad track once during your tax year" (`line-3b::b01`). For the assignee: "If the assignor ... assigns more miles than it has at the end of its tax year, the excess will be used to reduce each assignee's allocation" (`line-3c::b01`).
- Default: line 3b above line 3a is a gap on the assignor's form. An assignee states line 3c after the reduction; the engine does not figure it.
- Changes dollars: no.

## 4. A member of a controlled group or a group under common control

- Source: "Enter your share of the credit on line 5. Attach a statement showing how your share of the credit was figured, and write 'See Attached' next to the entry space for line 5" (`member-of-controlled-group-or::b01`). The text does not say what a member enters on lines 1 to 4.
- Default: lines 1 to 4 are the member's own figures; line 5 is the stated share (`groupShareOfCredit`). "See Attached" does not print: line 5 is a number field.
- Changes dollars: no; line 5 is the stated share either way.

## 5. Which amount lowers the basis

- Source: "Use the amount of RTMC to reduce the basis ... The reduction is limited to the amount of QRTME capitalized for the asset" (`adjustments-to-basis::b01`).
- Default: line 5, the taxpayer's own credit, up to the amount capitalized, whether or not Form 3800 allows all of it this year. The entity lowers the basis for a K-1 credit (line 6).
- Changes dollars: only when Form 3800 carries part of the credit forward and the statute reads "credit allowed" (not checked: no law library).

## 6. A structure not placed in service in 2025

- Source: the same block; Form 4562 lowers the basis of an asset placed in service in the year (`irs-4562-inst-2025::sec::section-b::b08`).
- Default: no 2025 change. The engine does not carry the lowered basis to the year the structure is placed in service; prior-year assets are one stated amount (`priorYearMacrs`).
- Changes dollars: in a later year, not 2025.

## 7. California

- Source: no California text names this credit, and California has no credit like it in the corpus.
- Default: no Schedule CA adjustment. The asset's `californiaBasis` field can state the unreduced cost for form FTB 3885A; otherwise California uses the lowered cost.
- Changes dollars: yes for a California resident, if California does not lower the basis. The scenario is federal only.

## 8. The deducted part of line 1

- Source: the instructions reduce only the basis of a capitalized asset (`adjustments-to-basis::b01`); no text lowers a deduction for this credit.
- Default: the deducted expenditures (Schedule C line 21 in `nieda`) keep their full deduction.
- Changes dollars: no.

## 9. Cases the engine leaves as gaps

- A Schedule C business the owner does not materially participate in: the credit is a passive activity credit (Form 8582-CR), and the engine does not figure a passive Schedule C business.
- Expenditures capitalized in more than one asset: the instructions do not say how the credit is split.
- Expenditures capitalized in an intangible asset (an amortized cost): the engine lowers only the cost of a 2025 asset.
- An asset with a section 179 election, or not wholly business use, as for Form 8882.
- The decision `decisions.scope.must_file_8900` false while the fact lowers a basis: Form 3800 line 4g is a gap until the two agree.

## 10. The whole credit or a share of it lowers the basis

- Source: "Use the amount of RTMC to reduce the basis ... The reduction is limited to the amount of QRTME capitalized for the asset" (`adjustments-to-basis::b01`). The text does not split the credit between the expenditures deducted and those capitalized; it cites Regulations section 1.45G-1(e)(2), which is not in the corpus.
- Default: the whole of line 5 lowers the basis, up to the amount capitalized (`basisReductionOf`). The blind fill read it the same way.
- Changes dollars: yes, when part of line 1 is deducted. In `nieda`, a share by the capitalized part ($210,000 of $412,500) would lower the basis by $83,300, not $163,625.

## Blind fill (2026-11-27)

A preparer filled 14 cases from the blank form and the instructions only. Every line matched the engine except one.

- Case 7, line 6 and line 7: two K-1s of $1,200.40 and $800.40. The blind fill added the cents and rounded once ($2,001, Form 1040 rule, `irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). The engine rounds each K-1 first ($2,000), so that line 7 equals Form 3800 line 4g, which lists each K-1 by its EIN (`irs-3800-inst-2025::sec::part-v-3::b01`). This is decision A122 in `docs/rule-decisions.md`, the rule of A96 for every K-1 credit line. The engine keeps it; `form.test.ts` pins it.
- The blind doubts that change dollars are items 5 and 10. The others change no dollars (items 4 and 2, blank against 0 on lines 3b, 3c and 6) or follow the form's arithmetic (line 2 is 40% of line 1 as rounded).

## Second opinions

- PolicyEngine-US 2.154.2 (commit c1fea42a38, 2026-11-27): it does not model Form 8900 or section 45G. `general_business_credit` is a bare input with no formula, so it has no constant or formula to compare.
- No other reference implementation the repository names (IRS Direct File) covers business credits.

## Proposals for a discussion

- **Intangible assets.** `BusinessCreditReduction` (facts/kinds/activitiesOnReturn.ts) lowers a Schedule C line, a Part V expense or a 2025 asset's cost. A fourth kind, an amortized cost by its description, would let this credit lower an assignment payment that is capitalized and amortized. It changes the shape every credit's reduction uses, so it waits for a person.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Lines 1 and 2 | stated rule |
| Lines 3a to 3d | stated rule; decimals are my own reading (item 2) |
| Lines 4 and 5 | stated rule; the group share is my own reading of lines 1 to 4 (item 4) |
| Line 6 | stated rule; rounding each K-1 is a decision (docs/rule-decisions.md) |
| Line 7 | stated rule |
| Basis reduction (Form 4562) | stated rule; the amount is my own reading (item 5) |
| No published example with numbers for any line | — |
