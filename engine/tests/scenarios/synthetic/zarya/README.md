# zarya (synthetic, unverified)

Zarya Oskeld is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Visalia).
- One W-2: $180,000 from a Visalia engineering firm. Her travel log puts 75%
  of her days at its Visalia office, in the former Tulare County Targeted Tax
  Area (TTA). $40,000 of the wages is for weeks in Salt Lake City; Utah tax is
  $1,800.
- She owns a bakery in Visalia (Schedule C), all of it in the former TTA:
  $210,000 of receipts, $60,000 of profit.
- Her 2024 FTB 3809 carried a $2,500 TTA hiring credit and TTA NOLs of $9,000
  (2009) and $14,000 (2011).
- Standard deduction. Schedule P (540) does not file: two credits.

## Documents

None. The TTA program ended in 2012: last year's FTB 3809, the bakery's books
and her travel log are the source. The Utah return is her answer. The W-2 has
no PDF.

## What it covers

- FTB 3809 line 2 at 1.0000, Part III (lines 3a to 3c) and Schedule Z with a
  TTA NOL deduction on line 4.
- Schedule CA (540) line 9b3 and line 10 column B, and Form 540 lines 14 to 19.
- The credit with no Schedule P (540): Form 540 lines 43 (TTA, code 210) and
  44 (other state tax), and Schedule S line 2 after the TTA credit.
- `toveine` covers Schedule P (540) and line 45.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 3809 line 2 | 1.0000 | the bakery is wholly in the former TTA |
| Sch Z lines 1, 3 | 195,000 | 180,000 × 0.75 + 60,000 × 1.0000 |
| 3809 lines 3a, 3b, 3c | 23,000; 23,000; 0 | 9,000 + 14,000, both used, oldest first |
| Sch Z line 4 | 23,000 | line 3b; MAGI is below $1,000,000, so no suspension |
| Sch Z line 5 | 172,000 | 195,000 − 23,000 |
| Sch Z line 6a | 12,435 | Schedule X: 3,201.97 + 9.3% × (172,000 − 72,724) |
| Sch Z lines 6b, 7 | 15,861; 12,435 | Form 540 line 35; smaller of 6a and 6b |
| 3809 8A (e), (f), 8B (g) | 12,435; 2,500; 0 | the whole hiring credit fits |
| 3809 9A (e) | 9,935 | 12,435 − 2,500 |
| 3809 lines 1a, 1b, 1c | 2,500; 0; 2,500 | no sales or use tax credit |
| Sch CA line 9b3, 10 (B) | 23,000 | FTB 3809 line 3b |
| 540 lines 13, 14, 17 | 239,196; 23,000; 216,196 | 240,000 − 804 half of SE tax; line 27 column B |
| 540 line 19, 31 | 210,490; 16,014 | 216,196 − 5,706; Schedule X |
| 540 line 35 | 15,861 | 16,014 − 153 |
| Sch S line 2 | 13,361 | 15,861 − 2,500 (the TTA credit) |
| Sch S lines 6, 12 | 2,472; 1,800 | 13,361 × 40,000 / 216,196; Utah tax |
| 540 lines 43, 44 | 2,500; 1,800 | Targeted Tax Area 210; Other State Tax 187 |
| 540 lines 47, 48 | 4,300; 11,561 | 15,861 − 4,300 |
| 540 line 115 | 939 | 12,500 withheld − 11,561 |
