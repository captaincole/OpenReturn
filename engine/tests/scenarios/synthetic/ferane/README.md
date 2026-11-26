# ferane — section 965 installments in their later years (synthetic)

Ferane Halloway is single and lives in Bellevue, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the Form 965-A instructions, then locked (`verification: "unverified"`).

She owned shares of S corporations that held foreign corporations, so she owes the section 965 transition tax for 2017 to 2020. She pays most of it in 8 yearly installments. Her facts are the lines of her 2024 Form 965-A. The return is federal only: Washington has no income tax. She takes the standard deduction.

The scenario covers:

- four inclusion years: one paid in full (2017, its 8 installments done), one in its last year with an audit adjustment (2018), one in year 7 (2019), and one with no installment election (2020);
- a liability she assumed by transfer (line 5);
- a deferred S corporation liability triggered in 2022 (line 6);
- Part III with a deferral election Yes and No;
- Part IV with a transfer out and a transfer in during 2025;
- Schedule 2 line 20, which is not added into line 21.

Forms that file: Form 1040, Schedule 2, Form 965-A.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Puget Narrows Freight Partners | box 1 $188,000, box 2 $36,000 |
| 2017 line | with 965 $412,600, without $318,400, installments; paid years 1–8 |
| 2018 line | with $288,350, without $241,900, installments, audit +$4,000 (2022); paid years 1–7 |
| 2019 line | with $96,800, without $90,050, installments; paid years 1–6 |
| 2020 line | with $51,200, without $48,975, no election; paid $2,225 in year 1 |
| Line 5, transfer in | the 2018 liability of another taxpayer, $60,000 assumed in 2023 (year 6); paid $15,000 and $20,000 |
| Line 6, triggered | $12,400 triggered in 2022, installments; paid $992 in years 1–3 |
| Part III 2017 | Halvard Ridge $336,900 (deferred); Marrowstone $327,100 (not deferred) |
| Part III 2018 | Tillicum Bay $254,300 (deferred, then triggered in 2022) |
| Part IV | Halvard Ridge: $18,500 at the start, $6,000 transferred out; Quilcene Shipping: $7,250 transferred in |

## Hand check

The year of an installment is 2025 − the line's year + 1 (`irs-965a-inst-2025::sec::line-1::b02`). The schedule is 8% for years 1 to 5, then 15%, 20%, 25% (`line-1::b01`).

| Line | Rule | Value |
| --- | --- | --- |
| Part III 2017 row 1, (d), (e), (g) | (d) = Part I line 1 (c); 336,900 − 318,400; deferred | 318,400; 18,500; 18,500 |
| Part III 2017 row 2, (e), (g) | 327,100 − 318,400; not deferred | 8,700; blank |
| Part III 2017 total (g) | 18,500 | 18,500 |
| Part III 2018 row 1, (e), (g); total | 254,300 − 241,900 | 12,400 |
| Part I line 1, (d), (e), (f), (i) | 412,600 − 318,400; Part III total; 94,200 − 18,500; election Yes | 94,200; 18,500; 75,700; 75,700 |
| Part I line 2, (d), (e), (f), (i), (j) | 288,350 − 241,900; 12,400; 46,450 − 12,400; Yes; audit | 46,450; 12,400; 34,050; 34,050; 4,000 |
| Part I line 3, (d), (f), (i) | 96,800 − 90,050 | 6,750 |
| Part I line 4, (d), (f), (h) | 51,200 − 48,975; election No | 2,225 |
| Part I line 5, (a), (j), (k) | year of the liability assumed; amount assumed; transferor | 2018; 60,000; 987-65-4322 |
| Part I line 6, (a), (f), (i) | year of the triggering event; election Yes | 2022; 12,400; 12,400 |
| Part II line 1, (j), (k) | year 9: nothing due; 75,700 − 75,700 | 0; blank |
| Part II line 2, (i), (k) | year 8: 100% of (34,050 + 4,000) = 38,050 − 28,538 paid | 9,512 |
| Part II line 2, (j) | 38,050 − 38,050 | 0 |
| Part II line 3, (h), (k) | year 7: 75% of 6,750 = 5,062.50 → 5,063 − 3,713 paid | 1,350 |
| Part II line 3, (j) | 6,750 − 5,063 | 1,687 |
| Part II line 4, (j) | 2,225 − 2,225; year 6, no election, nothing due | 0 |
| Part II line 5, (i), (k) | year 8: 25,000 left × 25% ÷ 25% (the percents still to come) | 25,000 |
| Part II line 5, (j) | 60,000 − 15,000 − 20,000 − 25,000 | 0 |
| Part II line 6, (e), (k) | year 4: 32% of 12,400 = 3,968 − 2,976 paid | 992 |
| Part II line 6, (j) | 12,400 − 3,968 | 8,432 |
| Part II Totals (j) | 0 + 0 + 1,687 + 0 + 0 + 8,432 | 10,119 |
| Part II Totals (k) | 9,512 + 1,350 + 25,000 + 992 | 36,854 |
| Part IV line 1, (i) | 18,500 − 6,000 | 12,500 |
| Part IV line 2, (g), (i) | transfer in: (g) and (i) only | 7,250 |
| Part IV Total (i) | 12,500 + 7,250 | 19,750 |
| Schedule 2 line 20 | Part II Totals (k) (decision A69) | 36,854 |
| Schedule 2 line 21 | line 20 is not added | blank |
| 1040 line 1a, 9, 11a, 11b | W-2 box 1 | 188,000 |
| 1040 line 12e, 14 | single standard deduction | 15,750 |
| 1040 line 15 | 188,000 − 15,750 | 172,250 |
| 1040 line 16 | 2025 rates, single: 1,192.50 + 4,386 + 12,072.50 + 16,536 | 34,187 |
| 1040 line 18, 22, 24 | line 16; no other tax | 34,187 |
| 1040 line 25a, 25d, 33 | W-2 box 2 | 36,000 |
| 1040 line 34, 35a | 36,000 − 34,187 | 1,813 |

The installment is paid separately from the income tax, so it does not reduce the refund on line 34.

The 2018 line's earlier payments follow the same rule: years 1 to 4 pay 8% of 34,050 (2,724). In year 5 the audit raised the liability to 38,050: 40% of it is 15,220, less 10,896 paid, so 4,324. Year 6: 55% is 20,927.50 → 20,928, less 15,220, so 5,708. Year 7: 75% is 28,537.50 → 28,538, less 20,928, so 7,610.
