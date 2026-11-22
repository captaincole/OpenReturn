# nynaeve — a made-up child whose unearned income is taxed at her parents' rate (synthetic)

Nynaeve Thornbury is 17 and single. She lives in Spokane, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She works at a garden center (one W-2). She has interest from a savings bank and dividends from a fund she inherited, with qualified dividends and capital gain distributions. She pays more than half of her own support, so nobody can claim her as a dependent. She takes the standard deduction. Her parents file jointly and told her the amounts from their return. Her brother Tobin files his own Form 8615. The return is federal only: Washington has no income tax.

The scenario renders a Form 8615 with every line filled. Line 1 uses the Child's Unearned Income Worksheet (she has wages). Line 5 Worksheet #1 splits her qualified dividends and capital gain. Line 7 holds her brother's line 5, so lines 12a and 12b fill. Lines 9, 15 and 17 use the Qualified Dividends and Capital Gain Tax Worksheet. Line 18 goes to Form 1040 line 16. The published examples that check the rules are unit tests (`tests/unit/federal/8615/`).

Forms that file: Form 1040, Schedule B, Form 8615.

## Inputs

| Input                                        | Amounts                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| W-2, Latah Creek Garden Center               | box 1 $20,000, box 2 $900                                                                             |
| 1099-INT, Inland Empire Savings Bank         | box 1 $2,600                                                                                          |
| 1099-DIV, Palouse Balanced Fund              | box 1a $9,400, box 1b $6,200, box 2a $2,300                                                           |
| Answer: a parent alive at the end of 2025    | yes                                                                                                   |
| Answer: someone can claim her as a dependent | no                                                                                                    |
| Answer: the parents' 2025 joint return       | Garrick T. Thornbury, MFJ; line 15 $238,400; line 16 $41,866; line 3a $4,100; net capital gain $7,500 |
| Answer: her brother's Form 8615              | line 5 $3,400, with $900 of qualified dividends                                                       |

The parents' line 16 is the Qualified Dividends and Capital Gain Tax Worksheet on their own amounts: tax on $226,800 ($40,126) plus 15% of $11,600 ($1,740).

## Hand check

| Line                     | Rule                                                                                 | Value     |
| ------------------------ | ------------------------------------------------------------------------------------ | --------- |
| 1040 line 9, 11b         | 20,000 + 2,600 + 9,400 + 2,300                                                       | 34,300    |
| 1040 line 15             | 34,300 − 15,750                                                                      | 18,550    |
| 8615 line 1              | worksheet: line 9 less earned income, 34,300 − 20,000                                | 14,300    |
| 8615 line 2              | no itemized deductions                                                               | 2,700     |
| 8615 line 3              | 14,300 − 2,700                                                                       | 11,600    |
| 8615 line 4              | 1040 line 15                                                                         | 18,550    |
| 8615 line 5              | smaller of 11,600 and 18,550                                                         | 11,600    |
| Line 5 Worksheet #1      | 6,200 / 14,300 = .434; 2,700 × .434 = 1,172; 6,200 − 1,172                           | QD 5,028  |
| Line 5 Worksheet #1      | 2,300 / 14,300 = .161; 2,700 × .161 = 435; 2,300 − 435                               | NCG 1,865 |
| 8615 line 6              | parents' line 15                                                                     | 238,400   |
| 8615 line 7              | brother's line 5                                                                     | 3,400     |
| 8615 line 8              | 11,600 + 238,400 + 3,400; QD 5,028 + 4,100 + 900 = 10,028; NCG 1,865 + 7,500 = 9,365 | 253,400   |
| 8615 line 9 (box)        | MFJ: tax on 234,007 (41,856) + 15% of 19,393 (2,909)                                 | 44,765    |
| 8615 line 10 (box)       | parents' line 16; they have dividends and gain                                       | 41,866    |
| 8615 line 11             | 44,765 − 41,866                                                                      | 2,899     |
| 8615 line 12a            | 11,600 + 3,400                                                                       | 15,000    |
| 8615 line 12b            | 11,600 / 15,000                                                                      | .773      |
| 8615 line 13             | 2,899 × .773 = 2,240.93                                                              | 2,241     |
| 8615 line 14             | 18,550 − 11,600; QD 6,200 − 5,028 = 1,172; NCG 2,300 − 1,865 = 435                   | 6,950     |
| 8615 line 15 (box)       | single: 1,607 at 0%, tax table on 5,343                                              | 533       |
| 8615 line 16             | 2,241 + 533                                                                          | 2,774     |
| 8615 line 17 (box)       | single: 8,500 at 0%, tax table on 10,050                                             | 1,008     |
| 8615 line 18             | larger of 2,774 and 1,008                                                            | 2,774     |
| 1040 line 16, 18, 22, 24 | 8615 line 18                                                                         | 2,774     |
| 1040 line 25a, 33        | W-2 box 2                                                                            | 900       |
| 1040 line 37             | 2,774 − 900                                                                          | 1,874     |
