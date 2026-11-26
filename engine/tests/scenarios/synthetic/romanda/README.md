# romanda — a made-up engineer from California on a contract in Portugal (synthetic)

Romanda Cassalane is 66, single and self-employed. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She keeps her home in San Luis Obispo and is a full-year California resident: she is abroad for a 12-month contract that started in March 2025. She meets the physical presence test from 03/01/2025 to 02/28/2026, with one personal trip home in the summer. Her consulting practice bills U.S. clients in dollars, and she pays her rent in Faro in euros. In 2024 she worked in Spain and could not deduct $2,500 of her housing deduction, so it carries to 2025. She also has an IRA distribution and interest.

The scenario fills Form 2555 Parts I, III and IV to IX: a partial year, line 44 with the self-employment tax deduction, and the housing deduction with its carryover. It shows the lines that take the results: Schedule 1 lines 8d and 24j, Schedule 1-A lines 2b and 2c, and Schedule CA lines 8d and 24j. Form 1040 lines 13a to 16 stay blank: her business earns its income abroad, so its qualified business income is a gap (Form 8995).

## Inputs

| Input | Amounts |
| --- | --- |
| Business answers, Cassalane Water Consulting | gross receipts $150,000; expenses $20,000 |
| 1099-R, Morro Bay Retirement Trust | box 1 and 2a $30,000, box 4 $3,000, code 7 |
| 1099-INT, Los Osos Credit Union | box 1 $2,000 |
| Form 2555 answers | line 20a $150,000, expenses $20,000; rent 30,000 EUR; 2024 lines 46 and 48: $12,000 and $9,500 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 2555 line 18 column (d) | full days: Portugal 151 + 199 = 350 abroad, 12 in the U.S. | 151; 12; 199 |
| 2555 line 31, 38 | 03/01/2025 to 12/31/2025 | 306 |
| 2555 line 28 | 30,000 EUR ÷ 0.886 (IRS 2025 average) | 33,860 |
| 2555 line 29b, 30 | 106.85 × 306 | 32,696 |
| 2555 line 32, 33 | 56.99 × 306; 32,696 − 17,439 | 17,439; 15,257 |
| 2555 line 34 to 36 | all self-employment: skip 34 and 35, line 36 is 0 | blank; blank; 0 |
| 2555 line 39, 40 | 306 ÷ 365 to three places; 130,000 × 0.838 | 0.838; 108,940 |
| 2555 line 41, 42, 43 | 150,000 − 0; smaller of 108,940 and 150,000 | 150,000; 108,940; 108,940 |
| 2555 line 44 | (20,000 + 9,185) × 0.7263 (108,940 ÷ 150,000) | 21,197 |
| 2555 line 45 | 108,940 − 21,197 | 87,743 |
| 2555 line 46, 47, 48 | 15,257 − 0; 150,000 − 108,940; smaller | 15,257; 41,060; 15,257 |
| 2555 line 49 | worksheet: 12,000 − 9,500 = 2,500; 41,060 − 15,257 = 25,803; smaller | 2,500 |
| 2555 line 50 | 15,257 + 2,500 | 17,757 |
| Schedule SE line 12, 13 | 130,000 × 0.9235 = 120,055; 14,887 + 3,482; half | 18,369; 9,185 |
| Schedule 1 line 8d, 10 | line 45; 130,000 − 87,743 | 87,743; 42,257 |
| Schedule 1 line 24j, 26 | line 50; 9,185 + 17,757 | 17,757; 26,942 |
| 1040 line 9, 11b | 2,000 + 30,000 + 42,257; less 26,942 | 74,257; 47,315 |
| Schedule 1-A line 2b, 2c, 3 | 87,743; 17,757; 47,315 + 105,500 | 152,815 |
| Schedule 1-A line 35 to 38 | 6,000 − 6% of 77,815 | 1,331 |
| Schedule CA line 8d columns A, C | Schedule 1 line 8d, added back | 87,743; 87,743 |
| Schedule CA line 24j columns A, B | Schedule 1 line 24j, not allowed | 17,757; 17,757 |
| Form 540 line 17 | 47,315 + 87,743 + 17,757 | 152,815 |
| Form 540 line 19, 31 | 152,815 − 5,706; 3,201.97 + 9.3% of (147,109 − 72,724) | 147,109; 10,120 |
