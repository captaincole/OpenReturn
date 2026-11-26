# ispan — a self-employed designer who buys her own health insurance (synthetic)

Ispan Corvane is single and lives in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She runs a landscape design practice (Schedule C). She buys a medical and dental policy in her own name, outside the Marketplace, for herself and her 24-year-old son (a child under 27 counts). A long-term care contract covers her; she is 58, so only $1,800 of its premiums count. No employer plan was open to either of them. She put $15,000 in a SEP-IRA, paid four estimated tax payments on time, and takes the standard deduction. The return is federal only: Nevada has no income tax. There are no input documents: the facts are her books, her premium statements and her answers.

The long-term care premiums make Form 7206 required instead of the Form 1040 worksheet. Form 7206 line 14 goes to Schedule 1 line 17 and comes off the business's QBI on Form 8995 line 1(c). Lines 11 (an S corporation) and 12 (Form 2555) do not apply and stay blank. The published examples that check the rules are unit tests (`tests/unit/federal/7206/`).

Forms that file: Form 1040, Schedules 1, 2, C and SE, Forms 7206 and 8995.

## Inputs

| Input | Amounts |
| --- | --- |
| Corvane Landscape Design (Schedule C) | receipts $131,500; advertising $2,200, legal $1,800, office $3,100, supplies $6,400 |
| Health and dental premiums, 2025 | $14,260.40 |
| Long-term care premiums, Ispan, age 58 | $2,315.75 |
| SEP-IRA deduction (Schedule 1 line 16) | $15,000 |
| Estimated tax | $5,000 on each of 4/15, 6/16, 9/15/25 and 1/15/26 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Schedule C line 31 | 131,500 − 13,500 | 118,000 |
| Schedule SE line 4a | 118,000 × 92.35% | 108,973 |
| Schedule SE line 12 | 108,973 × 12.4% = 13,513; × 2.9% = 3,160 | 16,673 |
| Schedule SE line 13, Schedule 1 line 15 | half of 16,673 | 8,337 |
| 7206 line 1 | premiums, rounded | 14,260 |
| 7206 line 2 | smaller of 2,315.75 and the age 51–60 limit | 1,800 |
| 7206 line 3 | 14,260 + 1,800 | 16,060 |
| 7206 lines 4, 5 | Schedule C line 31, the only business | 118,000 |
| 7206 line 6 | 118,000 ÷ 118,000 | 1.0000 |
| 7206 line 7 | 8,337 × 1.0000 | 8,337 |
| 7206 line 8 | 118,000 − 8,337 | 109,663 |
| 7206 line 9 | Schedule 1 line 16, the only business | 15,000 |
| 7206 line 10, line 13 | 109,663 − 15,000; no line 12 | 94,663 |
| 7206 line 14, Schedule 1 line 17 | smaller of 16,060 and 94,663 | 16,060 |
| Schedule 1 line 26, 1040 line 10 | 8,337 + 15,000 + 16,060 | 39,397 |
| 1040 line 11a | 118,000 − 39,397 | 78,603 |
| 8995 line 1(c) | 118,000 − 8,337 − 15,000 − 16,060 | 78,603 |
| 8995 line 5, line 14, line 15 | 20% of 78,603 = 15,721; 20% of (78,603 − 15,750) = 12,571 | 12,571 |
| 1040 line 15 | 78,603 − 15,750 − 12,571 | 50,282 |
| 1040 line 16 | tax table, 50,250–50,300, single | 5,975 |
| 1040 line 24 | 5,975 + 16,673 | 22,648 |
| 1040 line 37 | 22,648 − 20,000 | 2,648 |
