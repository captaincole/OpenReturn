# Form 8586 — open questions

Form 8586 totals the low-income housing credit: line 3 adds line 18 of each Form 8609-A (the buildings the taxpayer owns), line 4 adds the credit passed through on K-1s, and line 5 goes to Form 3800 Part III line 4d. Source: the form and its instructions in one PDF (`irs-8586-form-2025`, Rev. December 2023). They publish no example with numbers. The scenarios are `alar` (a building and a K-1), `ewin` and `haral` (a building each). Tests: `engine/tests/unit/federal/8586/`.

## Two texts conflict

1. **A K-1 credit alone does not file Form 8586** (row A102, `resolveInfo.ts`). The Form 8609-A instructions tell a partner to "file only Form 8586"; Form 8586's own instructions say such a taxpayer is "not required to complete or file this form" (`purpose-of-form::b01`). The engine follows Form 8586. No dollars: the K-1 credit reaches Form 3800 line 4d either way.

## Should we do this now

Doubts with no conflicting text.

2. **Form 8586 files in years 11 to 15 with a credit of 0.** Source: "Attach a copy of each Form 8609-A you completed for the tax year to Form 8586" (`line-3::b01`), and Form 8609-A files every year of the compliance period. Done: a Form 8609-A files Form 8586; line 3 prints 0. No dollars.
3. **Line 2 reads item E of each Form 8609-A.** Item E asks the same question for one building ("Has there been a decrease in the qualified basis", `irs-8609a-inst-2025::sec::specific-instructions::b02`). Done. Line 2 answers "No" when line 1 is 0 too. No dollars.
4. **More than four BINs on line 2.** Source: "If you need more space, attach a schedule" (`face-page-1::b01`). Not now: the engine writes no schedules. Rows (i) to (iii) print; row (iv) is unsupported with the count. No dollars.
5. **The building's credit is passive.** A building the taxpayer owns is a rental real estate activity, so its credit is a passive activity credit (`irs-8582cr-inst-2025::sec::activities-that-aren-t-passive::b01`). Done: each Form 8609-A is its own Form 3800 source and its own Form 8582-CR activity, on Worksheet 3. Form 3800 waits on the answer `rental.real_estate_professional`. Changes dollars: Form 8582-CR allows only the tax on $25,000 (Part IV) without passive income: $6,000 in `ewin` and `haral`.
6. **Worksheet 3, not Worksheet 2.** A building in its compliance period in 2025 began its credit period in 2011 or later, so it was placed in service after 1989 (`irs-8582cr-inst-2025::sec::part-iv-special-allowance-for::b01`). Done: `before1990` is false. No dollars for any 2025 building.
7. **A real estate professional's building.** A rental real estate activity of a real estate professional who materially participated in it is not passive (`activities-that-aren-t-passive::b01`, item 2). Not now: the engine does not ask for material participation in one building. Form 3800 line 4d is unsupported for that owner. Changes dollars for that owner.
8. **Each Form 8609-A is its own activity.** The instructions do not group buildings. Done: one activity for each building, named with its BIN. Changes dollars by at most $1 a row (Form 8582-CR's pro rata shares; Form 3800 Part V).
9. **A stated line 4d credit next to a Form 8609-A.** A Form 3800 line 4d credit stated with no pass-through entity may be the same credit Form 8609-A figures. Done: line 4d is unsupported, as Form 5884 does for line 4b. A stated line 4d credit that names its entity adds to line 4, as Form 5884 line 3 takes other notices.
10. **Each K-1 rounds before line 4 adds.** As row A96 for Form 8846: Form 3800 rounds each K-1 source, so line 4 equals the K-1 rows of Form 3800 line 4d. At most $1 a K-1.
11. **Lines 6 and 7 are for estates and trusts.** "All others, stop here" (`face-page-1::b01`). Done: blank on an individual's return. No dollars.
12. **The decision `decisions.scope.must_file_8586` false.** Done: Form 8586 leaves the return and the buildings' credit does not reach Form 3800. The taxpayer chose not to claim it. Changes dollars: the whole credit.

## Proposals for a discussion

- **An estate's or trust's K-1 credit (box 13 code C).** "Report this amount on Form 8586, line 4" (`irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b01`). The trust box table makes code C a credit with no route (`passThrough/trustBoxes.ts`, `routing.ts`), so Schedule E line 41 is unsupported, and line 4 is unsupported too. The instructions do not say whether a beneficiary's share is a passive activity credit for Form 8582-CR: the rules for an estate or trust "haven't yet been issued" (`irs-8582cr-inst-2025::sec::material-participation::b06`). Proposal: route code C as a `business_credit` to Form 3800 line 4d, with a person's decision on its passive status. It changes the trust box table, so it waits.
- **Material participation in a building, for a real estate professional** (item 7). It needs a new answer on the building fact; a person decides whether the building fact or a separate fact holds it.

## For docs/law-findings.md

None: the statute was not needed. The conflict in item 1 is about which form carries the credit, and the statute has no rule on it.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Line 1 | stated rule |
| Line 2 (Yes, No, BINs (i) to (iii)) | stated rule; own reading for line 1 at 0 (item 3) |
| Line 2 (iv) with more than four BINs | unsupported (item 4) |
| Line 3 | stated rule |
| Line 4 (partnership and S corporation K-1s, other notices) | stated rule |
| Line 4 (estate or trust K-1) | unsupported (proposal) |
| Line 5 | stated rule (form arithmetic) |
| Lines 6 and 7 | stated rule (blank for an individual) |
| Form 3800 line 4d and the passive answer | own reading (items 5 to 8) |
