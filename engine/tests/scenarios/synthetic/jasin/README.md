# jasin — a made-up landowner who rents a farm for a crop share (synthetic)

Jasin Thornbury is single and lives in Canyon, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Jasin works for a veterinary clinic (one W-2). She also owns a farm section that a tenant works for a third of the crop. She makes the management decisions but does no farm work, so the rent is not self-employment income: it goes on Form 4835. The farm's records give an amount on every line of Parts I and II. She elected to report CCC loans as income, deferred part of her crop insurance to 2026, and capitalizes some orchard costs under section 263A. The conservation costs are over the 25% limit. She takes the standard deduction. The return is federal only: Texas has no income tax.

Forms that file: Form 1040, Schedule 1, Schedule E (page 2 only), Form 4835. The published examples that check the rules are unit tests (`tests/unit/federal/4835/`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, High Plains Animal Clinic | box 1 $78,000, box 2 $13,900 |
| Farm rental (stated from the farm's records) | every amount below |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 4835 line A | management decisions, all of the interest | Yes |
| 4835 line 1 | crop shares sold | 48,000 |
| 4835 lines 2a, 2b | 1099-PATR total; less $300 of personal-purchase dividends | 2,400; 2,100 |
| 4835 lines 3a, 3b | program payments; less the $800 market gain (the election) | 9,000; 8,200 |
| 4835 line 4a | CCC loans reported under the election | 5,000 |
| 4835 lines 4b, 4c | forfeited $6,000; basis $5,400 | 6,000; 600 |
| 4835 lines 5a, 5b, 5c | received $7,500; $3,000 deferred to 2026 | 7,500; 4,500; checked |
| 4835 line 5d | 2024 proceeds deferred to 2025 | 2,000 |
| 4835 line 6 | machinery rented with the land | 1,150 |
| 4835 line 7 | 48,000 + 2,100 + 8,200 + 5,000 + 600 + 4,500 + 2,000 + 1,150 | 71,550 |
| 4835 line 10 | smaller of $20,000 and 25% × 71,550 = 17,887.50 | 17,888 |
| 4835 lines 8, 9, 11 to 29 | stated amounts | 30,600 in all |
| 4835 lines 30a to 30f | six other expenses | 1,750 in all |
| 4835 line 30g | "263A", in parentheses | (500) |
| 4835 line 31 | 30,600 + 17,888 + 1,750 − 500 | 49,738 |
| 4835 line 32 | 71,550 − 49,738 | 21,812 |
| 4835 lines 34a to 34c | net income | blank |
| Schedule E line 40 | Form 4835 line 32 | 21,812 |
| Schedule E line 41 | line 40 only | 21,812 |
| Schedule E line 42 | Form 4835 line 7 | 71,550 |
| Schedule 1 lines 5, 10 | Schedule E line 41 | 21,812 |
| 1040 lines 1a, 1z | W-2 box 1 | 78,000 |
| 1040 line 8 | Schedule 1 line 10 | 21,812 |
| 1040 lines 9, 11a | 78,000 + 21,812 | 99,812 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 99,812 − 15,750 | 84,062 |
| 1040 line 16 | tax table, 84,050–84,100, single | 13,411 |
| 1040 line 25a | W-2 box 2 | 13,900 |
| 1040 lines 34, 35a | 13,900 − 13,411 | 489 |
