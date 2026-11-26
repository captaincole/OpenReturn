# masema (synthetic, unverified)

Masema Thornwood is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, a full-year California resident (Oroville).
- One W-2: $82,000 wages, $9,100 federal and $2,900 California tax withheld.
- $900 of credit union interest. One brokerage 1099-DIV: $1,400 ordinary
  dividends and $600 capital gain distributions.
- One 1099-B with two long-term sales: a $9,000 loss and a $4,000 gain.
- Two California carryovers from her 2024 FTB 3805V: a 2018 Camp Fire disaster
  loss (code 107, $22,000 left of $40,000) and a 2020 general NOL ($68,000
  left of $95,000). The federal return has none: the CARES Act carried both
  federal losses back, and California allowed no carryback.

## Documents

None. The W-2 and the 1099s are document types the product reads; the
carryovers are answers from last year's return. The facts are the only source.

## What it covers

- FTB 3805V Part I Section A lines 1 to 25: the deductions push line 3a to
  minus the capital loss deduction, so Part I runs to line 25 (no 2025 NOL).
- Part II: the MTI, $78,594. Part III: the 2018 row first, used in full, then
  the 2020 row up to the balance; $11,406 carries to 2026.
- Schedule CA (540) lines 9b1 and 9b2, line 10 and line 27 column B, and Form
  540 line 14: California AGI is $2,706, so taxable income is 0.
- Not covered: a current year NOL, the suspension and the gaps. The unit tests
  in `tests/unit/state/ca/3805v/` cover them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 1040 line 11 (AGI) | 81,300 | 82,000 + 900 + 1,400 − 3,000 capital loss |
| Schedule D (540) figures | 4,600 / 9,000 / −4,400 / 3,000 | gains 4,000 + 600; losses 9,000; net; the $3,000 limit |
| 3805V line 1, line 2 | 2,706 / 5,706 | Form 540 lines 17 and 18 |
| 3805V line 3a, 3c | (3,000) | 2,706 − 5,706 |
| 3805V lines 4 to 7 | 9,000 / 4,600 / 4,400 / 0 | Schedule D (540) line 7, line 4; their difference |
| 3805V lines 8 to 12 | 5,706 / 2,300 / 2,300 / 3,406 / 0 | standard deduction; interest + dividends |
| 3805V lines 13 to 17 | 0 / 0 / 0 / 0 / 4,400 | no business capital items; 4,400 + 0 |
| 3805V lines 18 to 22 | 4,400 / 3,000 / 1,400 / 0 / 3,000 | Schedule D (540) lines 8 and 9; 4,400 − 1,400 |
| 3805V line 23 | 78,594 | 22,000 + 56,594, the deductions taken (decision A18) |
| 3805V line 24, 25 | 85,000 / 0 | 3,406 + 0 + 3,000 + 78,594; −3,000 + 85,000 is above 0 |
| 3805V Part II lines 1 to 6 | (3,000) / 3,000 / 22,000 / 56,594 / 0 / 78,594 | 2,706 − 5,706; added back |
| 3805V Part III row 1 (2018 DIS) | e 22,000, f 22,000, g 56,594, h 0 | the smaller of (e) and 78,594 |
| 3805V Part III row 2 (2020 GEN) | e 68,000, f 56,594, g 0, h 11,406 | the smaller of (e) and 56,594 |
| 3805V lines 5, 6 | 11,406 / 0 | column (h), not disaster and disaster |
| Schedule CA line 9b1, 9b2 | 22,000 / 56,594 | Part III column (f) by type |
| Schedule CA line 10, 27 column B | 78,594 | 9b1 + 9b2 |
| 540 line 14, 17, 19 | 78,594 / 2,706 / 0 | 81,300 − 78,594; below the deduction |
