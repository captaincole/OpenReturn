# dena — a battery start-up elects the payroll tax credit (synthetic)

Dena Tarrowfield is single and lives in Reno, Nevada, all year. She runs a battery company (Schedule C) that first had gross receipts in 2022, and she materially participates in it. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 6765, its instructions and the Form 3800 instructions, then locked (`verification: "unverified"`). The return is federal only: Nevada has no income tax.

The company is a qualified small business: under $5 million of gross receipts in 2025 and none before 2021. She takes the standard deduction and paid $88,000 of estimated tax.

The scenario covers the branches that `cowin` cannot:

- Form 6765 Section B, the alternative simplified credit: line 14, lines 18 to 25, and line 26 at 79% with the section 280C election (Item A Yes).
- Section C: line 28 and line 30.
- Section D, the payroll tax election: lines 33a, 34, 35 from the worksheet on Form 3800, and line 36, the smallest of lines 28, 34 and 35.
- Section F from stated totals, with Section G blank.
- Schedule C line 26 stays as stated: the election keeps the deduction.
- Form 3800 Part III line 4i; the specified credit limit leaves $8,460 unused, which line 35 reads.

Simplifications: the research is a stated answer from the company's books, which no official form holds. The attributable taxable income (Form 3800's research credit limitation) is her stated answer. Form 8974, which takes line 36 to the payroll tax return, is not in the engine.

Forms that file: Form 1040, Schedules 1, 2, 3, C and SE, Forms 3800, 6765, 8959 and 8995-A.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 6765 line 48 | 640,000 + 70,000 + 12,000 + 100,000 × 65% | 787,000 |
| 6765 lines 18, 19 | 4,000 × 20% | 4,000 / 800 |
| 6765 lines 21 to 24 | 1,230,000 ÷ 6 = 205,000; 787,000 − 205,000 = 582,000; × 14% | 81,480 |
| 6765 lines 25, 26 | 800 + 81,480 = 82,280; × 79% | 65,001 |
| 6765 lines 28, 30 | no line 27, no K-1 | 65,001 |
| Schedule C line 31 | 3,900,000 − 3,520,000 | 380,000 |
| Form 1040 line 15 | 363,993 − 15,750 − 69,649 | 278,594 |
| Form 1040 line 16 | 2025 rate schedule, single | 67,055 |
| Form 3800 line 4i | the research limit 66,190 does not bind | 65,001 |
| Form 3800 lines 13, 27, 38 | 25% × (67,055 − 25,000); 67,055 − 10,514 | 10,514 / 56,541 / 56,541 |
| 6765 line 34 | the election, under $500,000 | 20,000 |
| 6765 line 35 | worksheet: 65,001 − 56,541 | 8,460 |
| 6765 line 36 | smallest of 65,001, 20,000, 8,460 | 8,460 |
| Form 1040 line 34 | 88,000 − (67,055 − 56,541 + 33,371) | 44,115 |
