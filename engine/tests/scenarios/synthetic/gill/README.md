# gill: a caterer with a small employer retirement plan

Gill Brannock is made up. Every name and amount is invented. He is single and
lives in Fort Worth, Texas, so the return is federal only.

**Verification: unverified.** No answer key exists. The expected values are
engine output that was checked by hand, so a failure means "the engine
changed", not "the engine is wrong".

## Who he is

- He owns Brannock Catering (Schedule C), with 58 employees paid at least
  $5,000 in 2024.
- The company's 401(k) plan started in 2023, so 2025 is the third year of the
  startup costs credit and of the contributions credit.
- An automatic enrollment arrangement was added in 2025.
- Two military spouse employees joined the plan in 2025 and 2024; a third
  joined in 2022 and is past the 3 years.
- He owns a fifth of an S corporation whose K-1 shows box 13 codes AE, AF and AG.

## What it covers

Every line of Form 8881, including line 6e (51 to 100 employees). Schedule C
line 17 loses line 5 and line 19 loses line 6g. Form 3800 lines 1j, 1dd and
1ee take Form 8881 lines 8, 11 and 15, and Schedule 3 line 6a takes the
credit.

## Input documents

- `docs/01-schedule-k1-trinity-commissary-kitchen.pdf`: Schedule K-1 (Form
  1120-S), made by `generate-docs.ts` from the existing K-1 generator.
- The business and the plan are what Gill states from the books, the payroll
  and the plan's records. No official form holds them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8881 A | employees paid $5,000 in the year before the first credit year | 54 |
| 8881 1 | plan administration fees | 3,800 |
| 8881 2 | 51 to 100 employees: 50% of line 1 | 1,900 |
| 8881 3 | 40 eligible employees x $250 | 10,000 |
| 8881 4 | greater of $500 or line 3, at most $5,000 | 5,000 |
| 8881 5 | smaller of lines 2 and 4 | 1,900 |
| 8881 6a | employees paid $5,000 in 2024 | 58 |
| 8881 6b | 800 + 950.50 + 1,000 (wages over $105,000 left out) | 2,751 |
| 8881 6c | 1,200 + 1,334 + 1,334 (third-year amount) | 3,868 |
| 8881 6d | 6b + 6c | 6,619 |
| 8881 6e(1) to 6e(4) | 58 − 50; x 2%; x 6d; 6d − 6e(3) | 8; 0.16; 1,059; 5,560 |
| 8881 6f, 6g | 6e(4); x 75% | 5,560; 4,170 |
| 8881 7, 8 | K-1 code AE; 1,900 + 4,170 + 640 | 640; 6,710 |
| 8881 9 to 11 | $500; K-1 code AF; total | 500; 100; 600 |
| 8881 12 to 15 | 2 x $200; 250 + 300; K-1 code AG; total | 400; 550; 90; 1,040 |
| Schedule C 17 | 26,500 − 1,900 | 24,600 |
| Schedule C 19 | 14,250 − 4,170 | 10,080 |
| Form 3800 1j, 1dd, 1ee | own and K-1 credits | 6,710; 600; 1,040 |
| Schedule 3 6a | 6,710 + 600 + 1,040 | 8,350 |
| Form 1040 16 | tax on 322,100 | 82,282 |
| Form 1040 22 | 82,282 − 8,350 | 73,932 |
