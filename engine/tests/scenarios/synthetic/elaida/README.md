# elaida — an S corporation loss above the shareholder's basis (synthetic)

Elaida and Daved Roihan are married, file jointly and live in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Daved owns all of White Tower Glassworks, Inc., an S corporation, and runs it full time. It pays him a W-2 salary. Its 2025 K-1 shows a large ordinary loss, a small net long-term capital loss, a cash gift to a 60% charity, nondeductible expenses and a cash distribution; Daved also put $15,000 of new capital into the company. His stock basis after the distribution and the nondeductible expenses is smaller than the three loss and deduction items together, so Form 7203 allows each in proportion and carries the rest to 2026. He has never lent the company money. Elaida has two small Schedule C businesses with a profit. Taxable income is 0, and Form 8995 carries a qualified business loss forward. The return is federal only: Washington has no income tax.

Both Schedule C businesses are Elaida's (the taxpayer's): a spouse's Schedule SE is not modeled (issue #221), and the engine does not split the deductible part of SE tax between two businesses for QBI. Their profits together are small enough that no Schedule SE files (92.35% of $400 is under $400), so each business's QBI is its line 31.

Forms that file: Form 1040, Schedules 1, C (two copies), D and E, Forms 7203 and 8995. The couple takes the standard deduction, so the allowed charitable gift reaches no line.

No input documents: the engine has no K-1 document generator, so the facts are the boxes as Schedule K-1 (Form 1120-S) would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, White Tower Glassworks, Inc. (Daved) | box 1, 3 and 5 $40,000; box 2 $2,400 |
| Schedule C, Tar Valon Calligraphy (Elaida) | receipts $900; supplies $720 |
| Schedule C, Amyrlin Dried Flowers (Elaida) | receipts $1,000; advertising $280; supplies $500 |
| Schedule K-1 (Form 1120-S), White Tower Glassworks, Inc. (Daved) | box 1 −$60,000; box 8a −$1,500; box 12 code A $1,100; box 16 code C $500; box 16 code D $4,000; box 17 code V: QBI −$60,000, W-2 wages $40,000 |
| Holding answers | Daved's K-1; material participation; all at risk; stock basis at the start $20,000; capital contributed $15,000; original shareholder; no loans |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 7203 lines 1, 2, 4, 5 | start, contribution, no income items (irs-7203-inst-2025::sec::line-3::b01: losses go to Part III) | 20,000; 15,000; 0; 35,000 |
| 7203 lines 6, 7 | box 16 code D (::line-6::b01); 35,000 − 4,000 | 4,000; 31,000 |
| 7203 lines 8a, 9, 10 | box 16 code C (::line-8a::b01); 31,000 − 500 | 500; 500; 30,500 |
| 7203 line 47 (a) | 60,000 + 1,500 + 1,100 | 62,600 |
| 7203 column (c) | 30,500 is less than 62,600: each line's share, the parts adding to 30,500 (::part-iii::b01, ::b02): 30,500 × 60,000 / 62,600 = 29,233.23; × 1,500 / 62,600 = 730.83; × 1,100 / 62,600 = 535.94 | 29,233; 731; 536 |
| 7203 column (e) | (a) less (c), carried to 2026 (::part-iii::b03) | 30,767; 769; 564 |
| 7203 lines 11, 14, 15 | line 47 (c); 30,500 − 30,500 | 30,500; 30,500; 0 |
| Sch E line 28 A (e), (f) | a loss and a distribution: basis computation attached (irs-1040se-inst-2025::sec::line-28::b03); all at risk | checked; unchecked |
| Sch E line 28 A (i), lines 29b, 31, 32, 41 | the allowed ordinary loss, nonpassive | 29,233; −29,233 |
| Sch E line 27 | no loss from an earlier year | No |
| Sch D lines 12, 15, 16, 21 | the allowed long-term loss (irs-1120sk1-inst-2025::sec::box-8a-net-long-term-capital-gain-loss::b01) | −731; −731; −731; 731 |
| Sch C lines 31 | 900 − 720; 1,000 − 780 | 180; 220 |
| Sch 1 lines 3, 5, 10 | 180 + 220; Schedule E line 41 | 400; −29,233; −28,833 |
| 1040 lines 1a, 7a, 8, 9 | 40,000 − 731 − 28,833 | 40,000; −731; −28,833; 10,436 |
| 1040 lines 11a, 12e, 15 | MFJ standard deduction; 10,436 − 31,500 | 10,436; 31,500; 0 |
| 8995 line 1(c) | 180; 220; the statement's −60,000 × 29,233 / 60,000, the allowed part only (irs-8995-inst-2025::sec::determining-your-qualified-business::b02, ::b03) | 180; 220; −29,233 |
| 8995 lines 2, 4, 16 | 400 − 29,233; 0; the loss carried to 2026 (::line-16::b01) | −28,833; 0; 28,833 |
| 1040 lines 25a, 34 | W-2 box 2, all refunded | 2,400; 2,400 |

Excess business loss: the only business loss is the allowed $29,233, at most $156,500, so Form 461 is not needed (irs-461-inst-2025::sec::who-must-file::b01).
