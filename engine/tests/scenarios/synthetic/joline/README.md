# joline — a made-up California seller on installments (synthetic)

Joline Trevane is single and lives in Sacramento, California, all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2 and two installment sales of capital assets in 2025. So she files two Forms 6252 and two FTB 3805E. She takes the standard deduction on both returns.

- A vacant lot, sold in March 2025 to her brother. He resold it in November 2025, so Part III applies. A California credit lowered her California basis by $10,000 (ca-540-sched-d-inst-2025::sec::line-1::b04), so her California gain is larger. This is the first copy.
- Her main home, sold in June 2025. She excludes $250,000 of gain (line 15). The buyer took over a mortgage that is more than her basis (lines 17 and 20). Its amounts are the same on both returns.

The scenario checks FTB 3805E Parts I to III, the Schedule D (540) line 1 rows, line 12b, Schedule CA line 7a column C and Form 540. `uno` covers the other side (line 12a) and a year after the sale. The interest on her notes is left out: it goes on Schedule B, not on these forms.

Forms that file: Form 1040, Schedules 2 and D, Forms 6252 (two copies) and 8960; Form 540, Schedule CA (540), Schedule D (540) and FTB 3805E (two copies).

## Input documents

None. An installment sale has no information return: the facts come from the sales contracts. The W-2 has no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Lot 3805E lines 5, 7 | stated; no debt | 300,000; 300,000 |
| Lot lines 8, 10, 11, 13 | California basis; 90,000 + 6,000 | 90,000; 90,000; 6,000; 96,000 |
| Lot lines 14, 16, 18 | 300,000 − 96,000; no exclusion; 300,000 + 0 | 204,000; 204,000; 300,000 |
| Lot line 19 | 204,000 ÷ 300,000 | 0.6800 |
| Lot lines 21, 22, 24, 26 | stated; 60,000 × 0.68 | 60,000; 60,000; 40,800; 40,800 |
| Lot lines 3, 28 | brother; resold in 2025, within 2 years, no condition | Yes; Yes |
| Lot lines 30–34 | 340,000; line 18; smaller; 60,000 + 0; 300,000 − 60,000 | 340,000; 300,000; 300,000; 60,000; 240,000 |
| Lot lines 35, 37 | 240,000 × 0.68 | 163,200; 163,200 |
| Lot Form 6252 line 19, 24, 35 | federal basis 100,000: 194,000 ÷ 300,000 = 0.64667 | 0.6467; 38,802; 155,208 |
| Home 3805E lines 13, 14 | 340,000 + 50,000; 900,000 − 390,000 | 390,000; 510,000 |
| Home lines 15, 16 | excluded gain; 510,000 − 250,000 | 250,000; 260,000 |
| Home lines 17, 18, 19 | 450,000 − 390,000; 450,000 + 60,000; 260,000 ÷ 510,000 = 0.50980 | 60,000; 510,000; 0.5098 |
| Home lines 20, 21, 22, 24 | line 17; stated; 210,000 × 0.5098 | 60,000; 150,000; 210,000; 107,058 |
| Schedule D (540) line 1a, 1b (e) | lot 40,800 + 163,200; home line 26 | 204,000; 107,058 |
| Schedule D (540) lines 4, 8, 11 | 204,000 + 107,058 | 311,058 |
| Schedule D (540) line 10 | federal 1040 line 7a: 38,802 + 155,208 + 107,058 | 301,068 |
| Schedule D (540) line 12b; Schedule CA line 7a column C | 311,058 − 301,068 | 9,990 |
| Form 540 lines 13, 16, 17 | federal AGI 88,000 + 301,068; column C; sum | 389,068; 9,990; 399,058 |
| Form 540 lines 18, 19 | standard deduction 5,706 | 5,706; 393,352 |
| Form 540 line 31 | Schedule X: 30,986.19 + 10.3% × (393,352 − 371,479) | 33,239 |
| Form 540 line 32 | exemption credit phased out at this income | 0 |
| Form 540 lines 64, 100 | 33,239; less 3,600 withheld | 33,239; 29,639 |
| 1040 line 15, 16 | 389,068 − 15,750; tax on 72,250 (table, 10,815) + 15% of 301,068 (45,160.20) | 373,318; 55,975 |
| 8960 lines 15–17 | 389,068 − 200,000 = 189,068 × 3.8% | 7,185 |
| 1040 line 24, 37 | 55,975 + 7,185; less 9,500 withheld | 63,160; 53,660 |
