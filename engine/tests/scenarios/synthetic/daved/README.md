# daved — a California landscaper claims the work opportunity credit (synthetic)

Daved Corrowind is single and lives in Sacramento all year. He runs a landscape maintenance company (Schedule C) and materially participates in it. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 5884, the Schedule C instructions and FTB Publication 1001, then locked (`verification: "unverified"`).

He hired two veterans that the state certified as members of targeted groups. He takes the standard deduction on both returns and paid $24,000 of federal estimated tax.

The scenario covers the branch that `byar` cannot: a business, not a farm, and a California return.

- Form 5884 lines 1a, 1b, 2 and 4. Line 3 is blank: no K-1.
- Schedule C line 26: the wages less the credit.
- Form 3800 Part III line 4b and Schedule 3 line 6a.
- Schedule CA (540) line 3 column B: California has no such credit, so the wages the credit took off come back as a subtraction (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07). Form 540 line 14 takes it.

Simplifications: the workers are stated answers from the payroll records and the certifications, which no official form holds. No California estimated tax was paid, so Form 540 shows an amount owed.

Forms that file: Form 1040, Schedules 1, 2, 3, C and SE, Forms 3800, 5884 and 8995, Schedule CA (540) and Form 540.

## Inputs

| Worker | Group | Hours | 2025 wages | Line |
| --- | --- | --- | --- | --- |
| Ilyena Sarrow | Veteran with SNAP ($6,000) | 820 | $7,500 | 1b: $6,000 |
| Tomas Verrin | Veteran, disabled and unemployed 6 months ($24,000) | 360 | $6,400 | 1a: $6,400 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 5884 line 1a | $6,400 × 25% | 6,400 / 1,600 |
| 5884 line 1b | $6,000 × 40% | 6,000 / 2,400 |
| 5884 lines 2 and 4 | 1,600 + 2,400 | 4,000 |
| Schedule C line 26 | $82,000 − 4,000 | 78,000 |
| Schedule C line 31 | $240,000 − 123,300 | 116,700 |
| Schedule SE line 12 | 13,364 + 3,125 | 16,489 |
| Form 1040 line 15 | 116,700 − 8,245 − 15,750 − 18,541 (QBI) | 74,164 |
| Form 1040 line 16 | 2025 tax table, single | 11,233 |
| Form 3800 line 4b and line 38; Schedule 3 line 6a | Form 5884 line 4; the tax limit is 11,233 | 4,000 |
| Form 1040 line 34 | 24,000 − (11,233 − 4,000 + 16,489) | 278 |
| Schedule CA line 3 column B | the credit that reduced line 26 | 4,000 |
| Form 540 line 14, line 17 | 108,455 − 4,000 | 4,000 / 104,455 |
