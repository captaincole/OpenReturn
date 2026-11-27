# irella — a treaty exemption disclosed on Form 8833 (synthetic)

Irella Wenlock is single and lives in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a doctoral student from the People's Republic of China. She came to the United States on an F-1 visa in 2020. For 2025 she meets the substantial presence test, so she is a resident alien and files Form 1040. Her university pays her as a teaching assistant: $31,400 in W-2 box 1. She claims the Article 20(c) treaty exemption for $5,000 of it. The 1984 Protocol keeps that article outside the treaty's saving clause, so a resident alien still has it (Pub. 519, `irs-pub-519-2025::sec::special-rule-for-canadian-and-german::b04`). She takes the standard deduction. The return is federal only: Texas has no income tax.

Forms that file: Form 1040, Schedule 1, Form 8833.

## What the scenario covers

- One treaty position, one Form 8833. The header, lines 1a, 1b, 2 and 3, line 5 No, and line 6 over nine rows.
- Blank by rule: the reference ID (an individual), the dual-resident box, line 4 (the China treaty position names no limitation on benefits test), and line 5's subsections.
- The engine does not figure the treaty's effect. The exempt amount is her own Schedule 1 line 8z item: "(5,000) Exempt income, People's Republic of China, Article 20(c)" (Pub. 519, `irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02`).
- Unit tests in `tests/unit/federal/8833/` cover the other branches: line 5 Yes, line 4, a waived position, a spouse's position, two copies, the dual-resident gap and an explanation longer than 25 rows.

## Why she files Form 8833

The Form 8833 instructions waive reporting for "income derived by ... students" (`irs-8833-form-2025::sec::who-must-file::b05`). University volunteer tax sites still attach Form 8833 for a resident alien who relies on a saving-clause exception (the UConn VITA sample "Form 8833 CHINA STUDENT 5000", the model for this line 6). Her answer is that she discloses the position: `reportingWaived` is false. The engine does not judge a waiver (`engine/src/federal/8833/QUESTIONS.md`, item 1).

## Inputs

| Input | Values |
| --- | --- |
| W-2, Prairie Crest State University | box 1 $31,400, box 2 $1,620; boxes 3 to 6 blank (student exception) |
| Schedule 1 line 8z item | Exempt income, People's Republic of China, Article 20(c): −$5,000, marked as a treaty exemption (`treatyExempt`) |
| Treaty position | China, 20(c); Code sections 61 and 7701(b); payor the university; not specifically required; the explanation |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8833 name, number | the taxpayer (her position) | Irella Wenlock, 400-00-8833 |
| 8833 address in country of residence | home address, the country written out | 4417 Bluebonnet Ridge Dr Apt 12 / Austin, TX 78745 / United States |
| 8833 address in the United States | home address | 4417 Bluebonnet Ridge Dr Apt 12 / Austin, TX 78745 |
| 8833 first box | section 6114 disclosure | checked |
| 8833 dual-resident box | not stated | blank |
| 8833 citizen or resident box | Form 1040 filer | checked |
| 8833 lines 1a, 1b, 2 | stated | People's Republic of China; 20(c); Protocol, paragraph 2; Sections 61 and 7701(b) |
| 8833 line 3 | wages are fixed or determinable annual or periodical income | the university, its EIN and address |
| 8833 line 4 | none stated | blank |
| 8833 line 5 | not specifically required | No |
| 8833 line 6 | 55 characters on row 1, 115 on the others | rows 1 to 9; rows 10 to 25 blank |
| Schedule 1 lines 8z, 9, 10 | the stated item | −5,000 |
| 1040 line 1a, 1z | W-2 box 1 | 31,400 |
| 1040 line 8 | Schedule 1 line 10 | −5,000 |
| 1040 line 9, 11a, 11b | 31,400 − 5,000 | 26,400 |
| 1040 line 12e, 14 | single standard deduction | 15,750 |
| 1040 line 15 | 26,400 − 15,750 | 10,650 |
| 1040 line 16 | tax table 10,650–10,700: 10% of the midpoint 10,675 = 1,067.50 | 1,068 |
| 1040 line 18, 22, 24 | line 16 | 1,068 |
| 1040 line 25a, 25d, 33 | W-2 box 2 | 1,620 |
| 1040 line 34, 35a | 1,620 − 1,068 | 552 |

The rendered Form 8833 was opened and each value sits in its box.
