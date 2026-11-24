# berelain — Form 4797, a print shop sells its property

A made-up taxpayer. Every name and amount is invented. Synthetic and
**unverified**: no answer key stands behind the expected values. They are the
engine's output, checked by hand line by line (table below), then locked.

## Who

Berelain Ashcombe, single, a full-year Texas resident (no state return). She
has a part-time W-2, a REIT fund 1099-DIV and a sign and print shop
(Schedule C, material participation).

In 2025 her shop sold or retired eight properties:

- the shop building (section 1250, straight line), its interior improvements
  (section 1250 with a special allowance, so additional depreciation) and the
  land under it, in one closing on one Form 1099-S;
- a delivery van (section 1245) at a gain, a printing press at a loss;
- a hay field (section 1252 soil and water expenses, section 1255 cost-sharing
  payments);
- an HVAC unit retired by a partial disposition election (a loss);
- a laptop held less than a year (Part II).

Her section 179 embroidery machine and her pickup (listed property) fell to
50% or less business use (Part IV). She has $15,000 of nonrecaptured net
section 1231 losses from 2021.

## What it covers

Form 4797 Parts I to IV, and the lines that receive them: Schedule D line 11
(Form 4797 line 9) and line 19 (the Unrecaptured Section 1250 Gain Worksheet),
Schedule 1 line 4 and its box (line 18b), Schedule C line 6 (line 35), and Form
1040 line 16 by the Schedule D Tax Worksheet.

## Documents

- `docs/01-1099-s-llano-estacado-title.pdf`: a Form 1099-S, made by
  `documents/form1099S.ts` (the first document of its type: a person reviews it).
- `docs/02-1099-div-high-plains-reit.pdf`: a Form 1099-DIV with box 2b.
- The W-2 has no PDF. The sale amounts are her answers from the closing
  statement and the depreciation schedule.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 4797 1a | 350,000 | 1099-S box 2 (building 260,000 + improvements 20,000 + land 70,000) |
| 4797 1c | 9,000 | HVAC partial disposition: 200 + 2,800 − 12,000 |
| 4797 2 (g) | 13,800; −2,500; −9,000 | land, press, HVAC: (d) + (e) − (f) |
| 4797 24 A–D | 82,860; 18,800; 7,500; 14,000 | line 20 − (line 21 − line 22) |
| 4797 25b C | 7,500 | smaller of 24 (7,500) and 25a (31,000) |
| 4797 26a–26g B | 14,400; 14,400; 4,400; 0; 0; 14,400 | additional depreciation 14,400 at 100% |
| 4797 26g A | 0 | straight line |
| 4797 27b–27c D | 3,600; 3,600 | 9,000 × 40% (sold in the 8th year) |
| 4797 29a–29b D | 5,000; 5,000 | 100% (under 10 years); 14,000 − 3,600 is more |
| 4797 30 / 31 / 32 | 123,160 / 30,500 / 92,660 | sums of lines 24; of 25b, 26g, 27c, 29b; 30 − 31 |
| 4797 6 / 7 | 92,660 / 94,960 | line 32; 13,800 − 2,500 − 9,000 + 92,660 |
| 4797 8 / 9 / 12 | 15,000 / 79,960 / 15,000 | her 2021 loss; 7 − 8; line 9 above 0, so line 8 |
| 4797 10 (g) | 900 | laptop: 900 + 2,400 − 2,400 |
| 4797 13 / 17 / 18b | 30,500 / 46,400 / 46,400 | line 31; 900 + 15,000 + 30,500 |
| 4797 33–35 (a) | 15,000; 6,866; 8,134 | 6,866.40 rounds to 6,866 |
| 4797 33–35 (b) | 16,618; 12,600; 4,018 | Pub. 946's listed-property example |
| Sch C 6 | 12,152 | 8,134 + 4,018 |
| Sch D 11 | 79,960 | Form 4797 line 9 |
| Sch D 19 | 38,460 | worksheet: line 3 = 48,460 + (18,800 − 14,400) = 52,860; line 9 = 52,860 − 15,000; line 11 = 600 (box 2b) |
| Sch 1 4 | 46,400 | Form 4797 line 18b, box checked |
| 1040 16 | 28,050 | Schedule D Tax Worksheet: 15% on 45,800 (6,870) + tax on 118,053 (21,180); the unrecaptured gain falls in the 22–24% brackets, so line 40 is 0 |
