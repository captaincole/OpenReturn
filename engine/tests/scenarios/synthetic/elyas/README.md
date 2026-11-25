# elyas (synthetic, unverified)

Elyas Machera is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind his values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who he is

- Single, full-year California resident (Sacramento).
- One W-2: $95,000 of wages. $30,000 of it is for weeks on a Boston project,
  and he filed a Massachusetts nonresident return. Massachusetts tax is $1,500.
- He takes the standard deduction, so Schedule P (540) does not file.

## Documents

None. The Massachusetts return is not in the engine: the item, the tax and the
Massachusetts AGI are his answers. The W-2 has no PDF.

## What it covers

- One Schedule S where line 6 is smaller than line 11, so line 12 is line 6.
- Form 540 line 43 takes Schedule S line 12 itself (no Schedule P), then lines
  47 and 48.
- `morgase` covers two states, line 12 from line 11 and Schedule P line 20.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 line 17, 19 | 95,000, 89,294 | 95,000 − 5,706 standard deduction |
| 540 line 31, 32, 35 | 4,744, 153, 4,591 | tax table; one personal exemption credit |
| S line 1 (b), (c); lines 3, 8 | 30,000 | his one item |
| S line 2 | 4,591 | 540 line 48 with no credit: line 35 |
| S line 4 | 95,000 | 540 line 17 |
| S line 5 | 0.3158 | 30,000 / 95,000 = 0.31579 |
| S line 6 | 1,450 | 4,591 × 0.3158 = 1,449.84 |
| S line 7, 9 | 1,500, 30,000 | his answers |
| S line 10, 11 | 1.0000, 1,500 | 30,000 / 30,000 |
| S line 12 | 1,450 | smaller of 1,450 and 1,500 |
| 540 line 43 | Other State Tax, 187, 1,450 | Schedule S line 12 |
| 540 line 47, 48 | 1,450, 3,141 | 4,591 − 1,450 |
| 540 line 64, 97 | 3,141, 759 | 3,900 withheld − 3,141 |
