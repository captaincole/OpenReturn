# hari: a cotton farmer with a new retirement plan

Hari Tallowfield is made up. Every name and amount is invented. He is single
and farms near Lubbock, Texas, so the return is federal only.

**Verification: unverified.** No answer key exists. The expected values are
engine output that was checked by hand, so a failure means "the engine
changed", not "the engine is wrong".

## Who he is

- He owns a cotton farm (Schedule F) with 12 employees.
- The farm's 401(k) plan started in 2025: the first year of both Part I
  credits.
- The plan's setup fees are in Schedule F line 23 with the contributions.

## What it covers

The farm branch of Form 8881, which the gill scenario (a business) cannot
show: Schedule F line 23 loses both line 5 and line 6g. It also covers the
$500 floor on line 4, an employer with 50 or fewer employees (line 2 takes
line 1, no line 6e) and the first plan year (line 6g is line 6f).

## Input documents

None. The farm and the plan are what Hari states from the books, the payroll
and the plan's records. No official form holds them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8881 A, 1, 2 | 12 employees: line 2 is line 1 | 12; 1,250; 1,250 |
| 8881 3, 4, 5 | 1 x $250; at least $500; smaller of 2 and 4 | 250; 500; 500 |
| 8881 6a to 6d | 12; 900 + 1,000; 1,000 + 1,000; total | 12; 1,900; 2,000; 3,900 |
| 8881 6f, 6g, 8 | no 6e; first year 100%; 500 + 3,900 | 3,900; 3,900; 4,400 |
| Schedule F 23 | 6,150 − 500 − 3,900 | 1,750 |
| Form 3800 1j | line 8 | 4,400 |
| Schedule 3 6a | Form 3800 | 4,400 |
| Form 1040 16 | tax table on 82,157 | 12,993 |
| Form 1040 22 | 12,993 − 4,400 | 8,593 |
