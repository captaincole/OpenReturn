# Form 8915-F: open questions

The rules are in `lines.ts`, `parts.ts`, `worksheets.ts`, `periods.ts` and `figure.ts`. Block ids are in `irs-8915f-inst-2025` unless named.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

1. **Which named distributions count under the $22,000 limit** (row A24, `lines.ts`): date order, earliest first, on the form's path and on Worksheet 1B.
2. **What column (b) of lines 2 to 4 holds when everything fits** (row A25, `lines.ts`): only each line's qualified amount, not the whole column (a).
3. **A disaster with its $22,000 used in earlier years** (row A26, `figure.ts`): it stays in the Part I table on the form's path, so line 1e is 0, line 6 is 0 and line 7 shows the distributions as taxable; it is removed when Worksheet 1B is required (`worksheet-1b::b10`). The tax does not change: the 1099-R is taxable on Form 1040 either way.
4. **Earlier years' spread income when line 1e is 0** (row A27, `figure.ts`): lines 12 and 23 still bring it in.

## Should we do this now

Defaults with no conflicting text. Each one is done unless it says why not.

1. **The cost share of part of a 1099-R (lines 9 and 29).** Done. "If you have a Form 1099-R with both qualified disaster distributions and nonqualified distributions, you must separately figure the cost attributable to each distribution" (`line-9::b01`, `line-29::b01`). No method is given. The engine shares box 1 − box 2a in proportion to box 1. It changes dollars only for a 1099-R that is part qualified and has a cost.
2. **An IRA amount is taxable in full on line 20.** Done. Line 20 is "the amount from line 3, column (b)". The engine takes the same amount off the 1099-R's taxable amount, but never more than that taxable amount. It changes dollars only when box 2a of an IRA 1099-R is below box 1 with no Form 8606.
3. **Column (a) holds every 1099-R of the person.** Done. "Enter the amounts from box 1 of all your Forms 1099-R on lines 2 through 4 in column (a)" (`line-1e::b06`). The engine includes direct rollovers and other distributions too. It changes line 7 only; line 7 is information.
4. **Worksheet 1B only when required.** Done. "You can choose to use Worksheet 1B" (`worksheet-1b::b01`). Where it is a choice, it gives the same total as lines 1a–1e. No dollars change.
5. **A named distribution outside every period is ordinary.** Done. Requirement 1: "The distribution was made ... within the disaster's qualified disaster distribution period" (`qualified-disaster-distribution-requirements::b01`). It stays on line 5a and line 7. The same for a Part IV distribution outside the window (`qualified-distribution-requirements::b02`).
6. **Part IV with no ending date.** Done. FEMA shows some incidents as continuing; the engine then sets no end to the window "no later than 30 days after the last day of the disaster". The 2021 rule "the first day of the disaster can be no earlier than January 26, 2021" (`qualified-distribution-requirements::b02`) is not checked: a 2021 disaster cannot have a 2025 Part IV distribution unless its incident ran into 2025.
7. **Line 31 counts a repayment up to the taxable part.** Done. "Don't include ... any repayments of nontaxable amounts" (`line-31::b01`). Line 32 never goes below 0.
8. **Lines that say "if any" are blank at 0:** lines 9, 12, 14, 18, 19, 20, 23, 25 and 29, 31. Done. Lines 15 and 26 print 0 ("If zero or less, enter -0-"). Lines 2 to 4 print 0 in both columns when Part I is completed, as the filled-in worksheets do. Lines 12 to 15 stay blank when Part II has no plan amount, no earlier income and no repayment (line 8 No sends the reader to line 12 with nothing to enter). No dollars change.
9. **Lines 8 and 16 are answered only when Part I is completed.** Done. With income from an earlier year only, Appendix A Part II says "Complete lines 12 through 15" (`part-ii::b01`): the questions stay blank. No dollars change.
10. **Item D, the coronavirus, is never checked on a 2025 form.** Done. Coronavirus-related distributions "can NOT be repaid after 2023" (`appendix-a-which-lines-should-i-use::b08`) and their 3-year income ended in 2022. Item B 2020 is a gap for the same reason.
11. **Form 5329 files with a qualified disaster distribution on a code 1 1099-R.** Done. Form 5329 can be skipped when "you owe the additional tax on the full amount shown on each Form 1099-R" (`irs-5329-inst-2025::sec::who-must-file::b02`). With part of a 1099-R left off line 1, the tax is not on the full amount, so the form files. The tax is the same either way.
12. **A different spread choice from the earlier year.** Done. The election can't be made or changed "after the due date (including extensions) for your tax return" (`line-11::b01`), so the engine takes it for each year's form: the 2024 check only sets Worksheet 2 line 1 to 0. Forcing the 2024 choice would put the whole 2025 amount in 2025 (blind case 3: $11,700 on line 11, not $3,900).
13. **Boxes that disagree on an earlier form.** Done. The earlier line 22 box is checked and the line 11 box is not, although line 11 "must" be checked with line 22. The engine reads each line as filed. Chart 2 alone would stop the form (blind case 7: $3,000 on line 12 would go).
14. **A repaid Part IV distribution that has a cost.** Done. The engine treats a repayment as taxable amounts first, up to the taxable part (item 7). A split in proportion would change line 31 (blind case 9: $7,600, not $8,000; line 32 $11,400, not $11,000).
15. **A Roth IRA qualified disaster distribution within the contribution basis.** Done. Form 8606 line 23 is 0, which skips lines 24 and 25, and line 19 takes "the amount, if any, from this year's Form 8606, line 25b" (`irs-8915f-face-2025::sec::face-part-iii::b01`): 0. Form 1040 line 4b keeps the other IRA amounts (`partIII.ts` `form8606Line25b`).
16. **The decision that Form 8915-F does not file.** Done. Form 8606 lines 15b and 25b then take no qualified disaster distribution, because the form "must be filed with the relevant original or amended return" (`qualified-disaster-distribution-requirements::b01`) and "If you have no qualified disaster distributions in 2025 from a traditional IRA, enter -0- on line 15b" (`irs-8606-inst-2025::sec::line-15b::b01`).
17. **The deceased taxpayer rule.** Not now: "The remainder of the distribution must be reported on the return of the deceased taxpayer" (`line-11::b01`) has no fact, and no scenario has a final return. A final return with spread income from an earlier year needs the remaining two thirds stated on the earlier form's lines.
18. **California.** Not now: the engine sends Form 8915-F's amounts into Form 1040 lines 4b and 5b, which California's Schedule CA starts from, but whether California follows the 3-year spread needs FTB guidance the corpus was not searched for. Agelmar and sorilea live in states with no income tax.

## Pattern change

### Proposals for a discussion

1. **Two Forms 8915-F with Part I for one person** (for example 2024 disasters and 2025 disasters in the same year). Before: the engine makes Form 1040 lines 4b and 5b unsupported, because the later form's column (a) is what the earlier form leaves (`section-601-of-the-secure-2-0-act-of-2022::b02–b03`, `line-7::b02–b03`). After: `figure.ts` figures the forms in item B order and passes the distributions each one does not use to the next.
2. **Form 8606 for more than one person, or with two Forms 8915-F.** Before: lines 18 and 19 read Form 8606 field values, and the engine evaluates only the first Form 8606 copy, so other cases are a gap. After: the resolver figures Form 8606 lines 15b and 25b for each person (as Part III already is in `8606/partIII.ts`), so every copy of both forms has its own numbers.
3. **A Part IV IRA distribution on Form 8606.** Before: it is a gap, since Form 8606 line 7 leaves out "Qualified distributions from Part IV ... you repaid" (`irs-8606-inst-2025::sec::line-7::b02`). After: the Part IV fact records the repaid amount, and Form 8606 line 7 subtracts it.

## Fixed rows

Item C has six places, and the Part I and Part IV tables have two rows each. Past them the engine names the gap: more than six disasters, a Part I statement it does not write, and more than two Part IV disasters. Each person files a separate form, one for each item B year; a second form for the same person and year is a gap.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit 363e9fc5, 2026-11-25): it does not model Form 8915-F. Its `gov/irs` variables and parameters have no qualified disaster distribution, 3-year spread or repayment rule; "disaster" appears only in the casualty-loss parameters. Nothing to compare.
- **IRS Direct File** (`form1099Rs.xml`, main branch, 2026-11-25): a 1099-R with the qualified disaster box checked is a knockout (`/flowKnockoutRetirementQualifiedDisasterDistribution`). It has no Form 8915-F logic. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header: name, SSN, items A, B, C | stated rule |
| Item D, the other item A and B boxes | own reading (never checked on a 2025 form) |
| Part I table and dates | stated rule |
| Lines 1a–1e | published example with numbers |
| Worksheet 1B (lines 2–5b column (b) with more than one disaster) | published example with numbers |
| Lines 2–5b, the allocation in date order | stated rule, decided (A24, A25) |
| Lines 6 and 7 | published example with numbers |
| Line 8, 10, 13, 15 | stated rule |
| Line 9, line 29 (cost share) | own reading (item 1) |
| Lines 11 and 22 | published example with numbers |
| Lines 12 and 23 (Worksheets 2 and 4) | stated rule (the tables) |
| Lines 14 and 25 (Worksheets 3 and 5) | published example with numbers |
| Lines 16, 17, 20, 21, 24, 26 | stated rule |
| Lines 18 and 19 (Form 8606 lines 15b and 25b) | published example with numbers |
| Part IV table, dates, lines 27, 28, 30, 31, 32 | stated rule |
| Line 32 write-in | stated rule (used only for a second form's Part I, which is unsupported) |
| Form 1040 lines 4b and 5b | stated rule (the form's lines 15, 26, 32) |
| Form 5329 line 1 | stated rule |
