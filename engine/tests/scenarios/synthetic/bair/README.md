# bair — a made-up U.S. citizen working in London (synthetic)

Bair Halloran is 67 and files as head of household with his grandson, who lives with him. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

His U.S. employer sent him to its London office in March 2023, and he is a bona fide resident of the United Kingdom. His W-2 holds his pay, his allowances and $9,000 earned on two U.S. business trips. He pays his London rent in pounds. He claims the foreign earned income exclusion and the housing exclusion. He also has U.S. interest and dividends. His domicile is Florida, so the return is federal only.

The scenario fills Form 2555 Parts I, II and IV to VIII, and the lines that take its results: Schedule 1 line 8d, Form 1040 line 16 by the Foreign Earned Income Tax Worksheet, Schedule 1-A line 2b, Schedule 8812 line 2b and Form 8960 line 13. Part IX stays blank: all his income comes from his employer. The published examples are unit tests (`tests/unit/federal/2555/`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Brightwater Freight Systems | box 1 $225,300, box 2 $19,000, box 3 $176,100, box 5 $225,300 |
| 1099-INT, Gulfline Savings Bank | box 1 $1,500 |
| 1099-DIV, Harborview Index Funds | box 1a and 1b $3,000 |
| Form 2555 answers | wages $150,000; meals $1,200 (excludable), car $4,800, club $600; allowances $59,400; bonus $1,500; rent 30,000 GBP; U.S. trips $3,500 and $5,500 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 2555 line 22g | 12,000 + 2,400 + 9,000 + 3,500 + 30,000 + 2,500 | 59,400 |
| 2555 line 24 | 150,000 + 1,200 + 4,800 + 600 + 59,400 + 1,500 | 217,500 |
| 2555 line 26, 27 | 217,500 − 1,200 meals excludable | 216,300 |
| 2555 line 28 | 30,000 GBP ÷ 0.759 (IRS 2025 average) | 39,526 |
| 2555 line 29b, 30 | full year, location not listed | 39,000 |
| 2555 line 32, 33 | $20,800 for 365 days; 39,000 − 20,800 | 20,800; 18,200 |
| 2555 line 34, 35, 36 | all employer-provided; 1.000; 18,200 × 1.000 | 216,300; 1.000; 18,200 |
| 2555 line 39, 40 | 365 days | 1.000; 130,000 |
| 2555 line 41, 42 | 216,300 − 18,200; smaller of 130,000 and 198,100 | 198,100; 130,000 |
| 2555 line 43, 44, 45 | 18,200 + 130,000; no related deductions | 148,200; 0; 148,200 |
| Schedule 1 line 8d, 9, 10 | line 45, subtracted | 148,200; −148,200; −148,200 |
| 1040 line 9, 11b | 225,300 + 1,500 + 3,000 − 148,200 | 81,600 |
| 1040 line 12e, 15 | HOH 23,625 + 2,000 (65 or older); 81,600 − 25,625 | 25,625; 55,975 |
| Worksheet line 3 | 55,975 + 148,200 | 204,175 |
| Worksheet line 4 | QDCG on 204,175: 39,700 on 201,175 + 15% of 3,000 | 40,150 |
| Worksheet line 5 | Tax Computation Worksheet, HOH, 148,200 | 26,676 |
| 1040 line 16 | 40,150 − 26,676 | 13,474 |
| Schedule 8812 line 2b, 3 | lines 45 and 50; 81,600 + 148,200 | 148,200; 229,800 |
| Schedule 8812 line 12, 14 | 2,200 − 5% of 30,000 | 700 |
| Schedule 8812 Part II-A | no additional child tax credit with Form 2555 | blank |
| Schedule 1-A line 2b, 3 | line 45; 81,600 + 148,200 | 148,200; 229,800 |
| Form 8960 line 13 | 81,600 + line 42 (130,000) | 211,600 |
| Form 8960 line 17 | 3.8% of the smaller of 4,500 and 11,600 | 171 |
| Form 8959 line 7 | 0.9% of 25,300 | 228 |
| 1040 line 22, 23, 24 | 13,474 − 700; 228 + 171; 12,774 + 399 | 12,774; 399; 13,173 |
| 1040 line 34 | 19,000 − 13,173 | 5,827 |
