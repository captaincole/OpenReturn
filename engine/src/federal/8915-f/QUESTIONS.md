# Form 8915-F: open questions

The rules are in `lines.ts`, `parts.ts`, `worksheets.ts`, `periods.ts` and `figure.ts`. Block ids are in `irs-8915f-inst-2025` unless named. The two decisions with conflicting texts are rows A18 and A19 of `docs/rule-decisions.md`.

## Defaults with no conflicting text

1. **The cost share of part of a 1099-R (lines 9 and 29).** "If you have a Form 1099-R with both qualified disaster distributions and nonqualified distributions, you must separately figure the cost attributable to each distribution" (`line-9::b01`, `line-29::b01`). No method is given. The engine shares box 1 − box 2a in proportion to box 1. It changes dollars only for a 1099-R that is part qualified and has a cost.
2. **An IRA amount is taxable in full on line 20.** Line 20 is "the amount from line 3, column (b)". The engine takes the same amount off the 1099-R's taxable amount, but never more than that taxable amount. It changes dollars only when box 2a of an IRA 1099-R is below box 1 with no Form 8606.
3. **Column (a) holds every 1099-R of the person.** "Enter the amounts from box 1 of all your Forms 1099-R on lines 2 through 4 in column (a)" (`line-1e::b06`). The engine includes direct rollovers and other distributions too. It changes line 7 only; line 7 is information ("Report this excess ... in accordance with the instructions for your tax return").
4. **Worksheet 1B only when required.** "You can choose to use Worksheet 1B" (`worksheet-1b::b01`). Where it is a choice, it gives the same total as lines 1a–1e. The engine uses it only when required. No dollars change.
5. **A disaster with $22,000 used is not a Part I disaster.** The Worksheet 1B note says to remove it (`worksheet-1b::b10`). The engine removes it on both paths, so line 1e is never 0 from it. No dollars change.
6. **A named distribution outside every period is ordinary.** Requirement 1: "The distribution was made ... within the disaster's qualified disaster distribution period" (`qualified-disaster-distribution-requirements::b01`). The engine does not count it as qualified; it stays on line 5a and line 7. The same for a Part IV distribution outside the window (`qualified-distribution-requirements::b02`).
7. **Part IV with no ending date.** FEMA shows some incidents as continuing. The engine then sets no end to the window "no later than 30 days after the last day of the disaster". It changes dollars only for such a disaster. The 2021 rule "the first day of the disaster can be no earlier than January 26, 2021" (`qualified-distribution-requirements::b02`) is not checked: a 2021 disaster cannot have a 2025 Part IV distribution unless its incident ran into 2025.
8. **Line 31 counts a repayment up to the taxable part.** "Don't include ... any repayments of nontaxable amounts" (`line-31::b01`). Line 32 never goes below 0. It changes dollars only for a repayment above the taxable part.
9. **Lines that say "if any" are blank at 0:** lines 9, 12, 14, 18, 19, 20, 23, 25 and 29, 31. Lines 15 and 26 print 0 ("If zero or less, enter -0-"). Lines 2 to 4 print 0 in both columns when Part I is completed, as the filled-in worksheets do. No dollars change.
10. **Lines 8 and 16 are answered only when Part I is completed.** With income from an earlier year only, Appendix A Part II says "Complete lines 12 through 15" (`part-ii::b01`): the questions stay blank. No dollars change.
11. **Item D, the coronavirus, is never checked on a 2025 form.** Coronavirus-related distributions "can NOT be repaid after 2023" (`appendix-a-which-lines-should-i-use::b08`) and their 3-year income ended in 2022. Item B 2020 is a gap for the same reason. No dollars change.
12. **Form 5329 files with a qualified disaster distribution on a code 1 1099-R.** Form 5329 can be skipped when "you owe the additional tax on the full amount shown on each Form 1099-R" (`irs-5329-inst-2025::sec::who-must-file::b02`). With part of a 1099-R left off line 1, the tax is not on the full amount, so the form files. The tax is the same either way.
13. **The deceased taxpayer rule** ("The remainder of the distribution must be reported on the return of the deceased taxpayer", `line-11::b01`) has no fact. A final return with spread income from an earlier year needs the remaining two thirds stated on the earlier form's lines; the engine does not ask.
14. **California.** The engine sends Form 8915-F's amounts into Form 1040 lines 4b and 5b, which California's Schedule CA starts from. Whether California follows the 3-year spread was not checked. Agelmar and sorilea live in states with no income tax.

## Proposals for a discussion

1. **Two Forms 8915-F with Part I for one person** (for example 2024 disasters and 2025 disasters in the same year). The later form's column (a) is what the earlier form leaves, and line 7 of the earlier form is 0 with a write-in (`section-601-of-the-secure-2-0-act-of-2022::b02–b03`, `line-7::b02–b03`). The engine makes Form 1040 lines 4b and 5b unsupported. Proposal: figure the forms in item B order, passing the distributions each one does not use to the next, in `figure.ts`.
2. **Form 8606 for more than one person, or with two Forms 8915-F.** Lines 18 and 19 read Form 8606, and the engine evaluates only the first Form 8606 copy. Proposal: figure Form 8606 lines 15a and 25a for each person in the resolver (as Part III already is in `8606/partIII.ts`), so every copy of both forms has its own numbers.
3. **A Part IV IRA distribution on Form 8606.** Form 8606 line 7 leaves out "Qualified distributions from Part IV ... you repaid" (`irs-8606-inst-2025::sec::line-7::b02`). Proposal: a repaid amount on the Part IV fact that Form 8606's line 7 subtracts.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header: name, SSN, items A, B, C | stated rule |
| Item D, the other item A and B boxes | own reading (never checked on a 2025 form) |
| Part I table and dates | stated rule |
| Lines 1a–1e | published example with numbers |
| Worksheet 1B (lines 2–5b column (b) with more than one disaster) | published example with numbers |
| Lines 2–5b, the allocation in date order | stated rule, decided (A18, A19) |
| Lines 6 and 7 | published example with numbers |
| Line 8, 10, 13, 15 | stated rule |
| Line 9, line 29 (cost share) | own reading (question 1) |
| Lines 11 and 22 | published example with numbers |
| Lines 12 and 23 (Worksheets 2 and 4) | stated rule (the tables) |
| Lines 14 and 25 (Worksheets 3 and 5) | published example with numbers |
| Lines 16, 17, 20, 21, 24, 26 | stated rule |
| Lines 18 and 19 (Form 8606 lines 15b and 25b) | published example with numbers |
| Part IV table, dates, lines 27, 28, 30, 31, 32 | stated rule |
| Line 32 write-in | stated rule (used only for a second form's Part I, which is unsupported) |
| Form 1040 lines 4b and 5b | stated rule (the form's lines 15, 26, 32) |
| Form 5329 line 1 | stated rule |
