# adine — a farmer averages a big wheat year (synthetic)

Adine Corrigan is single and farms wheat and cattle near Dalhart, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

2025 was a big wheat year after three lean ones. She sold ten raised breeding cows for $24,000 (Form 4797 Part I, a section 1231 gain). She elects Schedule J for $100,000 of her farm income, the cows' gain in it. Her 2022 to 2024 returns are stated answers: she filed single, never used Schedule J, and had $1,800 of qualified dividends in 2024. She takes the standard deduction and paid $48,000 of estimated tax.

The scenario covers Schedule J lines 1 to 23 except line 2c (she has no unrecaptured section 1250 gain), and Form 1040 line 16, which takes Schedule J line 23. The published examples and the other branches are unit tests (`tests/unit/federal/schedule-j/`).

Forms that file: Form 1040, Schedules 1, 2, D, F, J and SE, Forms 4797 and 8995.

## Inputs

| Input | Amounts |
| --- | --- |
| Farm (Schedule F, cash method) | sales $268,500; program payments $6,200; crop insurance $9,400; custom hire $3,100; expenses $123,700 |
| Form 4797 sale | 10 raised breeding cows: price $24,000, basis $0, no depreciation, held since 2020 |
| 1099-INT, XIT Ranch Country Bank | box 1 $1,100 |
| Schedule J election | elected farm income $100,000, net capital gain in it $24,000 |
| 2022 return | single; taxable income $21,400; tax $2,366 |
| 2023 return | single; taxable income $34,250; tax $3,893 |
| 2024 return | single; taxable income $52,800; tax $6,549; qualified dividends $1,800 |
| Estimated tax | four payments of $12,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 15 | 188,600 − 11,551 − 15,750 − 27,460 | 133,839 |
| Sch J line 1 | 1040 line 15 | 133,839 |
| Sch J line 2a | the election, not more than line 1 | 100,000 |
| Sch J line 2b | the cows' gain, not more than the net capital gain (Schedule D line 15 and 16, $24,000) | 24,000 |
| Sch J line 2c | no unrecaptured section 1250 gain | blank |
| Sch J line 3 | 133,839 − 100,000 | 33,839 |
| Sch J line 4 | 2025 Tax Table on 33,839, no capital gain left (QUESTIONS.md 2): 1,192.50 + 12% × 21,900 | 3,821 |
| Sch J line 5 | 2022 taxable income | 21,400 |
| Sch J line 6 | 100,000 ÷ 3 | 33,333 |
| Sch J line 7 | 21,400 + 33,333 | 54,733 |
| Sch J line 8 | 2022 QDCG with $8,000 (a third of 2b): ordinary 46,733 → 4,807.50 + 22% × 4,958 = 5,898; 15% × 8,000 = 1,200 | 7,098 |
| Sch J line 9 | 2023 taxable income | 34,250 |
| Sch J lines 10, 11 | 33,333; 34,250 + 33,333 | 33,333; 67,583 |
| Sch J line 12 | 2023: ordinary 59,583 → 5,147 + 22% × 14,858 = 8,416; 15% × 8,000 = 1,200 | 9,616 |
| Sch J line 13 | 2024 taxable income | 52,800 |
| Sch J lines 14, 15 | 33,333; 52,800 + 33,333 | 33,333; 86,133 |
| Sch J line 16 | 2024: preferential 1,800 + 8,000; ordinary 76,333 → 5,426 + 22% × 29,183 = 11,846; 15% × 9,800 = 1,470 | 13,316 |
| Sch J lines 17, 18 | 3,821 + 7,098 + 9,616 + 13,316 | 33,851 |
| Sch J lines 19, 20, 21 | the 2022, 2023 and 2024 tax | 2,366; 3,893; 6,549 |
| Sch J line 22 | 2,366 + 3,893 + 6,549 | 12,808 |
| Sch J line 23 | 33,851 − 12,808 | 21,043 |
| 1040 line 16 | Schedule J line 23 (without it: 19,208 + 15% × 24,000 = 22,808) | 21,043 |
| 1040 line 23 | Schedule SE line 12 | 23,102 |
| 1040 line 24 | 21,043 + 23,102 | 44,145 |
| 1040 lines 34, 35a | 48,000 − 44,145 | 3,855 |
