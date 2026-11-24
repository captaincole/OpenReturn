# ottilie (synthetic, unverified)

Ottilie and Rafael Quintana are made-up taxpayers. No filed return, benchmark
case or IRS test package stands behind their values. A person checked each
line below by hand against the form and its instructions, then locked the
engine's output.

## Who they are

- Married filing jointly, full-year California residents (Fresno).
- Ottilie's W-2: $58,000 wages and $2,000 of dependent care FSA benefits
  (box 10). Rafael's W-2: $36,650 wages. $350 of credit union interest.
- Mateo (4, their son) goes to a preschool: $6,500. Ines (7, Rafael's
  daughter, 58% physical custody) goes to a babysitter who cares for her in
  the sitter's home: $3,000. All care is in Fresno.
- The FSA: $300 of 2024 money used in the grace period, $100 forfeited, so
  $2,200 reimbursed. Expenses paid beyond it: Mateo $4,300, Ines $3,000.
- Ines's other parent paid $4,800 of child support.

## Documents

Made by `generate-docs.ts` from the provider facts (fake data): each care
provider's year-end statement (`docs/01-sunflower-hill-care-statement.pdf`,
`docs/02-lupe-arroyo-care-statement.pdf`), with the name, address, TIN, phone
and the total paid. The provider type (FTB 3506 line 1d), the household
employee box and the qualifying persons' amounts are answers, not printed. The
W-2s, the 1099-INT and the FSA statement have no PDF.

## What it covers

- FTB 3506 Part I (the return's interest and the stated child support), both
  provider columns of line 1, two rows of line 2 (one with shared custody),
  Part IV with a grace period and a forfeit, and lines 3 to 12.
- Line 12 goes to Form 540 line 40, line 47 and line 48.
- Federal Form 2441 Parts II and III, Schedule 3 and Form 1040 line 20.
- Not covered: the worksheet for 2024 expenses (line 11 is 0). The unit tests
  cover it.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 1040 line 11 (AGI) | 95,000 | 58,000 + 36,650 + 350 |
| 1040 line 16 | 7,146 | 63,500 taxable (31,500 standard deduction), tax table |
| 2441 line 11 | 760 | 3,800 × 20% |
| 1040 line 21 | 5,160 | 4,400 child tax credit + 760 |
| 3506 Part I | 350 / 4,800 | interest; child support |
| 3506 line 1g | 6,500 / 3,000 | amounts paid to each provider |
| 3506 line 2 (e) | 4,300 / 3,000 | expenses paid beyond the FSA |
| 3506 line 2 (d), row 2 | 58 | Ines's custody percent |
| 3506 line 13 | 2,000 | W-2 box 10 |
| 3506 line 14, 15 | 300, 100 | grace period, forfeited |
| 3506 line 16 | 2,200 | 2,000 + 300 − 100 |
| 3506 line 17, 18 | 9,500, 2,200 | 6,500 + 3,000; the smaller of 16 and 17 |
| 3506 line 19, 20, 21 | 58,000, 36,650, 2,200 | W-2 box 1 each; the smallest of 18–20 |
| 3506 line 22, 23 | 5,000, 0 | the plan limit; no own business |
| 3506 line 24, 25, 26, 27 | 2,200, 0, 2,200, 0 | 16 − 23; smallest of 21–23; 2,200 − 0; 2,200 − 2,200 |
| 3506 line 28, 29, 30 | 6,000, 2,200, 3,800 | two persons; 25 + 26; 28 − 29 |
| 3506 line 31, 32, 33 | 7,300, 3,800, 3,800 | 4,300 + 3,000; Form 2441 line 31; the smallest |
| 3506 line 3, 4, 5, 6 | 3,800, 58,000, 36,650, 3,800 | line 33; each spouse's earned income; the smallest |
| 3506 line 7, 8 | .20, 760 | AGI over $43,000; 3,800 × .20 |
| 3506 line 9, 10 | .34, 258 | AGI over $70,000 and not over $100,000; 760 × .34 = 258.40 |
| 3506 line 11, 12 | 0, 258 | no 2024 expenses paid in 2025; 258 + 0 |
| 540 line 31, 32, 35 | 2,086, 1,256, 830 | 83,588 taxable; 2 × 153 + 2 × 475 |
| 540 line 40, 47, 48 | 258, 258, 572 | FTB 3506 line 12; 830 − 258 |
| 540 line 115 | 1,628 | 2,200 withheld − 572 |
