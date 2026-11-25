# ingtar (synthetic, unverified)

Ingtar and Mairin Vallemont are made-up taxpayers. No filed return, benchmark
case or IRS test package stands behind their values. A person checked each
line below by hand against the form and its instructions, then locked the
engine's output.

## Who they are

- Married filing jointly, full-year California residents (Sacramento).
- Ingtar's W-2: $112,000. Mairin's W-2: $64,000.
- In April 2025 Ingtar traded 12 acres of investment land in Placer County
  (no street address: a parcel number) with his sister, through a qualified
  intermediary, for 10 acres in Reno, Nevada. He also gave up stock worth
  $9,000 (basis $4,000). He received $15,000 cash. His sister took over the
  $30,000 loan on the Placer land; he took over a $10,000 loan on the Reno
  land. Exchange costs: $6,000. Nobody sold either property in 2025.
- The Placer land came from a 2012 exchange of a rental duplex. California
  did not allow the duplex's bonus depreciation, so the California basis is
  $150,000 against the federal $140,000.

## Documents

None. The amounts come from closing statements and the intermediary's
summary; the California answers are the couple's own. No official form
prints them.

## What it covers

- FTB 3840 Side 1: the header, Questions A to C (a related party), Part I,
  and Part II lines 7 to 20 (line 16 is blank: no recapture).
- FTB 3840 Schedule A: row A given up, row D received, lines 2 to 8, and
  line 10 column D. Line 8 is adjusted for the California basis.
- Form 8824 Parts I to III and Schedule D line 11 ($20,000 deferred-exchange
  gain plus the $5,000 stock gain).
- Not covered here (unit tests cover them): Annual and Final forms, a
  separate filing with a signature, line 11, the gaps.
- No line of Form 1040, Form 540 or a schedule takes an FTB 3840 amount.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 3840 lines 7, 8, 9 | 9,000 / 4,000 / 5,000 | the stock: FMV, basis, gain |
| 3840 line 10 | 20,000 | 15,000 cash + (30,000 − 10,000 − 9,000) net liabilities − 6,000 costs |
| 3840 lines 11, 12 | 260,000 / 280,000 | Reno land; 20,000 + 260,000 |
| 3840 line 13 | 140,000 | federal basis; the costs were used on line 10 |
| 3840 line 14 | 140,000 | 280,000 − 140,000 |
| 3840 lines 15, 17, 18 | 20,000 | smaller of 20,000 and 140,000; no recapture |
| 3840 line 19 | 120,000 | 140,000 − 20,000 |
| 3840 line 20 | 140,000 | 140,000 + 20,000 − 20,000 |
| Schedule A line 3 | 286,000 | 260,000 + 15,000 + 30,000 − 10,000 − 9,000 |
| Schedule A lines 4, 5 | 6,000 / 280,000 | costs; 286,000 − 6,000 |
| Schedule A lines 6, 7 | 150,000 / 130,000 | California basis; 280,000 − 150,000 |
| Schedule A line 8, line 10 D | 110,000 | 120,000 + 140,000 − 150,000 (= line 7 − line 18) |
| 1040 line 11a | 201,000 | 176,000 wages + 25,000 Schedule D |
| 540 line 17 | 201,000 | no California adjustment this year |
