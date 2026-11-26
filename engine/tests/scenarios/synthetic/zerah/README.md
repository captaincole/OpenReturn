# zerah (synthetic, unverified)

Zerah Okonkwo-Hale is a made-up taxpayer. No filed return, benchmark case or
FTB example stands behind the values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, born May 21, 1934, a full-year California resident (Yuba City).
- She grows walnuts (Schedule F, cash method): $272,000 of gross farm income,
  $174,200 of profit.
- Her cannery pension paid out in full in 2025 (Form 1099-R): box 1 $40,000,
  box 2a $36,000, box 3 $4,000. California tax withheld $1,000. For California
  she uses Schedule G-1 with both elections.
- $2,600 of interest.
- She is a farmer for FTB 5805F: $272,000 of her $310,600 gross income is from
  farming (88%); in 2024, $248,500 of $251,000.
- Her 2024 California tax was $9,410, of which $310 was an FTB 5870A tax on a
  trust's accumulation distribution; $900 was withheld.
- She paid $2,000 of 2025 estimated tax on January 12, 2026, and her 2024
  return applied $300 to 2025. She files and pays the rest on April 6, 2026.
- A January flood closed the orchard road; she asks to waive $20 of the penalty.

## Input documents

The Form 1099-R is a made document, `docs/01-sutter-basin-cannery-1099-r.pdf`,
rendered by `generate-docs.ts` from the fact in `facts.ts`
(`documents/form1099R.ts`). The orchard amounts, the 2024 amounts, the
gross income test and the payment answers are her answers: no document prints
them. The 1099-INT has no PDF.

## What it covers

- FTB 5805F: every field, Part I and Part II, with the line 16 waiver.
- Form 540 line 113 takes FTB 5805F line 16, and its FTB 5805F box is checked.
- FTB 5805 does not file: a farmer uses FTB 5805F.
- Not covered here: the stops on lines 6 and 9, no 2024 return, the AGI limit
  on line 10, the exceptions, no waiver. The unit tests cover them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| Sch F line 9, 34 | 272,000, 174,200 | 262,000 + 6,000 + 4,000; less 97,800 of expenses |
| G-1 line 28 | 460 | 220 (5.5% of 4,000) + 240 (10-year averaging on 32,000) |
| 540 line 17 | 164,493 | federal AGI 200,493 less the 36,000 pension on Schedule G-1 |
| 540 line 31, 33 | 11,206, 10,900 | rate schedule on 158,787; less 306 of exemption credits |
| 540 line 34, 48 | 460, 11,360 | G-1 line 28; 10,900 + 460, no credits |
| 540 line 71, 72 | 1,000, 2,300 | 1099-R box 14; 2,000 + 300 |
| 5805F line 1 | 11,360 | 540 line 48; lines 61, 62 blank; no 453A interest |
| 5805F line 2, 3 | 460, 10,900 | 540 line 34; 11,360 − 460 |
| 5805F line 4 | 7,267 | 10,900 × .6667 = 7,267.03 |
| 5805F line 5, 6 | 1,000, 9,900 | 540 lines 71 + 73; 10,900 − 1,000 (not under $500) |
| 5805F line 7, 8, 9 | 9,410, 310, 9,100 | 2024 tax with its line 34 tax; the line 34 tax; 9,410 − 310 |
| 5805F line 10 | 7,267 | smaller of 7,267 and 9,100; AGI under $1,000,000 |
| 5805F line 11 | 3,300 | 1,000 + 2,000 (by January 15) + 300 (2024 overpayment) |
| 5805F line 12 | 3,967 | 7,267 − 3,300 |
| 5805F line 13, 14 | 04/06/2026, 81 | 16 + 28 + 31 + 6 days after January 15 |
| 5805F line 15 | 62 | 81 / 365 × .07 × 3,967 = 61.62 |
| 5805F line 16 | 42, box checked | 62 − 20 waived; the explanation on two rows |
| 540 line 113 | 42, FTB 5805F box checked | FTB 5805F line 16 |
| 540 line 111, 114 | 8,060, 8,102 | 11,360 − 3,300; 8,060 + 42 |
