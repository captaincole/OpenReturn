# vandene — a made-up partner after two partnership audits (synthetic)

Vandene Quillfeather is single and lives in Corpus Christi, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2 for 2025. In 2025 two partnerships sent her a Form 8986 after an audit under the centralized partnership audit regime (BBA). Copperline Ventures LP was audited for 2021: more ordinary income, less other deductions, a capital loss, a smaller research credit, and the substantial understatement penalty. Bayline Partners LP passed on the audit of Saltmarsh Timber Fund LLC; its adjustments relate to Bayline's year ended June 30, 2023. The capital loss is limited to $3,000 a year, so it also changes 2022 and 2023, and 2024 changes through a passive loss carryover. She takes the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders Form 8978 with all four columns, the BBA Audit box, a penalty, and interest at the short-term rate plus 5%. Line 14 is above 0, so it goes on Form 1040 line 16 with box 3 and "Form 8978". The earlier years' corrected tax comes from her preparer's statements (the year facts); the engine has no tax tables for those years. The published examples that check the rules are unit tests (`tests/unit/federal/8978/`).

Forms that file: Form 1040, Form 8978.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Gulfline Marine Engineering | box 1 $185,000, box 2 $42,000 |
| Form 8986, Copperline Ventures LP (audit, review year 2021, furnished 06/12/2025) | line 1 +18,000; line 9a −7,000; line 13 code W −2,500; line 15 code M −1,200; penalty 6662(a), 20%, line 1 |
| Form 8986, Bayline Partners LP for Saltmarsh Timber Fund LLC (audit, Part III year end 06/30/2023, furnished 02/20/2025) | line 2 +4,000; line 12 −3,000 |
| 2021 return and statement | income 168,000; deductions 14,000; credits 1,500; tax 29,481; capital loss limit +4,000; corrected tax 35,707, AMT 640, penalty 1,313; extended |
| 2022 | income 175,000; deductions 12,950; tax 32,728; carryover −3,000; corrected tax 32,008 |
| 2023 | income 181,000; deductions 13,850; tax 33,516; carryover −1,000; corrected tax 34,956 |
| 2024 | income 190,000; deductions 14,600; tax 35,139; passive carryover +1,800; corrected tax 35,571 |

## Input documents

The two Forms 8986 are made documents in `docs/`: `01-form-8986-copperline-ventures.pdf` and `02-form-8986-saltmarsh-timber.pdf`. `generate-docs.ts` renders them with `documents/form8986.ts` from the same objects `facts.ts` holds. The W-2 has no PDF.

### Compared with real examples

- [Form 8986 (Rev. December 2024)](https://www.irs.gov/pub/irs-access/f8986_accessible.pdf), the official form: ours follows its Parts I to V, item letters and the Part V columns (a) to (h) and the Applicable Penalties table. We leave out Part II item B (the partnership representative), Part IV items F and G (liabilities, capital account) and Part VI: no fact holds them.
- [Instructions for Form 8986](https://www.irs.gov/instructions/i8986): column (g) is the adjustment net of approved modifications and (h) the corrected amount; the penalties sit under Part V with section, description, rate and lines. Ours matches.
- [Instructions for Form 8986 (2019)](https://www.irs.gov/pub/irs-prior/i8986--2019.pdf): there "Column (h), Net (column (f) minus column (g))" was the net amount. This explains the column letters the Form 8978 instructions use (decision A23 in `docs/rule-decisions.md`). Ours uses the current letters.

## Hand check

| Line | Rule | (a) 2021 | (b) 2022 | (c) 2023 | (d) 2024 |
| --- | --- | --- | --- | --- | --- |
| 1a | as filed | 168,000 | 175,000 | 181,000 | 190,000 |
| 1b | Schedule A line 2 | 18,000 − 7,000 + 4,000 = 15,000 | −3,000 | 4,000 − 1,000 = 3,000 | 1,800 |
| 2 | 1a + 1b | 183,000 | 172,000 | 184,000 | 191,800 |
| 3a | as filed | 14,000 | 12,950 | 13,850 | 14,600 |
| 3b | Schedule A line 4 | −2,500 | 0 | −3,000 | 0 |
| 4 | 3a + 3b | 11,500 | 12,950 | 10,850 | 14,600 |
| 5 | 2 − 4 | 171,500 | 159,050 | 173,150 | 177,200 |
| 6, 7 | the statement | 35,707; 640 | 32,008; 0 | 34,956; 0 | 35,571; 0 |
| 8 | 6 + 7 | 36,347 | 32,008 | 34,956 | 35,571 |
| 9a, 9b | as filed; Schedule A line 6 | 1,500; −1,200 | 0; 0 | 0; 0 | 0; 0 |
| 10 | 9a + 9b | 300 | 0 | 0 | 0 |
| 11 | 8 − 10 | 36,047 | 32,008 | 34,956 | 35,571 |
| 12 | as filed | 29,481 | 32,728 | 33,516 | 35,139 |
| 13 | 11 − 12 | 6,566 | −720 | 1,440 | 432 |
| 15 | the penalty statement: 20% × 6,566 | 1,313 | 0 | 0 | 0 |
| 17 | interest, below | 3,333 | 0 | 295 | 40 |

Line 14 is 6,566 − 720 + 1,440 + 432 = 7,718. Line 16 is 1,313. Line 18 is 3,333 + 295 + 40 = 3,668.

Line 17 compounds the quarterly underpayment rate plus two points (five over the short-term rate) daily, to April 15, 2026. Column (a): 6,566 from April 15, 2022, about 43.0% over the four years (rates 6% to 10%), is 2,827; the penalty of 1,313 from October 15, 2022 (the return was extended) adds about 38.4%, 504; together 3,331 by this rough sum of rates, 3,333 with daily compounding. Column (c): 1,440 from April 15, 2024, about 20.5%, 295. Column (d): 432 from April 15, 2025, about 9.4%, 40. Column (b) is a decrease: no interest.

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 1a, 9, 11a | W-2 box 1 | 185,000 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 185,000 − 15,750 | 169,250 |
| 1040 line 16 | tax on 169,250 (33,467) + Form 8978 line 14 | 41,185 |
| 1040 line 16 box 3 | "Form 8978" and the amount | Form 8978 7,718 |
| 1040 line 24 | line 16 | 41,185 |
| 1040 line 34, 35a | 42,000 − 41,185 | 815 |

The tax on 169,250: 17,651 through $103,350, plus 24% of 65,900 (15,816), is 33,467. Penalties and interest are paid with the return but are not on it.
