# erian — a made-up injured spouse (synthetic)

Erian and Bastien Thalmont are married and file jointly. They live in Gainesville, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Erian teaches third grade. Bastien guides river trips, and he owes past-due child support from an earlier marriage. The IRS will apply their joint refund to that debt. Erian does not owe it, so she files Form 8379 with the return to get her share back. Florida is not a community property state.

Bastien cashed out an old 401(k) at 39 (Form 1099-R code 1): the 10% additional tax is on Schedule 2. They have a joint savings account, two children under 17 (the child tax credit and a small additional child tax credit), Erian's educator expenses, and two joint estimated payments. They take the standard deduction. The return is federal only: Florida has no income tax.

The couple split the items that belong to neither of them: half the interest, half the estimated payments, and one child each (half of each child tax credit). Erian wants her refund mailed to her sister.

The scenario fills Form 8379 Parts I to III with a value on every Part III line. Part I ends at line 6: Erian had tax withheld. Part IV stays blank: the form goes with the return. The form changes no amount on the return, and no other form's line receives it. The unit tests cover the other Part I routes and the gaps (`tests/unit/federal/8379/`).

Forms that file: Form 1040, Schedules 1, 2 and 8812, Form 8379.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Alachua Hollow School District (Erian) | box 1 $46,000, box 2 $2,600 |
| W-2, Santa Fe River Outfitters (Bastien) | box 1 $22,000, box 2 $700 |
| 1099-R, Suwannee Retirement Services (Bastien) | box 1 and 2a $4,000, box 4 $400, code 1 |
| 1099-INT, Paynes Prairie Credit Union (joint) | box 1 $300 |
| Educator expenses (Erian) | $300 |
| Estimated payments (joint) | $500 on 06/16/2025, $500 on 09/15/2025 |
| Injured spouse answers | Erian; Bastien's debt only; Florida; shares in `facts.ts` |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 1040 line 9 | 68,000 wages + 300 interest + 4,000 pension | 72,300 |
| 1040 line 11a | 72,300 − 300 educator expenses | 72,000 |
| 1040 line 15 | 72,000 − 31,500 | 40,500 |
| 1040 line 16, 19 | tax table 40,500–40,550 MFJ; the child tax credit is limited to the tax | 4,386; 4,386 |
| 1040 line 23, 24 | 10% of the $4,000 early distribution | 400 |
| 1040 line 28 | 4,400 − 4,386 | 14 |
| 8379 lines 2–6 | joint; Bastien's debt only; Erian not obligated; no community property state; Erian had withholding | Yes, Yes, No, No, Yes |
| 8379 line 13a (a), (b), (c) | 1040 line 1a; Erian's W-2 box 1; the rest | 68,000; 46,000; 22,000 |
| 8379 line 13b | 1040 line 9 − line 1a; half the interest | 4,300; 150; 4,150 |
| 8379 line 14 | 1040 line 10; her educator expenses | 300; 300; 0 |
| 8379 line 15 | 1040 line 12e; half the basic $31,500 each (no age or blind box) | 31,500; 15,750; 15,750 |
| 8379 line 16 | 1040 lines 19 + 20; one child each | 4,386; 2,193; 2,193 |
| 8379 line 17 | 1040 line 28; one child each | 14; 7; 7 |
| 8379 line 18 | Schedule 2 line 21; Bastien's 1099-R | 400; 0; 400 |
| 8379 line 19 | 1040 line 25d; Erian's W-2 box 2 | 3,700; 2,600; 1,100 |
| 8379 line 20 | 1040 line 26; half by agreement | 1,000; 500; 500 |
