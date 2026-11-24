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

Each sale names the shop (`businessId`), so the shop's QBI takes the ordinary
part of the sales. The hay field is the shop's too, to keep one business: a
real farm would file Schedule F, which has no rules in the engine. With two
activities, line 12's 15,000 could not be split between them, and Form 8995
would be a gap (`engine/src/federal/4797/QUESTIONS.md` item 10).

## What it covers

Form 4797 Parts I to IV, and the lines that receive them: Schedule D line 11
(Form 4797 line 9) and line 19 (the Unrecaptured Section 1250 Gain Worksheet),
Schedule 1 line 4 and its box (line 18b), Schedule C line 6 (line 35), the
shop's QBI on Form 8995 (the ordinary part of the sales), and Form 1040 line 16
by the Schedule D Tax Worksheet.

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
| 8995 1i (c) | 92,079 | Schedule C 49,152 + the shop's Form 4797 ordinary gain 46,400 − SE tax deduction 3,473 (below) |
| 8995 5 / 10 | 18,416 | 20% of 92,079 = 18,415.80; no REIT dividends (box 5 is blank) |
| 8995 11 / 12 / 13 / 14 | 172,989 / 84,260 / 88,729 / 17,746 | 188,739 − 15,750; 2,800 + 81,460; 11 − 12; 20% of 88,729 = 17,745.80 |
| 8995 15 | 17,746 | smaller of line 10 and line 14 |
| 1040 13a / 14 / 15 | 17,746 / 33,496 / 155,243 | 8995 line 15; 15,750 + 17,746; 188,739 − 33,496 |
| 1040 16 | 25,983 | Schedule D Tax Worksheet (below) |
| 1040 24 / 37 | 32,928 / 32,028 | 25,983 + SE tax 6,945; 32,928 − 900 withheld |

**The shop's Form 4797 ordinary gain (46,400).** "Ordinary business income or
loss is generally included in QBI ... a section 1231 gain or loss is only
includible in QBI if it isn't capital gain or loss"
(irs-8995-inst-2025::sec::determining-your-qualified-business::b06). The
ordinary part is the laptop's Part II gain (900), the Part III recapture of
line 13 (van 7,500 + improvements 14,400 + hay field 3,600 + 5,000 = 30,500)
and line 12, the part of the section 1231 gain that her 2021 loss makes
ordinary (15,000). Every section 1231 amount is the shop's, so all of line 12
is the shop's. 900 + 30,500 + 15,000 = 46,400, which is Form 4797 line 18b.
The 79,960 on line 9 is capital gain and stays out.

**Schedule D Tax Worksheet** (irs-1040sd-inst-2025::sec::schedule-d-tax-worksheet::b01
to ::schedule-d-tax-worksheet-continued-keep-for-your-records::b03):

| Line | Value | How |
| --- | --- | --- |
| 1 / 2 / 6 | 155,243 / 2,800 / 2,800 | 1040 line 15; line 3a; no Form 4952 |
| 7 / 9 / 10 | 81,460 / 81,460 / 84,260 | smaller of Sch D 15 and 16; 7 − 0; 6 + 9 |
| 11 / 12 / 13 | 38,460 / 38,460 / 45,800 | Sch D 18 (0) + 19; smaller of 9 and 11; 10 − 12 |
| 14 / 16 / 17 | 109,443 / 48,350 / 48,350 | 1 − 13; smaller of 1 and 48,350; smaller of 14 and 16 |
| 18 / 20 / 21 | 70,983 / 109,443 / 109,443 | 1 − 10; smaller of 14 and 155,243; larger of 18 and 20 |
| 22 | 0 | 16 − 17 |
| 23 / 25 / 27 / 29 / 30 | 45,800 / 45,800 / 155,243 / 45,800 / 45,800 | smaller of 1 and 13; 23 − 0; smaller of 1 and 533,400; 27 − (21 + 22); smaller of 25 and 29 |
| 31 / 32 / 33 | 6,870 / 45,800 / 0 | 15% of 30; 24 + 30; 23 − 32 |
| 35 / 38 / 39 / 40 | 38,460 / 38,460 / 0 / 0 | smaller of 9 and Sch D 19; (10 + 21) − 1 = 193,703 − 155,243; 35 − 38; 25% of 0 |
| 44 | 19,113 | tax on 109,443: 109,443 × 24% − 7,153 = 19,113.32 (Tax Computation Worksheet) |
| 45 / 46 / 47 | 25,983 / 30,105 / 25,983 | 31 + 34 + 40 + 44; tax on 155,243 (37,258.32 − 7,153); smaller of 45 and 46 |
