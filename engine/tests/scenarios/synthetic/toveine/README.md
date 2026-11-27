# toveine (synthetic, unverified)

Toveine Arandell is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Porterville).
- She owns a machine shop (Schedule C): $480,000 of receipts, $226,000 of
  profit. The shop is in the former Tulare County Targeted Tax Area (TTA);
  a second bay in Tulare is outside it.
- Her 2024 FTB 3809 carried a $4,000 TTA hiring credit and a $16,000 TTA
  sales or use tax credit. She has no TTA NOL.
- She owns parts of two LLCs. One passes through a $900 prison inmate labor
  credit, the other a $2,800 PTE elective tax credit.
- She paid $56,000 of federal and $11,000 of California estimated tax.

## Documents

None. The TTA program ended in 2012: last year's FTB 3809 and the shop's
books are the source. The K-1s are her answers; their income is left out on
purpose, because the engine has no California K-1.

## What it covers

- FTB 3809 items A to H, line 2 below 1 (Worksheet I, Section A), Schedule Z
  Part I, and Part II with the sales or use tax credit limited by line 7.
- Schedule P (540) Section B2 line 16, code 210, after Section A1 line 4.
- Form 540 line 45 with three credits; lines 43 and 44 stay blank.
- `zarya` covers the TTA NOL (Schedule CA line 9b3) and lines 43 and 44.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 3809 line 2 | 0.7333 | (600,000 / 900,000 = 0.6666) + (120,000 / 150,000 = 0.8) = 1.4666, halved |
| Sch Z lines 1, 3, 5 | 165,726 | 226,000 × 0.7333 = 165,725.8 |
| Sch Z line 4 | 0 | no TTA NOL |
| Sch Z line 6a | 11,851 | Schedule X: 3,201.97 + 9.3% × (165,726 − 72,724) |
| Sch Z line 6b | 15,476 | Form 540 line 35 |
| Sch Z line 7 | 11,851 | smaller of 6a and 6b |
| Sch P line 4 (a), (b) | 900 | prison inmate labor credit, below the 7,125 excess tax |
| Sch P line 11 | 14,576 | 15,476 − 900 |
| Sch P line 16 (a) | 11,851 | smaller of 4,000 + 16,000 and line 7 |
| Sch P line 16 (b), (c), (d) | 11,851; 2,725; 0 | smaller of (a) and 14,576; 14,576 − 11,851; (a) − (b) |
| 3809 8A (e), (f) | 11,851; 4,000 | line 7; hiring credit first |
| 3809 8B (b), (d), (e), (g) | 4,000; 4,000; 4,000; 0 | column (c) is blank for an individual |
| 3809 9A (e), (f) | 7,851; 7,851 | 11,851 − 4,000; the rest of 11,851 |
| 3809 9B (b), (d), (e), (g) | 16,000; 16,000; 7,851; 8,149 | 16,000 − 7,851 carries to 2026 |
| 3809 lines 1a, 1b, 1c | 4,000; 7,851; 11,851 | 8A (f); 9A (f); sum |
| Sch P line 21 (a), (b), (d) | 2,800; 2,725; 75 | PTE credit up to line 16 (c) |
| 540 lines 31, 32, 35 | 15,629; 153; 15,476 | Schedule X on 206,349; one exemption |
| 540 lines 45, 47, 48 | 15,476; 15,476; 0 | 900 + 11,851 + 2,725 |
| 540 line 115 | 11,000 | estimated tax; no tax left |
