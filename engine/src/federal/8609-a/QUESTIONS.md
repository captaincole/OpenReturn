# Form 8609-A — open questions

Form 8609-A figures one year's low-income housing credit for one building. Sources: the instructions (`irs-8609a-inst-2025`), the form face (`irs-8609a-face-2025`, Rev. December 2008), and the IRS Audit Technique Guide for IRC 42, part 7 ("ATG", https://www.irs.gov/pub/irs-utl/irc42_low_income_housing_credit_atg_part_7.pdf; written for examiners, not in the corpus). Evidence and examples: the unit tests in `engine/tests/unit/federal/8609-a/`.

## For Form 8586

Form 8586 has its rules (`engine/src/federal/8586/`, its own `QUESTIONS.md`). Its line 3 takes "the total credit for attached Form(s) 8609-A" (`irs-8586-form-2025::sec::line-3::b01`), and its line 2 asks for the BINs of the buildings whose qualified basis decreased. `form8609ABuildingCredits(info)` in `credits.ts` returns one entry for each Form 8609-A: the BIN, item E, and line 18 (0 when Part II has no credit; undefined while the copy waits; unsupported when a line up to 18 is). Form 8586 line 1 is the number of entries.

## Two texts conflict

Each is decided, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

1. **Decimals: 4 places, rounded** (row A104, `lines.ts`). Each decimal is "carried out to at least four places" (`line-2::b01`). Changes a few dollars a line. In the blind cases, exact fractions would give $3,000 on line 10, not $2,993 (two-thirds of 4% on $225,000 of additions). They would also give $37,500 on line 6, not $37,494 (a first-year line 2 of 5/24 on a $2,000,000 building).
2. **The 11th year** (row A105, `copies.ts`). Lines 1, 2, 3 and 5 print, 4 and 6 to 15 are blank, line 16 is 0, lines 17 and 18 hold the deferred credit. Changes dollars: the whole year's credit.
3. **Line 17's factor** (row A106, `copies.ts`). The example uses 1.0000 − .1250 (`line-17::b01`); the engine uses the first year's close portion less its modified percentage. Changes dollars when the building was not all low-income at the close of its first year. When line 3 is limited to Form 8609 line 3a (`line-3-2::b01`), both first-year bases are limited to it too (reviewer finding, 2026-11-27): $53,325, not $61,425, for a $1,300,000 building at 9% with line 3a $1,080,000 and first-year portions .3750 and .9000.
   - **For docs/law-findings.md:** the example disagrees with the statute. Text A: "If this is the 11th year, enter 0.8750 times the eligible basis of the building (line 1) times the credit percentage (line 5). The factor 0.8750 is 1.0000 minus 0.1250" (`irs-8609a-inst-2025::sec::line-17::b01`). Text B: "Any reduction by reason of subparagraph (A) in the credit allowable (without regard to subparagraph (A)) for the 1st taxable year of the credit period shall be allowable under subsection (a) for the 1st taxable year following the credit period" (`usc-26-2025::sec::s42::f-2`). The credit "without regard to subparagraph (A)" uses the fraction at the close of the year (`usc-26-2025::sec::s42::c-1-A`), .5000 in the example, not 1.0000.
4. **The worksheet's baseline in year 2** (row A107, `creditYear.ts`). Changes dollars in year 2 only.
5. **When the Line 11 Worksheet applies** (row A108, `lines.ts`). Changes dollars only when the basis fell and came back.

## Should we do this now

Doubts with no conflicting text, and the cases the engine leaves unsupported.

6. **The cents boxes.** Every money line but line 6 has a cents box. The engine rounds to whole dollars, so a line with an amount prints "00". Done; no dollars.
7. **Each month's portion is rounded to 4 places** before the average (line 2 in the first year, worksheet line 4). Source: "Figure the low-income portion as of the end of each full month ... Add these percentages together and divide by 12" (`proc-2014-49-2014-37-i-r-b-535-at-irs-gov-pub-irs-drop::b01`). Done: each month is a 4-place portion, like line 2; the average is rounded once. Changes a dollar at most.
8. **Two-thirds of line 5** (worksheet line 7) is a 4-place decimal, as line 9 is. Done. The ATG writes ".6666"; the results agree for the common rates.
9. **Line 7 with no allocation for the additions.** "You may claim a credit for an addition to qualified basis only if the credit amounts have been allocated by the housing credit agency to cover these additions" (`line-6::b02`). Done for a whole-year owner: line 15's limit (Form 8609 line 1b) holds the credit to the allocation. Not now for a part-year owner (reviewer finding, 2026-11-27): lines 4 and 8 already count the days owned, so line 1b, a whole year's credit, never binds. Two readings give different dollars and the instructions settle neither: limit line 3 to line 3a, or prorate line 1b by the days owned. The engine makes lines 7 to 18 unsupported when a part-year owner's line 3 is above Form 8609 line 3a (`ADDITIONS_PART_YEAR` in `creditYear.ts`). A person decides. Example: line 3 $1,975,000, line 3a and 8a $1,750,000, line 1b $70,000, 60% owned for 214 days: $26,042 with no limit, $23,984 with line 3 limited to line 3a, $24,625 with line 1b prorated.
10. **Line 3's limit to Form 8609 line 3a** applies only "If that is the case" (`line-3-2::b01`): the agency used only the eligible basis the credit needed. Done: the owner states it (`limitedToMaximumQualifiedBasis`). Always limiting would erase covered additions in a later year.
11. **Line 5's minimum.** The block says "don't enter less than 4% on line 2" (`line-5::b03`) under the line 5 instructions; it means the credit percentage. Done: the engine raises line 5 to the stated minimum (4% or 9%); the owner states which one applies.
12. **Years 12 to 15 with item E "Yes".** The stop is written for "No" (`specific-instructions::b02`). Done: with no additions, Part II is blank whatever item E says; no credit is left.
13. **Line 16 weighs an interest change by exact days**, not by the rounded percentages of the example (74.79% + 10.08%, `line-16::b04`). Done; under $1 on most credits.
14. **The date of a sale is the seller's last day.** Done. The month rule (`line-4::b01`) compares the days each owner held in the month. The examples (May 25: seller 151 days) fit this reading.
15. **Line 1 is Form 8609 line 7** ("Generally", `line-1::b01`). Done. A later change to eligible basis (an audit, a grant) is not modeled; a grant goes on line 14 as the instructions say.
16. **Line 15 is not floored at 0.** Done: line 13 less line 14 cannot fall below 0 with the form's own rates.
17. **Items D and E print only after a "Yes" before them**, since the form says to stop. Done.
18. **The ATG's slips.** Its year-2 example prints $42,716 for line 13; $41,405 − $1,311 is $40,094. It also prints $432,253 for $460,056 × 94% ($432,453) and $27,603 for $460,056 − $432,253 ($27,803). The unit test takes the guide's line 7 as given and checks the arithmetic after it.
19. **The at-risk limit of section 42(k)** (`line-3-2::b04`): "See section 42(k)", with no computation. Not now: the instructions give no lines for it. Part II is unsupported.
20. **Additions to qualified basis after the 10-year credit period.** The instructions say the additions credit runs "through the end of the 15-year compliance period" (`line-7::b01`), and the ATG (ch. 17) claims it in years 11 to 15. Not now: line 13 is line 6 less line 12, so the form always includes the credit on the whole basis, and no text gives lines for the addition alone. Unsupported from line 7 in year 11, and the whole of Part II in years 12 to 15. If the IRS confirms the ATG's reading, the engine could figure years 11 to 15 as line 7 (or 8) times two-thirds of line 5 and print it on line 13, with lines 3 to 6 blank.
21. **The Line 11 Worksheet for an owner who held the building part of the year.** Not now: it figures a whole year's modification, and the instructions do not say whether it is prorated like lines 4 and 8. Unsupported from line 11.
22. **An interest change in a year the owner also bought or sold the building.** Not now: line 16 weighs by the days of the whole year, and lines 4 and 8 already count the days owned. Unsupported from line 16.
23. **Line 17 for an owner of part of the building, or of part of the year.** Not now: the instructions give the factor only for the whole building. Unsupported from line 17.

## Pattern change

24. **Items C, D and E print only "Yes".** Before: the PDF has one checkbox field for each of items C, D and E (`c1_03`, `c1_05`, `c1_07`) with two widgets, "Yes" (on state `Yes`, x 487) and "No" (on state `no`, x 508); the catalog has one boolean row for each field, so `true` checks "Yes" and `false` leaves both boxes empty (checked again with pdf-lib on 2026-11-27). After: a catalog row could name its widget's on state (`no`) and the renderer set that state, so items C, D and E print "No". A rebuild with `catalog-form-fields` gives the same rows, because the extractor reads one field, not its widgets. The engine's values are right (`false` is "No"); only the printed form lacks the mark. Item B's two boxes (`c1_01`, `c1_01a`) are separate fields and print correctly.

### Proposals for a discussion

- **A catalog row for each widget state of a checkbox field** (item 24). It changes how the catalog and the renderer work, so it waits for a person.

## Second opinions

- **Blind fill** (2026-11-27, 15 cases): a preparer filled Part II by hand from the blank form and the instructions. No dollar difference. Case 2 (the 11th year) has five blank-or-zero differences: lines 4, 6, 13, 14 and 15 are blank in the engine and 0 in the blind fill (item 2, row A105). The blind fill's dollar doubts are rows A104 to A107 and items 8, 9, 13 and 15.
- **PolicyEngine-US 2.154.1** (commit `0fbed6dd`, 2026-11-26). It does not model the low-income housing credit: no Form 8609-A or 8586 lines, no section 42 parameters. `general_business_credit` is a bare input with no formula (`variables/gov/irs/credits/general_business/general_business_credit.py`). Nothing to compare.
- **Other projects.** The repository names no other reference implementation that models Form 8609-A. IRS Direct File (issue #140) is not checked out here, and it does not support business credits.
- **Catalog against the blank PDF** (2026-11-27). See item 24. The catalog matches what the extractor reads, so it is not rebuilt.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header, item A | stated rule |
| Item B | stated rule |
| Items C, D, E | stated rule (printing: "Yes" only) |
| Line 1 | stated rule |
| Line 2 (year end; first-year average) | published example with numbers |
| Line 3 (with the line 3a limit and the zero-basis cases) | published example with numbers (ATG); stated rule |
| Line 4 and line 8 (month rule) | published example with numbers |
| Line 5 | published example with numbers (format); stated rule (minimums) |
| Line 6 | published example with numbers (ATG) |
| Line 7, line 9, line 10 | published example with numbers (ATG ch. 17; line 9 example); unsupported for a part-year owner above line 3a (item 9) |
| Line 11 (worksheet) | published example with numbers (worksheet line 4; ATG ch. 17); own reading in year 2 (A107) |
| Lines 12, 13 | stated rule (form arithmetic) |
| Line 14 | published example with numbers (step 1) |
| Line 15 | published example with numbers (ATG ch. 15) |
| Line 16 | published example with numbers |
| Line 17 | published example with numbers (ATG); own reading against the instructions' example (A106) |
| Line 18 | stated rule |
| Cents boxes | own reading |
| Years 11 to 15 | own reading (A105); unsupported with additions |
