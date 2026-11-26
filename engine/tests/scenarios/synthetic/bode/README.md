# bode — California tax on trust income averaged over earlier years (synthetic)

Bode Harrowgate is single and lives in San Diego all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a robotics engineer with one W-2 of $1,150,000. Her aunt's Harrowgate Education Trust kept income for seven years while Bode's interest was contingent, so the trust paid no California tax on it. In 2025 the trust paid her $300,000. FTB 5870A Part II Section A puts one sixth on Schedule CA and spreads the tax over 2020 to 2024. She lived in Oregon in 2020 ("No") and moved to California in March 2021 (part-year, "Yes"). Two recomputed years are over $1,000,000, so Part III adds Behavioral Health Services Tax. She takes the standard deduction.

Forms that file: Form 1040, Schedule 2, Form 8959, Schedule CA (540), FTB 5870A, Form 540.

## Input documents

None is generated. The W-2 is the boxes as it would print them. The trust's two numbers (the amount and the seven years) come from the trustee's letter, which has no official form (QUESTIONS.md, "Proposals for a discussion"). The earlier years are her answers from her 2020 to 2024 California returns; the product does not read last year's return (#79).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2 | box 1 and box 16 $1,150,000; box 17 $118,000 |
| Trust | contingent interest; $300,000 accumulated over 7 years |
| 2024 | resident; taxable income $985,000; tax $102,550 |
| 2023 | resident; $1,060,000; tax $112,369; BHST paid $600 |
| 2022 | resident; $640,000; tax $61,623; AMT change −$350 |
| 2021 | part-year; $410,000; tax $36,453; credits up $300 |
| 2020 | nonresident |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 5870A Part II A line 1 | the distribution | 300,000 |
| line 2 | 300,000 / 6 | 50,000 |
| line 3 | 2024 to 2021 resident or part-year; 2020 nonresident | Yes, Yes, Yes, Yes, No |
| line 4 | stated | 985,000; 1,060,000; 640,000; 410,000 |
| line 5, 6 | line 2; 4 + 5 | 50,000; 1,035,000; 1,110,000; 690,000; 460,000 |
| line 7 (a) | 2024 X: 70,116.38 + 12.3% × 313,686 | 108,700 |
| line 7 (b) | 2023 X: 67,876.49 + 12.3% × 411,729 | 118,519 |
| line 7 (c) | 2022 X: 65,835.52 + 12.3% × 12,725 | 67,401 |
| line 7 (d) | 2021 X: 32,523.20 + 11.3% × 84,779 | 42,103 |
| line 8 | stated | 102,550; 112,369; 61,623; 36,453 |
| line 9 | 7 − 8 | 6,150; 6,150; 5,778; 5,650 |
| line 10, 11 | credits up $300 in 2021: subtract | 300 (d); 6,150; 6,150; 5,778; 5,350 |
| line 12, 13 | AMT −350 in 2022 | −350 (c); 6,150; 6,150; 5,428; 5,350 |
| line 14 | 6,150 + 6,150 + 5,428 + 5,350 | 23,078 |
| Part III A years | the "Yes" years | 2024, 2023, 2022, 2021 |
| Part III lines 1 to 3 | line 6; over 1,000,000; 1% | 35,000 → 350; 110,000 → 1,100; 0; 0 |
| Part III line 4, 5 | paid; 3 − 4 | 0, 600, 0, 0; 350, 500, 0, 0 |
| Part III line 6 | 350 + 500 | 850 |
| Schedule CA line 8z, 9a, 10, 27 column C | Part II line 2 | 50,000 |
| 540 line 16, 17 | Schedule CA; 1,150,000 + 50,000 | 50,000; 1,200,000 |
| 540 line 18, 19 | single standard deduction; 17 − 18 | 5,706; 1,194,294 |
| 540 line 31 | 2025 X: 72,219.84 + 12.3% × 451,341 | 127,735 |
| 540 line 32, 33 | exemption credit phased out | 0; 127,735 |
| 540 line 34 | FTB 5870A Part II line 14, box checked | 23,078 |
| 540 line 35, 48 | 33 + 34 | 150,813 |
| 540 line 62 | 1% × 194,294 = 1,943, plus Part III line 6 850 | 2,793 |
| 540 line 64 | 150,813 + 2,793 | 153,606 |
| 540 line 71, 78 | W-2 box 17 | 118,000 |
| 540 line 100, 111 | 153,606 − 118,000 | 35,606 |

The federal return does not change: the distribution from a domestic trust created after 1984 is not federal income here, and Form 4970 does not file.
