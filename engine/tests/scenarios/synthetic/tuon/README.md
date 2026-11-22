# tuon (synthetic, unverified)

Tuon Halloran is a made-up taxpayer. No filed return, benchmark case or IRS
test package stands behind the values. A person checked each line below by
hand against the form and its instructions, then locked the engine's output.

## Who she is

- Single, born March 9, 1934, a full-year California resident (Santa Rosa).
- Her whole pension paid out in 2025 (Form 1099-R): box 1 $60,000, box 2a
  $52,000, box 3 $6,000 (participation before 1974), box 5 $8,000, box 8
  $12,000 (an annuity contract), code 7, total distribution. Federal tax
  withheld $5,200, California $1,200.
- $8,400 of savings interest.
- For California she uses Schedule G-1 with both elections: the 5.5% capital
  gain election and 10-year averaging. She does not use federal Form 4972: the
  pension is ordinary income on her federal return.

## What it covers

- Schedule G-1 Parts I to III: every line but line 9 (no death benefit). Lines
  13 to 16 and 21 to 26 are filled (line 12 under $70,000, an annuity).
- Line 28 goes to Form 540 line 34 (with the Schedule G-1 box), line 35 and the
  total tax.
- Schedule CA line 5b, column B takes the $52,000 out of California income.
- Not covered here: the death benefit exclusion, NUA, several recipients, Part
  II alone. The unit tests cover them.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| 1040 line 5a, 5b | 60,000, 52,000 | 1099-R boxes 1 and 2a |
| 1040 line 11 | 60,400 | 52,000 + 8,400 |
| G-1 lines 1 to 5 | yes, no, no, yes, no | her answers |
| G-1 line 6, 7 | 6,000, 330 | box 3; 6,000 × 5.5% |
| G-1 line 8, 10 | 46,000, 46,000 | 52,000 − 6,000; no line 9 |
| G-1 line 11, 12 | 12,000, 58,000 | box 8; 46,000 + 12,000 |
| G-1 line 13, 14, 15, 16 | 10,000, 38,000, 7,600, 2,400 | the $10,000 cap; 58,000 − 20,000; × 20%; 10,000 − 7,600 |
| G-1 line 17, 18 | 55,600, 5,560 | 58,000 − 2,400; × 10% |
| G-1 line 19, 20 | 76, 760 | 34.90 + 2% × 2,070 = 76.30; × 10 |
| G-1 line 21 | 0.207 | 12,000 ÷ 58,000 = .2068… |
| G-1 line 22, 23 | 497, 11,503 | 2,400 × .207 = 496.80; 12,000 − 497 |
| G-1 line 24, 25, 26 | 1,150, 12, 120 | 11,503 × 10% = 1,150.30; 1% = 11.50; × 10 |
| G-1 line 27, 28 | 640, 970 | 760 − 120; 640 + 330 |
| Schedule CA line 5b col B | 52,000 | the part Schedule G-1 taxes (QUESTIONS.md, question 1) |
| 540 line 17, 19 | 8,400, 2,694 | 60,400 − 52,000; less the $5,706 standard deduction |
| 540 line 31, 32, 33 | 27, 306, 0 | tax table; 153 + 153 senior |
| 540 line 34, 35, 64 | 970, 970, 970 | G-1 line 28 |
| 540 line 115 | 230 | 1,200 withheld − 970 |
