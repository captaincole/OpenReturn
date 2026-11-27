# shemerin (synthetic, unverified)

Shemerin Calloway is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Tustin).
- She owns a machine shop (Schedule C): $620,000 of receipts, $180,000 of
  profit. One site is at Tustin Legacy, a former LAMBRA; one is outside it.
- Three quarters of the shop's property and four fifths of its payroll are in
  the former LAMBRA (Worksheet I, Section A).
- $20,000 of the profit came from jobs in Utah. Utah taxed it ($900), so the
  shop's California source income is $160,000 (Worksheet I, Section B).
- Her 2024 FTB 3807 carried a $2,000 LAMBRA hiring credit and a $9,000 sales or
  use tax credit to 2025. She has no LAMBRA NOL.
- She paid $36,000 of federal and $5,000 of California estimated tax.

## Documents

None. The worksheets of the FTB 3807 booklet stay with her records, and the
amounts come from her books, her asset ledger, her payroll register and her
2024 return. Utah's return is not in the engine: its amounts are her answers.

## What it covers

- FTB 3807 items A to H, line 2, Part I and Schedule Z Parts I and II.
- The credits are limited twice. Schedule Z line 7 limits them to the tax on
  the LAMBRA business income ($7,971). Schedule P (540) Section A2 line 6
  limits them to the tax over TMT ($6,095). The hiring credit is used first.
- Form 540 line 43 takes code 198; line 44 the Utah credit. Schedule S line 2
  leaves the LAMBRA credit out of the tax.
- The sister scenario `tarna` covers the LAMBRA NOL deduction (Part III) and
  Schedule CA (540) line 9b3.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| Sch C line 31 | 180,000 | 620,000 − 440,000 of expenses |
| Sch SE lines 12, 13 | 25,434; 12,717 | 166,230 × 15.3%; half |
| 1040 line 11a | 167,283 | 180,000 − 12,717 |
| 540 lines 19, 31, 35 | 161,577; 11,465; 11,312 | 167,283 − 5,706; rate schedule; less 153 |
| Sch P lines 21, 23, 24 | 167,283; 74,534; 5,217 | AMTI; less 92,749; × 7% |
| Sch P Part III line 3 | 6,095 | 11,312 − 5,217 |
| 3807 line 2 | 0.7750 | (300,000 ÷ 400,000 + 160,000 ÷ 200,000) ÷ 2 |
| 3807 Sch Z lines 1, 3, 5 | 124,000 | 160,000 × 0.7750; no NOL |
| 3807 Sch Z lines 6a, 6b, 7 | 7,971; 11,312; 7,971 | rate schedule on 124,000; 540 line 35; smaller |
| Sch P line 6 (a), (b), (c), (d) | 7,971; 6,095; 0; 1,876 | smaller of line 7 and 11,000; smaller of (a) and 6,095; 6,095 − 6,095; 7,971 − 6,095 |
| 3807 line 8A (e), (f) | 7,971; 2,000 | line 7; hiring credit first |
| 3807 line 8B (b), (d), (e), (g) | 2,000; 2,000; 2,000; 0 | 2024 line 8B (g); no column (c); smaller of 7,971 and 2,000; used in full |
| 3807 line 9A (e), (f) | 5,971; 4,095 | 7,971 − 2,000; 6,095 − 2,000 |
| 3807 line 9B (b), (d), (e), (g) | 9,000; 9,000; 4,095; 4,905 | 2024 line 9B (g); no column (c); smaller of 5,971 and 4,095; 9,000 − 4,095 |
| 3807 lines 1a, 1b, 1c, 1d | 2,000; 4,095; 6,095; 0 | 8A (f); 9A (f); added; tax under $5,000,000 |
| Sch P line 11 | 5,217 | TMT 5,217 + 0 left in column (c) |
| Sch S lines 2, 5, 6 | 5,217; 0.1196; 624 | 11,312 − 6,095; 20,000 ÷ 167,283; 5,217 × 0.1196 |
| Sch S lines 11, 12 | 900; 624 | Utah tax; smaller |
| 540 lines 43, 44 | 6,095; 624 | code 198; code 187 |
| 540 lines 47, 48 | 6,719; 4,593 | 6,095 + 624; 11,312 − 6,719 |
| 540 lines 72, 97, 115 | 5,000; 407; 407 | estimated tax; 5,000 − 4,593 |
