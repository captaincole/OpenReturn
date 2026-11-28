# wit — Form 8835 on two copies, two wind facilities

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (below), then locked.

## Who

Wit Harrowgate, single, a full-year Texas resident (no state return). His
income is his wind power business (Schedule C, material participation): he
sells the electricity of two wind sites to a utility and services other
owners' turbines. Gross receipts 468,000, expenses 190,000, net profit 278,000.

- Caprock Ridge: two 450 kW turbines (900 kW ac). Construction began in
  September 2022; in service in May 2023. 500,000 kWh sold in 2025. A county
  development bond loan (tax-exempt) paid 40,000 of the 500,000 cost. The
  turbines meet the domestic content rule, and the site is in an energy
  community.
- Garza Flats: one 250 kW turbine. Construction began in June 2018; in service
  in October 2019. 200,000 kWh sold in 2025.
- The depreciation, 58,000, is a stated line 13 amount. Form 4562 is left out.

## What it covers

Two Forms 8835. Copy 1 (Caprock Ridge) has the 0.6-cent rate, the bond
reduction (lines 5a to 5d), line 8b and the 5x amount, and both bonuses. Copy 2
(Garza Flats) has the 3.0-cent rate of a pre-2022 facility and the 40% wind
phase-down (lines 7c and 7d). The golden run checks copy 1;
`tests/unit/federal/8835/form.test.ts` checks copy 2.

Copy 1 is in its first four years, so Form 3800 takes it on line 4e, a
specified credit. Copy 2 is past them: line 1f. Form 6251 files for the
tentative minimum tax that limits line 1f. The whole credit is allowed:
Schedule 3 line 6a and Form 1040 line 20.

## Documents

None. The kilowatt-hours are from the utility's meter statements, the bond
amounts from the loan statement, and the rest from the business's records.
No IRS form reports them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 8835 1a (a) / (c) | 500,000 / 3,000 | kWh sold; 500,000 × $0.006 (placed in service after 2021) |
| 8835 2 / 3 / 4 | 3,000 / 0 / 3,000 | one row; calendar year filer; 3,000 − 0 |
| 8835 5a / 5b / 5c / 5d | 0.08 / 240 / 450 / 240 | 40,000 ÷ 500,000; 3,000 × 0.08; 3,000 × 15%; smaller |
| 8835 6 / 8 | 2,760 / 2,760 | 3,000 − 240; no line 7 (begun in 2022) |
| 8835 9 | 13,800 | box 8b (begun before January 29, 2023): 2,760 × 5 |
| 8835 10 / 11 / 12 / 13 / 15 | 1,380 / 1,380 / 16,560 / 16,560 / 16,560 | 10% each of 13,800; add; no elective payment; no line 14 |
| 8835 copy 2: 1a (c) / 6 / 7c / 7d / 8 / 15 | 6,000 / 6,000 / 6,000 / 2,400 / 3,600 / 3,600 | 200,000 × $0.030; no bonds; begun 2018; 40%; 6,000 − 2,400; no box 8 |
| 3800 4e / 1f | 16,560 / 3,600 | copy 1 inside its 4-year period; copy 2 after it |
| 6251 4 / 5 / 7 / 9 | 213,837 / 88,100 / 32,692 / 32,692 | 198,087 + 15,750; single exemption; 26% of 125,737 |
| 3800 7 / 13 / 15 / 16 / 17 | 40,451 / 3,863 / 32,692 / 7,759 / 3,600 | 1040 line 16; 25% × 15,451; TMT; 40,451 − 32,692; smaller of 3,600 |
| 3800 27 / 29 / 37 / 38 | 36,588 / 32,988 / 16,560 / 20,160 | 40,451 − 3,863; − 3,600; smaller of 32,988 and 16,560; 3,600 + 16,560 |
| Sch 3 6a / 1040 20 / 22 | 20,160 / 20,160 / 20,291 | Form 3800 line 38; 40,451 − 20,160 |
