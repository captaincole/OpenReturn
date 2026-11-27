# seonid (synthetic, unverified)

Seonid Tremaine is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Palos Verdes Estates).
- She works for, and owns shares of, Harbor Gateway Plating, Inc., an S
  corporation with a plant in the former Harbor Gateway Communities enterprise
  zone. W-2: $310,000. Her planner shows two days of five at the plant.
  $40,000 of the wages is for weeks on a Salt Lake City job, and Utah tax is
  $1,800.
- From her 2024 FTB 3805Z she carries a $30,000 hiring credit and a $5,000
  sales or use tax credit, both passed to her by the S corporation before 2014.
  No EZ NOL.
- She owns part of South Bay Rack Storage LLC, which elected to pay the PTE
  elective tax: a $4,000 credit.

## Documents

None. The K-1s and the Utah return are not in the engine: their amounts are
her answers. The W-2 has no PDF. The S corporation had no income for 2025.

## What it covers

- FTB 3805Z as an investor: items A to D only, line 2 blank (no Worksheet I,
  Section A), and Worksheet I, Section B with her wages at 40%.
- The hiring credit is more than line 7: line 9A column (e) is 0 and the sales
  or use tax credit carries in full.
- Three other credits attach Schedule P (540). Line 16 takes code 176, its
  column (a) up to FTB 3805Z line 7 (decision A80 in `docs/rule-decisions.md`).
- Schedule S line 2 and FTB 3804-CR leave out the enterprise zone credit as
  they do the other credits. Form 540 line 45 holds all three.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 17, 19 | 310,000; 304,294 | wages; less 5,706 |
| 540 lines 31, 32, 35 | 24,738; 9; 24,729 | rate schedule; exemption credit after the phase-out |
| 3805Z Sch Z lines 1, 3, 5 | 124,000 | 310,000 × 0.4; no NOL |
| 3805Z Sch Z lines 6a, 6b, 7 | 7,971; 24,729; 7,971 | 3,201.97 + 51,276 × 9.3%; line 35; the smaller |
| Sch P lines 24, Part III 3, 11 | 15,208; 9,521; 24,729 | 217,251 × 7%; 24,729 − 15,208; no Section A credit |
| Sch P line 16 (a), (b), (c), (d) | 7,971; 7,971; 16,758; 0 | smaller of line 7 and 35,000; smaller of (a) and 24,729; 24,729 − 7,971; (a) − (b) |
| 3805Z line 8 A (e), (f); B (b), (d), (e), (g) | 7,971; 7,971; 30,000; 30,000; 7,971; 22,029 | line 7; Sch P (b), hiring first; 30,000 − 7,971 |
| 3805Z line 9 A (e), (f); B (b), (d), (e), (g) | 0; 0; 5,000; 5,000; 0; 5,000 | 7,971 − 7,971; nothing left |
| 3805Z lines 1a, 1b, 1c, 1d; 3a to 3c | 7,971; 0; 7,971; 0; 0 | 8A (f); 9A (f); sum; no election; no NOL |
| Sch S lines 2, 5, 6, 12 | 16,758; 0.1290; 2,162; 1,800 | 24,729 − 7,971; 40,000 / 310,000; 16,758 × 0.1290; smaller of 2,162 and 1,800 |
| Sch P lines 20, 21 (c) | 14,958; 10,958 | 16,758 − 1,800; less 4,000 |
| 540 line 45 | 13,771 | 7,971 + 1,800 + 4,000 (more than two credits) |
| 540 lines 47, 48, 115 | 13,771; 10,958; 14,642 | line 45; 24,729 − 13,771; 25,600 withheld − 10,958 |
