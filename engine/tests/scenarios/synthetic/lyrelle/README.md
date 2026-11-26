# lyrelle (synthetic, unverified)

Lyrelle Damarra is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Burbank). One W-2: $900,000.
- Five California Film Commission credit certificates (FTB 3541, one form each):
  - 8214, program 4.0, her own film: $60,000, of which $5,000 went against
    sales and use tax. She makes the refundable election.
  - 3127, original: a $12,000 carryover (Harbor Light Pictures LP).
  - 5408, new: a $25,000 carryover (Foxglove Road Productions LLC).
  - 7311, program 3.0: a $20,000 share (Tidewater Series Partners LP).
  - 8106, soundstage filming: a $15,000 share (Stage Nine Glendale LLC).
- Standard deduction. Schedule P (540) files: original and new credits are
  Section A2 credits, and she has more than two credits.

## Documents

None. The certificates and the K-1 statements are not in the engine: each
amount, number and owner is her answer. The W-2 has no PDF. Her K-1 income is
left out on purpose, so the scenario tests the credits alone.

## What it covers

- FTB 3541 header, boxes, lines A to C, 1, 5a, 9 to 13, Part IV lines 20 to 26
  (the first form). The other four forms are in the rendered copies.
- Schedule P (540) Section A2 lines 6 and 7 (the TMT limit), line 11, Section
  B2 lines 16 to 18 (decision A68), column (d) of line 18 (decision A69).
- Form 540 lines 45, 47, 48, 74 and 78.
- Not covered: Form 540 lines 43 and 44, Schedule S line 2 (`moria`), the
  gaps and the passive credits after the film credits (unit tests).

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 lines 17, 19, 31, 35 | 900,000; 894,294; 90,835; 90,835 | 900,000 − 5,706; rate schedule; line 32 is 0 above the exemption phase-out |
| Sch P line 24 (TMT) | 63,000 | 7% × 900,000; the exemption is phased out |
| Sch P line 3 | 27,835 | 90,835 − 63,000 |
| Sch P line 6 (223) | 12,000; 12,000; 15,835; 0 | the carryover, all used |
| Sch P line 7 (237) | 25,000; 15,835; 0; 9,165 | limited by the tax over TMT |
| Sch P line 11 | 63,000 | line 2 + the last column (c), 0 |
| Sch P line 16 (239) | 20,000; 20,000; 43,000; 0 | |
| Sch P line 17 (245) | 15,000; 15,000; 28,000; 0 | |
| 3541 lines 1, 9, 10, 11 | 60,000; 5,000; 5,000; 55,000 | |
| Sch P line 18 (248) | 55,000; 28,000; 0; 0 | column (d): 55,000 − 28,000 − 27,000 elected refundable |
| 3541 line 12a, 12b | 28,000; 0 | the tax left |
| 3541 line 21 | 33,000 | 28,000 tax after the other credits + line 10 (5,000) |
| 3541 lines 22, 23, 24, 25, 26 | 27,000; 24,300; 4,860; 4,860; 0 | 60,000 − 33,000; 90%; 20% |
| 3541 lines 12d, 13 | 27,000; 0 | 55,000 − 28,000 − 27,000 |
| 540 lines 45, 47, 48 | 90,835; 90,835; 0 | 12,000 + 15,835 + 20,000 + 15,000 + 28,000 |
| 540 lines 61, 62, 64 | 0; 0; 0 | regular tax above TMT; taxable income under $1,000,000 |
| 540 lines 71, 74, 78 | 85,000; 4,860; 89,860 | W-2 box 17; FTB 3541 line 25 |
| 540 line 115 | 89,860 | refund |
| Second to fifth FTB 3541, line 12a and 13 | 12,000 and 0; 15,835 and 9,165; 20,000 and 0; 15,000 and 0 | each code's Schedule P column (b) |
