# flann — a California cleaning company claims the disabled access credit (synthetic)

Flann Dorsaile is single and lives in Fresno all year. He runs a commercial cleaning company (Schedule C) from an office in a 1978 building, and he materially participates in it. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 8826, its instructions and FTB Publication 1001, then locked (`verification: "unverified"`).

In 2025 the company remodeled its office restroom for wheelchair users: a wider stall, grab bars and a lower sink ($3,101.40, deducted as repairs). Its 2024 gross receipts were $1,180,000, above the $1 million limit, so the second test decides: it had 24 full-time employees in 2024, no more than 30, so it is an eligible small business. He takes the standard deduction on both returns and paid $36,000 of federal estimated tax.

The scenario covers the branches that `elam` cannot: the employee test, line 1 with cents, line 6 with a half dollar, and a California return.

- Form 8826 lines 1, 3, 5, 6 and 8. Line 7 is blank: no K-1.
- Schedule C line 21: the repairs less line 6.
- Form 3800 Part III line 1e and Schedule 3 line 6a.
- Schedule CA (540) line 3 column B: California allows the whole deduction, less only a California credit, and the engine files no FTB 3548. So the expense the federal credit took off comes back as a subtraction (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b04). Form 540 line 14 takes it.

Simplifications: the expenditure and the 2024 answers are stated from the company's books, payroll and the contractor's invoice, which no official form holds. No California estimated tax was paid, so Form 540 shows an amount owed.

Forms that file: Form 1040, Schedules 1, 2, 3, C and SE, Forms 3800, 6251, 8826 and 8995, Schedule CA (540) and Form 540.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8826 line 1 | $3,101.40, rounded | 3,101 |
| 8826 line 3 | 3,101 − 250 | 2,851 |
| 8826 line 5 | smaller of 2,851 and 10,000 | 2,851 |
| 8826 line 6 | 2,851 × 50% = 1,425.50 | 1,426 |
| 8826 line 8 | 1,426 + blank | 1,426 |
| Schedule C line 21 | 9,800 − 1,426 | 8,374 |
| Schedule C line 31 | 1,240,000 − (1,068,000 − 1,426) | 173,426 |
| Schedule SE line 12 | 173,426 × 92.35% = 160,159; 19,860 + 4,645 | 24,505 |
| Form 1040 line 11 | 173,426 − 12,253 | 161,173 |
| Form 1040 line 15 | 161,173 − 15,750 − 29,085 (QBI: 20% of 145,423) | 116,338 |
| Form 1040 line 16 | 2025 rate schedule, single: 17,651 + 24% × 12,988 | 20,768 |
| Form 6251 line 9 | (132,088 − 88,100) × 26% | 11,437 |
| Form 3800 line 1e and line 38; Schedule 3 line 6a | 8826 line 8; the limit is 20,768 − 11,437 | 1,426 |
| Form 1040 line 37 | 20,768 − 1,426 + 24,505 − 36,000 | 7,847 |
| Schedule CA line 3 column B | the credit that reduced line 21 | 1,426 |
| Form 540 line 14, line 17 | 161,173 − 1,426 | 1,426 / 159,747 |
