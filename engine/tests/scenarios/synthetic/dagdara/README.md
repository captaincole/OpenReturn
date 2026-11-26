# dagdara — a boat builder's look-back interest (synthetic)

Dagdara Holloway is single and lives in Corpus Christi, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

She runs a boat building business (Schedule C, accrual method). In 2025 she completed a research vessel she built from 2023 on the percentage of completion method. With the actual price and costs, 2023 had $40,000 more income than she reported, and 2024 had $15,000 less; 2025 has $25,000 less. She uses the regular method (Form 8697 Part I). She states each year's amounts from her look-back schedule and her 2023 and 2024 returns. She has no input documents.

The scenario renders a filled Form 8697 Part I. Column (a) has an increase in tax, so interest is due; column (b) has a decrease, so interest is refunded. The net interest owed, line 10, goes to Schedule 2 line 17n and raises the tax on Form 1040. The published example and the limit tests are unit tests (`tests/unit/federal/8697/`). The elza scenario covers Part II.

Forms that file: Form 1040, Schedules 1, 2, C and SE, Form 8995, Form 8697.

## Inputs

| Input | Amounts |
| --- | --- |
| Business, Holloway Custom Boatworks | receipts $285,000; supplies $110,000, insurance $9,000, utilities $6,000 |
| Look-back, 2023 | taxable income $120,000; adjustment +$40,000; tax recomputed $31,800; tax as reported $22,200 |
| Look-back, 2024 | taxable income $135,000; adjustment −$15,000; tax recomputed $21,843; tax as reported $25,443 |
| Look-back, 2025 (filing year) | adjustment −$25,000; tax on line 3 $12,817 |

## Hand check

The interest runs from April 15 after each year to April 15, 2026. Each accrual period starts the day after a due date and keeps the rate of its first day (Table 1: 8% from April 16, 2024; 7% from April 16, 2025). Each day grows by the rate over 365, or 366 in 2024.

| Line | Rule | Value |
| --- | --- | --- |
| 8697 filing year line 1 | Form 1040 line 15 | 106,357 |
| 8697 line 1 (a), (b) | stated | 120,000; 135,000 |
| 8697 line 2 filing year, (a), (b) | stated | −25,000; 40,000; −15,000 |
| 8697 line 2 (c) | (a) + (b) (row A69) | 25,000 |
| 8697 line 3 filing year, (a), (b) | line 1 + line 2 | 81,357; 160,000; 120,000 |
| 8697 line 4 filing year, (a), (b) | stated | 12,817; 31,800; 21,843 |
| 8697 line 5 (a), (b) | stated | 22,200; 25,443 |
| 8697 line 6 (a), (b) | line 4 − line 5 | 9,600; −3,600 |
| 8697 line 7 (a) | 9,600 × [(1 + .08/366)^260 × (1 + .08/365)^105 × (1 + .07/365)^365 − 1] = 9,600 × 0.161638 | 1,552 |
| 8697 line 8 (b) | 3,600 × [(1 + .07/365)^365 − 1] = 3,600 × 0.072501 | 261 |
| 8697 line 7 (c), 8 (c) | totals | 1,552; 261 |
| 8697 line 10 | 1,552 − 261 | 1,291 |
| Schedule 2 line 17n, 18 | 8697 line 10 | 1,291 |
| Schedule 2 line 21 | 22,607 self-employment tax + 1,291 | 23,898 |
| 1040 line 23 | Schedule 2 line 21 | 23,898 |
| 1040 line 24 | 18,373 + 23,898 | 42,271 |
| 1040 line 37 | no payments | 42,271 |
