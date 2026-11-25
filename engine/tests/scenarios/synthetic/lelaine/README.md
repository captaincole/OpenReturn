# lelaine (synthetic, unverified)

Lelaine and Corin Tarvesh are made-up taxpayers. No filed return, benchmark case or test package stands behind their values. A person checked each line below by hand against the form and its instructions, then locked the engine's output.

## Who they are

- Married filing jointly, full-year California residents (Sacramento).
- Lelaine's W-2: $86,400 wages, $1,000 California tax withheld. Corin's W-2: $24,000 wages, $200 withheld.
- Three children: Mira (15), Davan (18 on June 15, 2025) and Pell (born March 10, 2025).
- Sela (20) is their daughter. They could claim her but do not. She files her own return with $24,000 of MAGI.

## Health coverage

- Lelaine: her employer plan all year (Z).
- Corin: covered January to April and July to September. May and June are the first short gap (C). October to December have no coverage and no exemption (X).
- Mira: no coverage. Covered California granted hardship (K) and projected-income (M) exemptions, with three ECNs. A health care sharing ministry (F) in March to June.
- Davan: no coverage and no exemption all year (X).
- Pell: I through his birth month, then Lelaine's plan (Z).
- Sela: a student plan to June (Z). From July her employer's self-only coverage cost $5,400 for six months, which is unaffordable (A).

## What it covers

- FTB 3853 Parts I, III and IV; Part II is not checked.
- Worksheet A with a person who turns 18 during the year, and Worksheet B.
- Form 540 line 92, line 95 (the payments are more than the penalty) and line 114. A unit test covers line 96.
- No document: the coverage months, exemptions and ECNs are answers.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 540 line 17 | 110,400 | 86,400 + 24,000 |
| Household income (Step 3) | 110,400 | 540 line 17; Sela is not a claimed dependent, so Step 3 question 4 leaves out her MAGI (DECISION in `penalty.ts`) |
| Threshold (Step 4 line 2) | 73,595 | gross income chart, MFJ under 65, 2 or more dependents |
| Step 4 line 5 | 920 | 36,805 × 2.5% = 920.125 |
| Code A test, Sela | 10,800 > 8,211.84 | 5,400 / 6 × 12; 7.28% × (110,400 + 2,400 salary reduction) |
| Worksheet A line 5 | 475 (Jan–Jun), 950 (Jul–Sep), 1,900 (Oct–Dec) | Davan under 18 to June; Corin and Davan from October |
| Worksheet A line 7, line 8 | 950, 15 | 11,400 / 12; 6 + 3 + 6 |
| Worksheet B line 14 | 1,173 | (920 × 6 + 950 × 3 + 1,900 × 3) / 12 = 1,172.50 |
| Penalty Worksheet line 4 | 5,655 | 377 × 15 |
| 3853 Part IV line 1, 540 line 92 | 1,173 | the smaller of 1,173 and 5,655 |
| 3853 Part I line 1 MAGI | 110,400 | 540 line 17, no tax-exempt interest |
| 3853 Part I line 6 MAGI | 24,000 | Sela's MAGI (printed, not counted) |
| 540 line 93 | 1,200 | 1,000 + 200 withheld |
| 540 line 95 | 27 | 1,200 − 1,173; line 96 is blank |
| 540 line 100 | 1,252 | 1,279 − 27 |
| 540 lines 111 and 114 | 1,252 | line 100 |
