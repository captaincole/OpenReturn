# tylin (synthetic, unverified)

Tylin Marrowgate is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, a full-year California resident (Sacramento).
- A W-2 from a college: $24,000 wages, $700 California withholding.
- A landscape design business (Schedule C): $95,000 receipts.
- In 2025 the business sold a compact excavator, a riding mower, a dump trailer,
  its yard land and the yard's paving and fencing. The land and the paving closed
  on one Form 1099-S ($100,000).
- The federal return took the special depreciation allowance on the excavator,
  the paving and the trailer. California allows none, so the California
  depreciation is smaller. The paving is straight line for California.
- A stump grinder's business use fell to 40%. Federal section 179 expense
  $40,000; California's $25,000.
- Nonrecaptured section 1231 losses: $3,000 federal, $2,500 California.

## Documents

`generate-docs.ts` makes the Form 1099-S (`docs/01-1099-s-capitol-valley-title.pdf`)
from the fact (fake data). The W-2 has no PDF. The sale amounts are answers from
her closing statement and depreciation schedules.

## What it covers

- Schedule D-1 Parts I, II (Sections A and B), III and IV, with line 21a.
- Schedule CA line 4 column B (line 21a), line 3 column B (line 38 against
  federal line 35), and line 7a column C (Schedule D (540) line 12b).
- Schedule D (540) line 1: the Schedule D-1 row (line 9).
- The other branch (California more than federal) is the `beslan` scenario.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| D-1 line 1a | 100,000 | Form 1099-S box 2 |
| D-1 line 2, land | 60,000 − 45,000 = 15,000 | same as federal |
| D-1 line 2, mower | 1,000 + 6,000 − 9,000 = −2,000 | same as federal |
| D-1 line 23–27, excavator | 48,000; 80,000; 58,000; 22,000; 26,000 | California depreciation 58,000 |
| D-1 line 28a, 28b | 58,000; 26,000 | the smaller of 27 and 28a |
| D-1 line 23–27, paving | 40,000; 30,000; 5,000; 25,000; 15,000 | straight line: 29g 0 |
| D-1 line 33, 34, 35 | 41,000; 26,000; 15,000 | 26,000 + 15,000; 26,000 + 0; 33 − 34 |
| D-1 line 6, 7 | 15,000; 28,000 | line 35; 15,000 − 2,000 + 15,000 |
| D-1 line 8, 9, 12 | 2,500; 25,500; 2,500 | the California answer; 7 − 8; line 8 |
| D-1 line 10, trailer | 9,000 + 1,700 − 12,000 = −1,300 | held under a year |
| D-1 line 13, 17, 18b | 26,000; 27,200; 27,200 | line 34; −1,300 + 2,500 + 26,000 |
| D-1 line 19, 20, 21a | 88,000; 27,200; 60,800 | federal 4797 line 18b; line 18b; 19 − 20 |
| D-1 line 36, 37, 38 | 25,000; 10,000; 15,000 | California 179 expense; allowable; 36 − 37 |
| Federal 4797 line 35 | 24,000 | 40,000 − 16,000 |
| Schedule CA line 3 col B | 9,000 | 24,000 − 15,000 |
| Schedule CA line 4 col A, B | 88,000; 60,800 | Schedule 1 line 4; D-1 line 21a |
| Schedule D (540) line 1, 10, 11, 12b | 25,500; 22,000; 25,500; 3,500 | D-1 line 9; federal 1040 line 7a (4797 line 9) |
| Schedule CA line 7a col C | 3,500 | Schedule D (540) line 12b |
| Form 540 line 14, 16, 17 | 69,800; 3,500; 154,873 | 60,800 + 9,000; 3,500; 221,173 − 69,800 + 3,500 |
