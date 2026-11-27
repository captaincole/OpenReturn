# Schedule D (540NR): open questions

The schedule reports gains and losses "as if they were full-year residents" (`ca-540nr-sched-d-inst-2025::sec::purpose::b01`). So lines 1 to 12b are Schedule D (540)'s rules on the same sales, the same California basis facts and the same carryover fact (`../schedule-d-ca/`). The California-source part of each gain or loss is not on this form: it is the Schedule D (540NR) Worksheet, which gives Schedule CA (540NR) line 7a column E. That column is a stated answer (issue #336).

## Two texts conflict

None.

## Doubts

1. **Who files.** This form's purpose: "all gains and losses must be reported. Full-year nonresidents or part-year residents complete Schedule D (540NR)" (`::purpose::b01`). Schedule CA (540NR) line 7a: "Generally, no adjustments are made on this line ... If there are differences, use Schedule D (540NR)" (`ca-540nr-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01`). The texts do not conflict: the second speaks of the adjustment on line 7a. Default: the form's own instructions. It files with Form 540NR whenever federal Schedule D files, a 1099-DIV box 2a amount exists, or a California carryover is stated. With no difference, lines 12a and 12b are blank. Changes no dollars.
2. **Line 6 on a 540NR return.** "Recalculate those losses as if you had been a resident for all prior years" (`::line-6-california-capital-loss-carryover-from-2024::b01`). The fact `capital_gains.ca_loss_carryover` is that restated amount; the taxpayer states it. Last year's 540NR worksheet may have carried the nonresident amount (`::capital-loss-carryover-worksheet::b01`, column B), so the restated amount can differ from it. Default: the stated fact; the form asks for it when the federal return carries a loss over. Changes dollars only when the taxpayer states the wrong one.
3. **Line 1 section 1231 row.** Schedule D-1 says "Forms 540 and 540NR filers, enter the gain on Schedule D (540 or 540NR), line 1". Default: the gain Schedule D-1 gives for the same facts on a resident's return. When that return would file Schedule D-1, this return needs it, and the engine figures Schedule D-1 for Form 540 only: lines 4 to 12b are a gap. The nonresident's netting of California-source section 1231 items (`::purpose::b01`, second paragraph) belongs to column E, which is stated.
4. **Line 2, a California Schedule K-1.** The engine has no California Schedule K-1 (100S, 541, 565, 568) amount. With a K-1 capital item on the federal Schedule D, line 2 and every total are a gap. Without one, line 2 is blank. Schedule D (540) leaves its line 2 blank even with a K-1 capital item (its comment predates the pass-through layers), so its line 12a can then move the K-1 gain to Schedule CA as a difference. That form must not change in this work; see proposal 1.
5. **Other federal Schedule D sources.** Form 6781, 8824, 8621, 8814, 4684 and a Form 6252 capital asset sale send federal Schedule D (so line 10) an amount that line 1 has no California amount for on a 540NR return. Each is a gap on lines 4 to 12b and on Schedule CA (540NR) line 7a columns B and C (`sources.ts`). Schedule D (540) carries FTB 3805E and Schedule D-1 rows, and omits the others silently; not changed here.
6. **Line 1 with more than 22 sales.** As on Schedule D (540): every row is unsupported, and the totals add every sale.
7. **Header name on a joint return.** As on Schedule D (540): the taxpayer's name only. Changes no dollars.

## Field groups

| Group | Rule | Confidence |
| --- | --- | --- |
| Header | name and SSN, as on Schedule D (540) | stated rule |
| Line 1 rows a to v | Schedule D (540)'s rows: each sale, California basis where stated | stated rule |
| Line 2 | blank with no K-1; a gap with one | unsupported (with a K-1) |
| Lines 3 to 9 and 11 | Schedule D (540)'s arithmetic | published example with numbers (FTB Pub. 1100 Examples 21 to 23, Total column) |
| Line 10 | federal Form 1040 line 7a | stated rule |
| Lines 12a and 12b | line 10 against line 11 | published example with numbers (the four examples under lines 12a and 12b) |
| Schedule CA (540NR) line 7a columns B and C | lines 12a and 12b | stated rule |

## Proposals for a discussion

1. **A California Schedule K-1 amount.** A fact on the K-1 holding for the California capital gain or loss of each K-1 (100S, 541, 565, 568). It is a new family of input documents, so it needs a person. Schedule D (540) line 2 and this form's line 2 would both read it.
2. **FTB 3805E and Schedule D-1 on Form 540NR.** Both are figured for Form 540 only. Figuring them on Form 540NR, as if a resident, would close the gaps of doubts 3 and 5 for installment sales and business property.
