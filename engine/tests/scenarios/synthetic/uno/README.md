# uno — a made-up California seller in a year after the sale (synthetic)

Uno Halloway is single and lives in Fresno, California, all of 2025. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He has one W-2. In August 2023 he sold a vacant lot to his sister on installments, and in 2025 she paid him $40,000. 2025 is the second year after the sale, so Part III's questions apply; she has not resold the lot (line 28 "No"). He got the lot in a 1986 exchange that California treated differently, so his California basis is $30,000 higher (ca-540-sched-d-inst-2025::sec::line-1::b02).

The scenario covers what `joline` cannot: a year after the sale, where FTB 3805E prints no Part I (the form: "Complete this part for the year of sale only"), and a California gain smaller than the federal one, so Schedule D (540) line 12a goes to Schedule CA line 7a column B. The interest on his note is left out.

Forms that file: Form 1040, Schedule D, Form 6252; Form 540, Schedule CA (540), Schedule D (540) and FTB 3805E.

## Input documents

None. The facts come from the 2023 sales contract and the buyer's payment record. The W-2 has no PDF.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 3805E lines 3, 4 | sister; price known | Yes; Yes |
| 3805E lines 5–18 | not the year of sale | blank |
| 3805E line 19 | year of sale: (400,000 − 150,000 − 10,000) ÷ 400,000 | 0.6000 |
| 3805E lines 20–23 | 0; stated; 40,000; stated | 0; 40,000; 40,000; 120,000 |
| 3805E lines 24, 26 | 40,000 × 0.60 | 24,000; 24,000 |
| 3805E lines 27, 28 | within 2 years of the sale; not resold | the sister; No |
| Form 6252 lines 19, 24 | federal basis 120,000: 270,000 ÷ 400,000 | 0.6750; 27,000 |
| Schedule D (540) line 1a (e), 4, 8, 11 | 3805E line 26 | 24,000 |
| Schedule D (540) line 10 | federal 1040 line 7a | 27,000 |
| Schedule D (540) line 12a; Schedule CA line 7a column B | 27,000 − 24,000 | 3,000 |
| Form 540 lines 13, 14, 17 | 70,000 + 27,000; column B; 97,000 − 3,000 | 97,000; 3,000; 94,000 |
| Form 540 lines 18, 19 | standard deduction | 5,706; 88,294 |
| Form 540 line 31 | tax table (88,294) | 4,651 |
| Form 540 lines 32, 64, 100 | one exemption credit; 4,651 − 153; less 2,600 withheld | 153; 4,498; 1,898 |
| 1040 line 15, 16 | 97,000 − 15,750; tax on 54,250 (table, 6,855) + 15% of 27,000 | 81,250; 10,905 |
| 1040 line 37 | 10,905 − 7,200 withheld | 3,705 |
