# rosalind (synthetic, unverified)

Rosalind Okafor is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, a full-year California resident (Sacramento).
- One W-2: $120,000 wages, $17,500 federal and $6,800 California tax withheld.
- One brokerage 1099-DIV: $1,200 ordinary dividends ($900 qualified) and
  $800 capital gain distributions (box 2a).
- One 1099-B with three sales, basis reported: two long-term (a $4,000 gain
  and a $1,500 loss) and one short-term (a $1,000 gain).
- A California capital loss carryover from 2024 of $2,500. The federal return
  has no carryover: an earlier California loss was larger than the federal one.

## What it covers

- Schedule D (540) files only because the California carryover differs from
  the federal one. Line 1 lists every sale, line 6 takes the carryover, and
  line 12a goes to Schedule CA line 7a column B.
- Schedule CA line 7a column B flows to line 10, line 27 and Form 540 line 14,
  so California AGI is $2,500 lower than federal AGI.
- The amounts are whole dollars, so no rounding hides a difference.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 1040 line 7a | 4,300 | Schedule D line 16: 1,000 short-term + 2,500 long-term + 800 distributions |
| 1040 line 11 (AGI) | 125,500 | 120,000 + 1,200 + 4,300 |
| 1040 line 16 (tax) | 18,809 | 109,750 taxable; 4,200 at 15% (QDCG worksheet) = 630; 105,550 by the rate schedule = 18,179 |
| Sch D (540) line 1a–1c | 4,000 / (1,500) / 1,000 | (b) − (c) for each sale; same basis as federal |
| Sch D (540) line 3 | 800 | 1099-DIV box 2a |
| Sch D (540) line 4 | 5,800 | 4,000 + 1,000 + 800 |
| Sch D (540) line 5 | 1,500 | the one loss |
| Sch D (540) line 6 | 2,500 | the California carryover |
| Sch D (540) line 7 | 4,000 | 1,500 + 2,500 |
| Sch D (540) line 8 | 1,800 | 5,800 − 4,000, a gain |
| Sch D (540) line 9 | blank | line 8 is a gain |
| Sch D (540) line 10 | 4,300 | 1040 line 7a |
| Sch D (540) line 11 | 1,800 | line 8 |
| Sch D (540) line 12a | 2,500 | line 10 is more than line 11: 4,300 − 1,800 |
| Sch D (540) line 12b | blank | line 10 is not less than line 11 |
| Sch CA line 7a A / B / C | 4,300 / 2,500 / blank | 1040 line 7a; Sch D (540) line 12a; line 12b |
| Sch CA line 10 and 27, column B | 2,500 | line 7a is the only subtraction |
| 540 line 13 | 125,500 | federal AGI |
| 540 line 14 | 2,500 | Sch CA line 27 column B |
| 540 line 17 (CA AGI) | 123,000 | 125,500 − 2,500 |
| 540 line 18 | 5,706 | single standard deduction |
| 540 line 19 | 117,294 | 123,000 − 5,706 |
| 540 line 31 | 7,347 | rate schedule: 3,201.97 + 9.3% × (117,294 − 72,724) |
| 540 line 32 | 153 | one personal exemption credit |
| 540 line 64 | 7,194 | 7,347 − 153 |
| 540 line 100 | 394 | 7,194 − 6,800 withheld |
