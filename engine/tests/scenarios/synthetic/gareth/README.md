# gareth — a basis-limited loss from last year allowed this year (synthetic)

Gareth and Leane Bryne are married, file jointly and live in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Gareth owns all of Kore Springs Stables, Inc., an S corporation, and runs it full time. In 2024 its loss was more than his basis: his 2024 Form 7203 ended at a stock basis of 0 and carried a $12,000 ordinary loss and a $600 cash gift to 2025. All of the carried loss is qualified business loss. In 2025 the company had income, paid a little interest and a cash distribution, and gave $800 to a 60% charity. The 2025 basis allows the carried items and this year's gift in full. The couple itemizes. The return is federal only: Nevada has no income tax.

The return shows Form 7203 Part III column (b), the carried ordinary loss on its own Schedule E row ("PYA") with line 27 answered Yes, the carried and current gifts on Schedule A line 11, and the qualified part of the carried loss on Form 8995 line 3.

Forms that file: Form 1040, Schedules 1, A and E, Forms 7203 and 8995.

No input documents: the engine has no K-1 document generator, so the facts are the boxes as Schedule K-1 (Form 1120-S) and Form 1098 would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Kore Springs Stables, Inc. (Gareth) | box 1, 3 and 5 $90,000; box 2 $9,800 |
| Schedule K-1 (Form 1120-S), Kore Springs Stables, Inc. (Gareth) | box 1 $45,000; box 4 $300; box 12 code A $800; box 16 code D $20,000; box 17 code V: QBI $45,000, W-2 wages $90,000 |
| Holding answers | Gareth's K-1; material participation; all at risk; stock basis at the start $0; bought the stock; carried basis losses: ordinary $12,000, cash gift $600; qualified part of the carried loss $12,000; no loans |
| Form 1098 | interest $24,000; principal $520,000; from 2020 |
| Other itemized | real estate tax $6,000; cash gifts $2,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 7203 lines 1, 3a, 3d, 4, 5 | start 0; box 1 and box 4 (irs-7203-inst-2025::sec::line-3::b01) | 0; 45,000; 300; 45,300; 45,300 |
| 7203 lines 6, 7, 10 | box 16 code D; 45,300 − 20,000; no nondeductible expenses | 20,000; 25,300; 25,300 |
| 7203 line 35 (b), (c) | the carried ordinary loss (::part-iii::b01: column (b)); 25,300 covers all of line 47 | 12,000; 12,000 |
| 7203 line 42 (a), (b), (c) | this year's gift; the carried one; both allowed | 800; 600; 1,400 |
| 7203 line 47 (a), (b), (c) | totals | 800; 12,600; 13,400 |
| 7203 lines 11, 14, 15 | line 47 (c); 25,300 − 13,400 | 13,400; 13,400; 11,900 |
| Sch E line 27 | a loss not allowed in a prior year because of basis is reported (irs-1040se-inst-2025::sec::line-27::b01) | Yes |
| Sch E line 28 A (e), (k) | a distribution and a deduction: basis computation attached; box 1 income | checked; 45,000 |
| Sch E line 28 B (a), (i) | the carried loss on a separate line with "PYA" (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01) | PYA Kore Springs Stables, Inc.; 12,000 |
| Sch E lines 30, 31, 32, 41 | 45,000; 12,000; 45,000 − 12,000 | 45,000; 12,000; 33,000 |
| 1040 lines 1a, 2b, 8, 9, 11a | W-2; box 4 (irs-1120sk1-inst-2025::sec::box-4-interest-income::b01); Schedule 1 line 10 | 90,000; 300; 33,000; 123,300; 123,300 |
| Sch A lines 5b, 7, 8a, 10 | real estate tax; mortgage interest under the limit | 6,000; 6,000; 24,000; 24,000 |
| Sch A line 11 | 2,000 + 800 + 600: box 12 code A on line 11 (irs-1120sk1-inst-2025::sec::box-12-other-deductions::b06) | 3,400 |
| Sch A lines 14, 17 | gifts; 6,000 + 24,000 + 3,400 | 3,400; 33,400 |
| 8995 line 1(c), 2 | the statement's QBI: no business loss held back this year | 45,000 |
| 8995 line 3 | the qualified part of the carried loss allowed this year, 12,000 × 12,000 / 12,000 (irs-8995-inst-2025::sec::line-3::b01) | 12,000 |
| 8995 lines 4, 5 | 45,000 − 12,000; 20% | 33,000; 6,600 |
| 8995 lines 11, 13, 14, 15 | 123,300 − 33,400; no capital gain; 20%; the smaller | 89,900; 89,900; 17,980; 6,600 |
| 1040 lines 12e, 13a, 14, 15 | itemized; QBI deduction; 123,300 − 40,000 | 33,400; 6,600; 40,000; 83,300 |
| 1040 line 16 | MFJ tax table, 83,300–83,350: 2,385 + 12% of 59,475 | 9,522 |
| 1040 lines 25a, 34 | W-2 box 2; 9,800 − 9,522 | 9,800; 278 |
