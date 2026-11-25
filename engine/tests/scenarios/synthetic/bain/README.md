# bain — a made-up seller on installments (synthetic)

Bain Thornwell is single and lives in San Angelo, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He has one W-2 and three installment sales from earlier years, so he files three Forms 6252. He takes the standard deduction. The return is federal only: Texas has no income tax.

- A rental duplex, sold in 2024 to his brother. The brother resold it in September 2025, so Part III applies.
- Pasture land, sold in 2023, with $5,000 of section 1252 recapture still to report (line 25).
- A trailer bought and sold in 2024, held less than a year (Form 4797 line 10).

None of the three served a business he worked in, so each fact answers `nonSection1411TradeOrBusiness: false` and every gain stays in net investment income (Form 8960 line 5b blank).

The scenario checks Form 6252 Parts I to III and their results on Form 4797 lines 4, 10 and 15, Schedule D lines 11 and 19, Schedule 1 line 4, Form 8960 and Form 1040. The published examples are unit tests (`tests/unit/federal/6252/`).

Forms that file: Form 1040, Schedules 1, 2 and D, Forms 4797, 6252 (three copies) and 8960.

## Input documents

None. An installment sale has no information return: the facts come from the sales contracts and the Forms 6252 of the years of sale. The W-2 has no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Duplex 6252 lines 5–11 | stated | 480,000; 100,000; 380,000; 300,000; 90,000; 210,000; 28,800 |
| Duplex line 12 | straight line: no recapture | 0 |
| Duplex lines 13, 14, 16 | 210,000 + 28,800; 480,000 − 238,800 | 238,800; 241,200; 241,200 |
| Duplex lines 17, 18 | 100,000 < 238,800; 380,000 + 0 | 0; 380,000 |
| Duplex line 19 | 241,200 ÷ 380,000 = 0.63474 | 0.6347 |
| Duplex lines 20–23 | not the year of sale | 0; 30,000; 30,000; 80,000 |
| Duplex line 24, 26 | 30,000 × 0.6347 | 19,041 |
| Duplex lines 30–34 | 520,000; line 18; smaller; 30,000 + 80,000; 380,000 − 110,000 | 520,000; 380,000; 380,000; 110,000; 270,000 |
| Duplex line 35, 37 | 270,000 × 0.6347 = 171,369 | 171,369 |
| Pasture lines 13, 14, 18, 19 | 64,000 + 6,000; 160,000 − 70,000; 90,000 ÷ 160,000 | 70,000; 90,000; 160,000; 0.5625 |
| Pasture lines 24, 25, 26 | 16,000 × 0.5625; recapture up to line 24; 9,000 − 5,000 | 9,000; 5,000; 4,000 |
| Trailer lines 10, 12, 13, 14 | 60,000 − 8,000; stated; 52,000 + 1,500 + 8,000 | 52,000; 8,000; 61,500; 13,500 |
| Trailer lines 19, 24 | 13,500 ÷ 75,000; 20,000 × 0.18 | 0.1800; 3,600 |
| 4797 line 4 | 19,041 + 171,369 + 4,000 | 194,410 |
| 4797 line 7 | line 4; line 8 is 0, so to Schedule D | 194,410 |
| 4797 line 10, 15, 17, 18b | "From Form 6252" 3,600; 5,000; 3,600 + 5,000 | 3,600; 5,000; 8,600; 8,600 |
| Schedule D line 11, 15, 16 | 4797 line 7 | 194,410 |
| Unrecaptured 1250 worksheet line 4 | smaller of 90,000 and 241,200, less 0; less 80,000 × 0.6347 = 50,776; up to 190,410 | 39,224 |
| Schedule D line 19 | worksheet lines 6, 7, 9, 18 | 39,224 |
| Schedule 1 line 4, 10; 1040 line 8 | 4797 line 18b | 8,600 |
| 1040 line 9, 11a | 84,000 + 194,410 + 8,600 | 287,010 |
| 1040 line 15 | 287,010 − 15,750 | 271,260 |
| 1040 line 16 | Schedule D Tax Worksheet, below | 43,983 |
| 8960 lines 5a, 12 | 194,410 + 8,600 | 203,010 |
| 8960 lines 15–17 | 287,010 − 200,000 = 87,010 × 3.8% | 3,306 |
| 1040 line 24, 37 | 43,983 + 3,306; less 9,800 withheld | 47,289; 37,489 |

Line 16, the Schedule D Tax Worksheet: line 10 is 194,410 and line 11 the unrecaptured gain 39,224, so line 13 is 155,186. Line 18 is 271,260 − 194,410 = 76,850. Line 20 is the smaller of 116,074 (line 14) and 197,300, and line 21 the larger of 76,850 and 116,074: 116,074. The 25% lines give 0 (line 38 is 310,484 − 271,260 = 39,224, line 39 is 0). Tax on 116,074 by the rate schedule is 20,704.76; 15% of 155,186 is 23,277.90. The total is 43,982.66, less than the regular tax, so line 16 is 43,983.
