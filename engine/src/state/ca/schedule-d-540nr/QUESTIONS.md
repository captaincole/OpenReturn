# Schedule D (540NR): open questions

The schedule reports gains and losses "as if they were full-year residents" (`ca-540nr-sched-d-inst-2025::sec::purpose::b01`). So lines 1 to 12b are Schedule D (540)'s rules on the same sales, the same California basis facts and the same carryover fact (`../schedule-d-ca/`). The California-source part of each gain or loss is not on this form: it is the Schedule D (540NR) Worksheet, which gives Schedule CA (540NR) line 7a column E. That column is a stated answer (issue #336).

## Two texts conflict

None. The nearest case is question 1 below: the two texts speak of different things, so the form's own instructions decide.

## Should we do this now

1. **Who files.** This form's purpose: "all gains and losses must be reported. Full-year nonresidents or part-year residents complete Schedule D (540NR)" (`::purpose::b01`). Schedule CA (540NR) line 7a: "Generally, no adjustments are made on this line ... If there are differences, use Schedule D (540NR)" (`ca-540nr-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01`). The second text speaks of the adjustment on line 7a, not of who files. Done: the form's own instructions. It files with Form 540NR whenever federal Schedule D files, a 1099-DIV box 2a amount exists, or a California carryover is stated. With no difference, lines 12a and 12b are blank (the `pritalle` scenario). Changes no dollars.
2. **Line 6 on a 540NR return.** "Recalculate those losses as if you had been a resident for all prior years" (`::line-6-california-capital-loss-carryover-from-2024::b01`). Done: the fact `capital_gains.ca_loss_carryover` is that restated amount, and the taxpayer states it. The form asks for it when the federal return carries a loss over. Last year's 540NR worksheet may have carried the nonresident amount (`::capital-loss-carryover-worksheet::b01`, column B), so the restated amount can differ from it. Changes dollars only when the taxpayer states the wrong one.
3. **Line 1 section 1231 row.** Schedule D-1 says "Forms 540 and 540NR filers, enter the gain on Schedule D (540 or 540NR), line 1". Done: the gain Schedule D-1 gives for the same facts on a resident's return. When that return would file Schedule D-1, this return needs it, and the engine figures Schedule D-1 for Form 540 only: lines 4 to 12b are a gap. Not now for the gap: it needs proposal 2. The nonresident's netting of California-source section 1231 items (`::purpose::b01`, second paragraph) belongs to column E, which is stated.
4. **Line 2, a California Schedule K-1.** The engine has no California Schedule K-1 (100S, 541, 565, 568) amount. Done for this form: with a K-1 capital item on the federal Schedule D, line 2 and every total are a gap; without one, line 2 is blank. Not now for Schedule D (540): it leaves its line 2 blank even with a K-1 capital item (its comment predates the pass-through layers), so its line 12a can then move the K-1 gain to Schedule CA as a difference. A full-year resident's Schedule D (540) must not change in this work; see proposal 1.
5. **Other federal Schedule D sources.** Form 6781, 8824, 8621, 8814, 4684 and a Form 6252 capital asset sale send federal Schedule D (so line 10) an amount that line 1 has no California amount for on a 540NR return. Done: each is a gap on lines 4 to 12b and on Schedule CA (540NR) line 7a columns B and C (`sources.ts`). Not now for Schedule D (540), which carries FTB 3805E and Schedule D-1 rows and omits the others silently: that form must not change in this work.
6. **Line 1 with more than 22 sales.** Line 1 has rows a to v, and the instructions name no attached statement or extra copy ("List each capital asset transaction", `::line-1::b01`). Not now: as on Schedule D (540), every row is unsupported with a named reason, and the totals still add every sale. A second copy of the form would repeat lines 2 to 12b, which the form does not allow, and the row cells are shared with Schedule D (540).
7. **Header name on a joint return.** "Name(s) as shown on return". Done (2026-11-26): both spouses, with the shared `namesOnReturn` helper. Schedule D (540) still prints the taxpayer only. Changes no dollars.
8. **Line 8 is exactly 0.** Line 8 covers only "If the amount on line 4 is more than the amount on line 7" and "If the amount on line 7 is more than the amount on line 4" (`::line-8-net-gain-or-loss::b01`). Done: the form's arithmetic. Line 8 and line 11 are 0, line 9 is blank, and lines 12a and 12b compare line 10 with 0. A blank line 11 would drop the adjustment (gain $2,000 less carryover $2,000, federal $2,000: line 12a $2,000).
9. **Federal Form 1040 line 7a is blank.** Line 12a says "Compare the amounts entered on line 10 and line 11" (`::line-12a::b01`). Done: line 10 is 0 when the federal line is blank, so the comparison runs. A blank line 10 would drop the adjustment (a carryover of $6,500 alone: line 11 ($3,000), line 12a $3,000).
10. **Gains inside an HSA.** Schedule CA (540NR) line 7a lists "Gain or loss from the sale of investments inside an HSA" as a difference (`ca-540nr-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01`). Not now: no fact holds an HSA's investment sales, on Form 540 either.

## Pattern change

None. The form reuses Schedule D (540)'s row cells, line 10 and figures (`line1Cells`, `federalCapitalGain`, `capitalFiguresWith` in `../schedule-d-ca/`), which keeps that form's values.

## Field groups

| Group | Rule | Confidence |
| --- | --- | --- |
| Header | name(s) and SSN | stated rule |
| Line 1 rows a to v | Schedule D (540)'s rows: each sale, California basis where stated | stated rule |
| Line 2 | blank with no K-1; a gap with one | unsupported (with a K-1) |
| Lines 3 to 9 and 11 | Schedule D (540)'s arithmetic | published example with numbers (FTB Pub. 1100 Examples 21 to 23, Total column) |
| Line 10 | federal Form 1040 line 7a | stated rule |
| Lines 12a and 12b | line 10 against line 11 | published example with numbers (the four examples under lines 12a and 12b) |
| Schedule CA (540NR) line 7a columns B and C | lines 12a and 12b | stated rule |

## Second opinions

- **PolicyEngine-US 2.154.1** (commit `0fbed6dd`, 2026-11-26). It does not model this form. Its California AGI (`variables/gov/states/ca/tax/income/ca_agi.py`) is federal AGI plus a list of additions, less a list of subtractions; neither list has a capital gain difference, and it has no Form 540NR. Its federal loss limit (`parameters/gov/irs/capital_gains/loss_limit.yaml`) is $3,000, or $1,500 married filing separately, the same as line 9 (`::line-9::b01`). No difference.
- **Other projects.** The TaxCalcBench California cases are full-year resident Form 540 returns. IRS Direct File (issue #140) is federal only. Nothing else in the repository models this form.
- **Blind fill** (2026-11-26, 14 cases): no line differs, in dollars or as blank against 0. Its dollar doubts are questions 8 and 9 above; the engine and the blind preparer chose the same. Its other doubts change no dollars: an empty total is blank, both lines 12a and 12b are blank when line 10 equals line 11, a loss on line 8 is negative, and married filing jointly and head of household take the $3,000 limit.

## Proposals for a discussion

1. **A California Schedule K-1 amount.** A fact on the K-1 holding for the California capital gain or loss of each K-1 (100S, 541, 565, 568). It is a new family of input documents, so it needs a person. Schedule D (540) line 2 and this form's line 2 would both read it.
2. **FTB 3805E and Schedule D-1 on Form 540NR.** Both are figured for Form 540 only. Figuring them on Form 540NR, as if a resident, would close the gaps of questions 3 and 5 for installment sales and business property.
