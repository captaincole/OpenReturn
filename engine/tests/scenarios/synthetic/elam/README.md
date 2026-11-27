# elam — a climbing gym claims the disabled access credit (synthetic)

Elam Varrowind is single and lives in Reno, Nevada, all year. He runs an indoor climbing gym (Schedule C) in a leased building opened in 1984, and he materially participates in it. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 8826 and its instructions, then locked (`verification: "unverified"`). The return is federal only: Nevada has no income tax.

In 2025 the gym built an entrance ramp and widened its restroom doors ($7,400, deducted as repairs). It also paid a sign language interpreter for its beginner classes ($1,250, deducted as contract labor). Its 2024 gross receipts were $385,000, so it is an eligible small business. Elam is also a general partner in a bouldering park partnership. Its Schedule K-1 (Form 1065) reports only a disabled access credit (box 15, code K). He takes the standard deduction and paid $16,000 of estimated tax.

The scenario fills every line of Form 8826:

- Line 1: the two expenditures. Lines 3, 5 and 6: the credit of his own gym.
- Line 7: the K-1 credit. Line 8 goes to Form 3800 Part III line 1e.

Other lines that change: Schedule C lines 11 and 21 (each expense less its share of line 6), Form 3800 Part III line 1e with two items, and Schedule 3 line 6a. Form 6251 files because line 1e is a credit that tentative minimum tax limits.

Simplifications: the expenditures and the 2024 gross receipts are stated answers from the gym's books and invoices, which no official form holds. The K-1 has no income boxes.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 8826 and 8995.

## Inputs

| Expenditure | Kind | Amount | Schedule C line |
| --- | --- | --- | --- |
| Entrance ramp, wider restroom doors | Removing barriers | $7,400 | 21 (repairs, $15,900 stated) |
| Sign language interpreter | Qualified interpreter | $1,250 | 11 (contract labor, $4,600 stated) |
| Sierra Bouldering Park LLC, K-1 box 15 code K | Partnership credit | $600 | none |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8826 line 1 | 7,400 + 1,250 | 8,650 |
| 8826 line 3 | 8,650 − 250 | 8,400 |
| 8826 line 5 | smaller of 8,400 and 10,000 | 8,400 |
| 8826 line 6 | 8,400 × 50% | 4,200 |
| 8826 line 7 | the K-1 | 600 |
| 8826 line 8 | 4,200 + 600, not more than 5,000 | 4,800 |
| Schedule C line 21 | 15,900 − 4,200 × 7,400 / 8,650 (3,593) | 12,307 |
| Schedule C line 11 | 4,600 − (4,200 − 3,593) | 3,993 |
| Schedule C line 31 | 410,000 − (296,400 − 4,200) | 117,800 |
| Schedule SE line 12 | 117,800 × 92.35% = 108,788; 13,490 + 3,155 | 16,645 |
| Form 1040 line 11 | 117,800 − 8,323 | 109,477 |
| Form 1040 line 15 | 109,477 − 15,750 − 18,745 (QBI: 20% of 93,727) | 74,982 |
| Form 1040 line 16 | 2025 tax table, single | 11,409 |
| Form 6251 line 9 | (90,732 − 88,100) × 26% | 684 |
| Form 3800 line 1e columns (e) and (g); Schedule 3 line 6a | 8826 line 8; the limit is 11,409 − 684 | 4,800 |
| Form 1040 line 37 | 11,409 − 4,800 + 16,645 − 16,000 | 7,254 |

## Documents

- `docs/01-schedule-k1-sierra-bouldering-park.pdf`: the Schedule K-1 (Form 1065), made by `generate-docs.ts` from the K-1 fact with the committed generator (`tests/scenarios/documents/scheduleK1Form1065.ts`).
