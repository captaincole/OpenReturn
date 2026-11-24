# lan — an S corporation K-1 outside self-employment and earned income (synthetic)

Nysa and Lan Mandragoran are married, file jointly and live in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the forms and their instructions, then locked (`verification: "unverified"`).

Nysa sells herbal tea blends (Schedule C, self-employment tax). Lan owns all of an S corporation, Malkier Fencing Academy, and runs it full time: it pays him a small W-2 salary, and its K-1 shows box 1 ordinary business income only, with no section 199A statement. Their son Isam is 18: a qualifying child for the EIC, and an other dependent for Schedule 8812. Taxable income is 0. The return is federal only: Texas has no income tax.

The return shows that the K-1 income is in AGI (Schedule E Part II, Schedule 1 line 5), and outside self-employment tax and earned income: Schedule SE reads only Schedule C, and the EIC is figured on $10,646 of earned income, not $25,646.

Two choices differ from the task text (QUESTIONS.md in `engine/src/federal/passThrough/`, items 13 and 14): the Schedule C owner is the taxpayer, since a spouse's Schedule SE is not modeled, and the son is 18, since Schedule 8812 line 18a with self-employment is an engine gap.

Forms that file: Form 1040, Schedules 1, 2, C, SE, E, EIC and 8812, Form 8995.

One made input document: `docs/01-schedule-k1-malkier-fencing.pdf`, Lan's Schedule K-1 (Form 1120-S), from `generate-docs.ts` with the same fact object `facts.ts` uses. The K-1 prints the boxes and Part II answers the fact holds; the corporation's address, the IRS center and Lan's masked number are made up for the page. Item D (the corporation's total shares) is blank: the fact does not hold it. The W-2 has no PDF: its facts are the boxes as it would print them.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Malkier Fencing Academy, Inc. (Lan) | box 1, 3 and 5 $6,000; box 4 $372; box 6 $87; no withholding |
| Schedule C, Two Rivers Herbal Teas (Nysa) | receipts $7,400; advertising $500; supplies $1,900 |
| Schedule K-1 (Form 1120-S), Malkier Fencing Academy, Inc. (Lan) | box 1 $15,000; 100%; no other box |
| Holding answers | Lan's K-1; he materially participated |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Sch C line 31 | 7,400 − 2,400 | 5,000 |
| Sch SE lines 2–4a | Schedule C only; 92.35% (irs-1120sk1-inst-2025::sec::general-instructions::b01: S corporation income is not SE income) | 5,000; 4,618 |
| Sch SE lines 10–13 | 12.4% and 2.9% of 4,618; half of 707 | 573; 134; 707; 354 |
| Sch E line 28 A (a), (b), (d) | the K-1's name, "S", EIN | Malkier Fencing Academy, Inc.; S; 00-0001120 |
| Sch E line 28 A (e), (f) | no loss, distribution, sale or loan repayment; nothing at risk (line-28::b03) | unchecked |
| Sch E line 28 A (k) | box 1, nonpassive (irs-1120sk1-inst-2025::sec::income-loss::b01) | 15,000 |
| Sch E lines 27, 29a (k), 30, 32, 41 | no prior-year loss; totals | No; 15,000 each |
| Sch 1 lines 3, 5, 10 | Schedule C; Schedule E line 41 | 5,000; 15,000; 20,000 |
| Sch 1 line 15 | half of SE tax | 354 |
| 1040 lines 1a, 8, 9, 10, 11 | 6,000 + 20,000; less 354 | 6,000; 20,000; 26,000; 354; 25,646 |
| 1040 lines 12e, 15 | MFJ standard deduction; 25,646 − 31,500 | 31,500; 0 |
| Form 8995 | Schedule C QBI 5,000 − 354 = 4,646; 20% = 929; line 11 −5,854; line 15 the smaller | 929; 0 |
| EIC earned income | Worksheet B: 5,000 − 354 + 6,000 (the K-1 is not earned income) | 10,646 |
| 1040 line 27a | EIC table, MFJ, one child, 10,600–10,650; AGI under the phase-out | 3,613 |
| Sch 8812 lines 6–14 | one other dependent × $500; limited by tax of 0 | 500; 0 |
| 1040 lines 23, 24 | Schedule 2 line 4 (SE tax) | 707 |
| 1040 lines 33, 34 | 3,613; 3,613 − 707 | 3,613; 2,906 |

If the K-1 counted as earned income, the EIC would be $4,328 (the table at $25,646).
