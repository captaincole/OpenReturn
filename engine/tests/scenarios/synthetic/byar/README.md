# byar — a pecan farmer claims the work opportunity credit (synthetic)

Byar Hollowmede is single and runs a pecan orchard near Amarillo, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 5884 and its instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Byar hired seven workers that the Texas Workforce Commission certified as members of targeted groups. He materially participates in the orchard. He is also a partner in an orchard supply partnership, whose Schedule K-1 (Form 1065) reports only a work opportunity credit (box 15, code J). He takes the standard deduction and paid $38,000 of estimated tax.

The scenario fills every line of Form 5884 that an individual fills:

- Line 1a: two workers with fewer than 400 hours, at 25%.
- Line 1b: four workers with 400 hours or more, at 40%. Two are cut to their group's wage limit. One long-term family assistance recipient has only $2,000 of her $10,000 limit left after 2024.
- Line 1c: the same recipient's second-year wages, cut to $10,000, at 50%.
- One worker has fewer than 120 hours: no qualified wages.
- Line 3: the K-1 credit. Line 4 goes to Form 3800 Part III line 4b.
- Lines 5 and 6 are for cooperatives, estates and trusts: blank.

Other lines that change: Schedule F line 22 (labor hired less the credit of the orchard's own workers, not the K-1's), Form 3800 Part III line 4b with two sources in Part V, and Schedule 3 line 6a.

Simplifications: the workers are stated answers from the payroll records and the certifications, which no official form holds. The K-1 has no income boxes.

Forms that file: Form 1040, Schedules 1, 2, 3, E, F and SE, Forms 3800, 5884 and 8995-A.

## Inputs

| Worker | Group | Hours | 2025 wages | Earlier years | Line |
| --- | --- | --- | --- | --- | --- |
| Tamsin Ardell | TANF recipient ($6,000) | 620 | $9,200 | — | 1b: $6,000 |
| Rourke Penhale | Veteran, unemployed 6 months ($14,000) | 1,540 | $18,500 | — | 1b: $14,000 |
| Lio Marchetti | Summer youth ($3,000) | 300 | $2,850 | — | 1a: $2,850 |
| Dessa Quill | SNAP recipient ($6,000) | 250 | $4,100 | — | 1a: $4,100 |
| Hanne Oakridge | Long-term family assistance ($10,000) | 1,820 | $3,000 first year, $12,400 second year | $8,000 first year | 1b: $2,000; 1c: $10,000 |
| Corvin Ashby | Ex-felon | 90 | $1,500 | — | none (under 120 hours) |
| Mirela Tovar | Vocational rehabilitation ($6,000) | 700 | $5,200 | — | 1b: $5,200 |

Documents: `docs/01-schedule-k1-panhandle-orchard-supply.pdf` (made by `generate-docs.ts`).

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 5884 line 1a | $2,850 + $4,100 = $6,950 × 25% = $1,737.50 | 6,950 / 1,738 |
| 5884 line 1b | $6,000 + $14,000 + $2,000 + $5,200 = $27,200 × 40% | 27,200 / 10,880 |
| 5884 line 1c | $10,000 × 50% | 10,000 / 5,000 |
| 5884 line 2 | 1,738 + 10,880 + 5,000 | 17,618 |
| 5884 line 3 | K-1 box 15 code J | 1,200 |
| 5884 line 4 | 17,618 + 1,200 | 18,818 |
| Schedule F line 22 | $128,000 − 17,618 | 110,382 |
| Schedule F line 34 | $420,000 − 203,582 | 216,418 |
| Schedule SE line 12 | 21,836 + 5,796 | 27,632 |
| Form 1040 line 15 | 216,418 − 13,816 − 15,750 − 37,370 (QBI) | 149,482 |
| Form 1040 line 16 | 2025 single rate schedule on 149,482 | 28,723 |
| Form 3800 line 13 | 25% × (28,723 − 25,000) | 931 |
| Form 3800 line 4b, column (g) | Form 5884 line 2 (Part V row 2) + the K-1 (row 1) | 18,818 |
| Form 3800 line 37, 38 | the smaller of 27,792 and 18,818 | 18,818 |
| Schedule 3 line 6a; Form 1040 line 20 | Form 3800 line 38 | 18,818 |
| Form 1040 line 24 | 28,723 − 18,818 + 27,632 | 37,537 |
| Form 1040 line 34 | 38,000 − 37,537 | 463 |
