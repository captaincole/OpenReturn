# morgase (synthetic, unverified)

Morgase Trakand is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, full-year California resident (San Jose).
- One W-2: $310,000 of wages. Part of the year she worked in New York and in
  Illinois, and she filed a nonresident return in each state.
- She itemizes: $18,400 of mortgage interest, $9,800 of property tax, $6,000 of
  cash gifts. Itemizing makes the engine complete Schedule P (540).
- New York: three items of New York wages. New York allocates her stock and
  bonus by its own workday rule, so its amounts are higher. New York tax after
  credits is $4,180. New York taxed $70,850 of her income.
- Illinois: $9,000 of Illinois wages. Illinois tax is $446.

## Documents

None. The other states' returns are not in the engine: the items, the tax and
the other state's AGI are her answers. The W-2 and the Form 1098 have no PDF.

## What it covers

- Two Schedules S, one for each state (copy 0 is New York, copy 1 is
  Illinois). The golden PDF is copy 0.
- New York: all three Part I rows, line 10 below 1, and line 12 from line 11.
- Illinois: line 10 at 1.0000.
- Schedule P (540) Section B3 line 20, and Form 540 lines 43, 47 and 48.
- `elyas` covers line 12 from line 6 and line 43 with no Schedule P.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 line 17 | 310,000 | the W-2 |
| 540 line 35 | 22,402 | 22,411 tax − 9 exemption credit |
| S (NY) line 1 (b), line 3 | 64,000 | 46,000 + 12,400 + 5,600 |
| S (NY) line 1 (c), line 8 | 67,350 | 46,000 + 15,250 + 6,100 |
| S (NY) line 2 | 22,402 | 540 line 48 with no credit: line 35 |
| S (NY) line 4 | 310,000 | 540 line 17; no Schedule G-1 |
| S (NY) line 5 | 0.2065 | 64,000 / 310,000 = 0.20645 |
| S (NY) line 6 | 4,626 | 22,402 × 0.2065 = 4,626.01 |
| S (NY) line 7, 9 | 4,180, 70,850 | her answers |
| S (NY) line 10 | 0.9506 | 67,350 / 70,850 = 0.95060 |
| S (NY) line 11 | 3,974 | 4,180 × 0.9506 = 3,973.51 |
| S (NY) line 12 | 3,974 | smaller of 4,626 and 3,974 |
| S (IL) lines 3, 5, 6 | 9,000, 0.0290, 650 | 9,000 / 310,000; 22,402 × 0.0290 = 649.66 |
| S (IL) lines 8, 9, 10, 11, 12 | 9,000, 9,000, 1.0000, 446, 446 | smaller of 650 and 446 |
| P lines 19, 21 | 285,600 | 279,268 + 9,800 − 3,468 (line 18 is subtracted) |
| P lines 23, 24 | 192,851, 13,500 | 285,600 − 92,749 exemption; × 7% = 13,499.57 |
| P line 11 (c) | 22,402 | line 3 is above 0: 13,500 TMT + 8,902 |
| P line 20 (a), (b), (c) | 4,420, 4,420, 17,982 | 3,974 + 446; smaller of 4,420 and 22,402; 22,402 − 4,420 |
| 540 line 43 | Other State Tax, 187, 4,420 | P line 20 (b) |
| 540 line 47, 48 | 4,420, 17,982 | 22,402 − 4,420 |
| 540 line 64, 97 | 17,982, 6,818 | 24,800 withheld − 17,982 |
