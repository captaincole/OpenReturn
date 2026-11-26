# ronde — a made-up couple with an old electric vehicle credit (synthetic)

Ronde and Ilse Tallowmere are married and file jointly. They live in Round Rock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Each spouse has one W-2. They have a world index fund that paid $88 of foreign tax (the election, no Form 1116), and a son of 7 (the child tax credit). Ronde is a limited partner in a delivery business he does not work in, so it is passive for him. In 2005 the business put electric vans in service. Ronde's share of their qualified electric vehicle credit was $2,400, and the business's losses kept it unallowed on every Form 8582-CR since. In 2025 the business had income. They take the standard deduction. The return is federal only: Texas has no income tax.

The scenario covers Form 8834 on every line:

- Form 8582-CR: the $2,400 carryover on Worksheet 4 (line 4b). The tax on the $14,000 of net passive income (line 6) is more than the credit, so line 37 allows all of it (decision A44).
- Form 8834: line 1 is the allowed credit. Lines 2 to 4 take the foreign tax credit and the child tax credit off the tax. Line 5 is the tentative minimum tax from Form 6251, which files because the credit is claimed (decision A58). Line 7 is the smaller of lines 1 and 6.
- Schedule 3 line 6i takes line 7.

The unit tests cover the other branches: a credit cut by the tax limit, Worksheet 1, a shared allowance, the gaps (`tests/unit/federal/8834/`).

Simplifications: the K-1 prints no section 199A statement, so there is no QBI deduction. Last year's unallowed credit is a stated answer (#79).

Forms checked: Form 8834, Form 8582-CR, Form 6251, Schedules E, 1, 2, 3 and 8812, Form 1040. Schedule 2 files with Form 6251 and holds only zeros.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Brushy Creek Medical Center (Ronde) | box 1 $132,000, box 2 $15,600 |
| W-2, Round Rock Learning Cooperative (Ilse) | box 1 $61,000, box 2 $6,400 |
| 1099-DIV, Pedernales World Index Fund | box 1a $1,450, box 1b $1,200, box 7 $88 |
| K-1, Harbor Electric Delivery LLC (00-0088344), no material participation | box 1 $14,000 |
| Answer: 2024 Form 8582-CR line 5 less line 37 | $2,400 qualified electric vehicle credit, Worksheet 4 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. No new type of document: the carryover comes from last year's return.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 lines 1z, 3a, 3b, 8 | 132,000 + 61,000; the fund; Schedule 1 line 10 | 193,000; 1,200; 1,450; 14,000 |
| 1040 lines 11a, 12e, 15 | 193,000 + 1,450 + 14,000; joint standard deduction | 208,450; 31,500; 176,950 |
| 1040 line 16 | QDCG: 175,750 at the 2025 joint rates = 28,493, plus 1,200 × 15% | 28,673 |
| 8582-CR 4b, 4c, 5 | the carryover | 2,400 |
| 8582-CR 6 | tax on 176,950 less tax on 162,950: 14,000 × 22% | 3,080 |
| 8582-CR 7, 37 | 2,400 − 3,080, not below 0; line 7 is 0, so line 37 is line 5 | 0; 2,400 |
| 8834 line 1 | 8582-CR line 37 (the only credit) | 2,400 |
| 8834 line 2 | 1040 line 16 + Schedule 2 line 1z (none) | 28,673 |
| 8834 lines 3a, 3b, 3c | Schedule 3 line 1; 1040 line 19; 88 + 2,200 | 88; 2,200; 2,288 |
| 8834 line 4 | 28,673 − 2,288 | 26,385 |
| 6251 lines 4, 5, 6 | 176,950 + 31,500; joint exemption; 208,450 − 137,000 | 208,450; 137,000; 71,450 |
| 6251 line 7 | Part III: 70,250 × 26% = 18,265; 1,200 × 15% = 180 | 18,445 |
| 8834 line 5 | 6251 line 7 − the $88 credit (decision A58) | 18,357 |
| 8834 line 6 | 26,385 − 18,357 | 8,028 |
| 8834 line 7 | smaller of 2,400 and 8,028 | 2,400 |
| Schedule 3 lines 1, 6i, 7, 8 | 88; 8834 line 7; 2,400; 88 + 2,400 | 88; 2,400; 2,400; 2,488 |
| Schedule 8812 lines 5, 14 | one child × 2,200 | 2,200 |
| 1040 lines 19, 20, 21 | Schedule 8812; Schedule 3 line 8; 2,200 + 2,488 | 2,200; 2,488; 4,688 |
| 1040 lines 22, 24 | 28,673 − 4,688 | 23,985 |
| 1040 lines 25a, 33, 37 | 15,600 + 6,400 withheld; 23,985 − 22,000 | 22,000; 22,000; 1,985 |
