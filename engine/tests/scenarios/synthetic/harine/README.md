# harine — a made-up partner whose partnership corrected its own return (synthetic)

Harine Tolvarro is single and lives in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She has one W-2 and took $5,000 out of an old 401(k) at 38 (Form 1099-R code 1), so Schedule 2 line 8 has the 10% additional tax. In 2025 Fernhollow Orchards LLC filed an administrative adjustment request (AAR) for 2022 and sent her a Form 8986: it had overstated her ordinary income by $40,000. The lower 2022 income takes away her qualified business income deduction for 2022, and the qualified business loss it leaves lowers her 2023 deduction. She takes the standard deduction. The return is federal only: Washington has no income tax.

The scenario renders Form 8978 with the AAR Filing box: a decrease in column (a), an increase in column (b) with interest at the short-term rate plus 3%. Line 14 is negative. Schedule 3 line 6l takes it up to Form 1040 line 18, and Schedule 2 line 17z takes the rest, up to the chapter 1 tax on line 8. This is the branch the vandene scenario cannot show. The earlier years' corrected tax comes from her preparer's statements (the year facts).

Forms that file: Form 1040, Schedule 2, Schedule 3, Form 8978.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Inland Empire Cooperative | box 1 $24,000, box 2 $1,400 |
| 1099-R, Cascade Plan Services (401(k)) | box 1 $5,000, box 2a $5,000, box 4 $1,000, code 1 |
| Form 8986, Fernhollow Orchards LLC (AAR, review year 2022, furnished 03/28/2025) | line 1 −40,000 |
| 2022 return and statement | income 58,000; deductions 19,150; tax 4,457; QBI deduction −6,200; corrected tax 505 |
| 2023 | income 44,000; deductions 18,850; tax 2,798; QBI loss carryforward −1,800; corrected tax 3,014 |

## Input documents

The Form 8986 is a made document in `docs/01-form-8986-fernhollow-orchards.pdf`, rendered by `generate-docs.ts` with `documents/form8986.ts` from the object `facts.ts` holds. An AAR shows no modifications. The W-2 and 1099-R have no PDF. The comparison with real examples is in the vandene README.

## Hand check

| Line | Rule | (a) 2022 | (b) 2023 |
| --- | --- | --- | --- |
| 1a | as filed | 58,000 | 44,000 |
| 1b | Schedule A line 2 | −40,000 | 0 |
| 2 | 1a + 1b | 18,000 | 44,000 |
| 3a | as filed | 19,150 | 18,850 |
| 3b | Schedule A line 4 | −6,200 | −1,800 |
| 4 | 3a + 3b | 12,950 | 17,050 |
| 5 | 2 − 4 | 5,050 | 26,950 |
| 6, 8, 11 | the statement; no AMT or credits | 505 | 3,014 |
| 12 | as filed | 4,457 | 2,798 |
| 13 | 11 − 12 | −3,952 | 216 |
| 17 | interest | 0 (a decrease) | 34 |

Line 14 is −3,952 + 216 = −3,736. Line 17 (b): 216 from April 15, 2024 to April 15, 2026 at the underpayment rate (8% in 2024, 7% in 2025, 7% then 6% in 2026), about 15.8%, 34. Line 16 is 0, line 18 is 34.

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 1z; 5a, 5b | wages; the 401(k) distribution | 24,000; 5,000 |
| 1040 line 9, 11a | 24,000 + 5,000 | 29,000 |
| 1040 line 15 | 29,000 − 15,750 | 13,250 |
| 1040 line 16, 18 | tax table, 13,250–13,300, single | 1,355 |
| Schedule 3 line 6l | Negative Form 8978 Adjustment Worksheet: line 1 is 1,355, line 2 is 3,736; line 1 is less, so 6l is 1,355 and 2,381 is left | 1,355 |
| Schedule 3 lines 7, 8; 1040 line 20, 21 | line 6l | 1,355 |
| 1040 line 22 | 1,355 − 1,355 | 0 |
| Schedule 2 line 8 | 10% of 5,000 | 500 |
| Schedule 2 line 17z | worksheet line 1, the chapter 1 taxes of Part II, is 500; it is not more than 2,381, so −500, "Form 8978 ADJ" | −500 |
| Schedule 2 line 18, 21 | −500; 500 − 500 | −500; 0 |
| 1040 line 24 | 0 + 0 | 0 |
| 1040 line 25d, 34, 35a | 1,400 + 1,000 withheld, all refunded | 2,400 |

The remaining 1,881 of the decrease has no line to go to on this return.
