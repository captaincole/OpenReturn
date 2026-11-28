# tad — Form 7211, a solar farm that sells to a utility

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (below), then locked.

## Who

Tad Brannock, single, a full-year Texas resident (no state return). He is an
electrical engineer with a W-2 of 210,000. On his ranch land he owns a solar
farm (Schedule C, material participation). It sells all its output to the
local utility: gross receipts 79,639, expenses 69,500, net profit 10,139.

- The array is 950 kW ac, so under 1 megawatt (line 7a): the alternative
  amount, 3 cents a kWh for 2025.
- It is in a census tract whose coal mine closed: the energy community bonus
  (line 8).
- Its steel, iron and manufactured products are certified as made in the
  United States: the domestic content bonus (line 9).
- A county green-energy loan from tax-exempt bonds paid 180,000 of its
  1,440,000 cost (line 6a).
- Construction began in September 2024; it went into service in March 2025
  and sold 1,284,500 kWh in 2025.
- The depreciation, 52,000, is a stated Schedule C line 13 amount, so Form
  4562 is left out.

## What it covers

Form 7211: Part I, and Part II lines 1, 3, 5a to 9 and 11, with the bond
reduction. Form 3800 takes line 11 on Part III line 1gg. The credit is not a
specified credit, so the tentative minimum tax (Form 6251) limits it: Form
3800 line 38 is 8,009 and the rest carries forward. Schedule 3 line 6a and
Form 1040 line 20 take line 38. `tests/unit/federal/7211/form.test.ts` checks
the separate form for K-1 credits (line 10), the waits and the gaps.

## Documents

The W-2 amounts only. The solar farm's amounts are his answers from the
business's books, the utility's meter statements, the loan statement, the
domestic content certification and the energy community record. No IRS form
reports them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 7211 1(a) / 1(b) / 1(c) | 1,284,500 / 0.03 / 38,535 | kWh sold; 1.5 cents × 1.9971 = 2.996, to 3.0 cents; 1,284,500 × $0.03 |
| 7211 3 / 5a / 5b | 38,535 / 3,854 / 42,389 | line 1(c); 38,535 × 10% = 3,853.50; 38,535 + 3,854 |
| 7211 6a / 6b / 6c / 6d | 0.125 / 5,299 / 6,358 / 5,299 | 180,000 ÷ 1,440,000; 42,389 × 0.125 = 5,298.63; × 15% = 6,358.35; smaller |
| 7211 7 / 8a / 8b | 37,090 / 3,372 / 40,462 | 42,389 − 5,299; 37,090 × 0.0909091 = 3,371.82; 37,090 + 3,372 |
| 7211 9 / 11 | 40,462 / 40,462 | no elective payment; no line 10 on this form |
| 3800 1gg (e), 2, 6 | 40,462 | Form 7211 line 11 |
| 3800 11 / 13 / 14 / 16 | 41,784 / 4,196 / 33,775 / 8,009 | Form 1040 line 16; 25% × (41,784 − 25,000); Form 6251 line 9; 41,784 − 33,775 |
| 3800 17 / 38 | 8,009 / 8,009 | smaller of 40,462 and 8,009 |
| 6251 4 / 6 / 9 | 218,002 / 129,902 / 33,775 | 202,252 + 15,750; − 88,100; × 26% |
| Sch 3 6a / 1040 20 / 22 | 8,009 / 8,009 / 33,775 | Form 3800 line 38; 41,784 − 8,009 |
| 1040 15 / 16 | 202,252 / 41,784 | 220,003 − 15,750 − 2,001; 2025 single rates |
