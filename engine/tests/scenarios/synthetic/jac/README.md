# jac — a made-up employer with an on-site childcare center (synthetic)

Jac Mardell is single and lives in Round Rock, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Jac owns a commercial landscaping business (Schedule C). In 2025 the business built a childcare center for its employees' children and placed it in service in June. It paid the center's teachers and bought its supplies. It also bought infant care slots at a licensed center and paid a childcare referral service. Jac is a general partner in a staffing firm. Its Schedule K-1 (Form 1065) reports business income in box 1 and the same credit in box 15 code AH. Jac takes the standard deduction and paid four estimated tax payments. The return is federal only: Texas has no income tax.

The scenario fills lines 1 to 7 of Form 8882:

- Line 1 adds the building, the teachers' wages, the supplies and the infant care contract. Line 3 is the referral service.
- Line 5 is the K-1 credit. Line 7 is line 6, under $150,000, and goes to Form 3800 Part III line 1k.
- Each expenditure's part of the own credit (lines 2 and 4) comes off where the business has it: the building's basis on Form 4562, and Schedule C lines 14, 22, 26 and 48 (27b).
- Lines 8 and 9 are for estates and trusts, so they are blank.

The credit is not a specified credit. Form 3800 limits it by the tentative minimum tax (Form 6251), so $41,209 reaches Schedule 3 line 6a and the rest carries forward.

The expenditures are stated answers from the business's books: no information return reports them. The K-1 prints no box 14 and no section 199A statement, so the partnership adds no self-employment tax and no QBI.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 4562, 6251, 8959, 8995-A, 3800 and 8882.

## Inputs

| Input | Amounts |
| --- | --- |
| Business (Schedule C), Mardell Grounds Co. | receipts $2,100,000; wages $620,000; supplies $140,000; employee benefit programs $60,000; Part V referral service $6,000; other expenses $258,000; prior-year depreciation $18,000 |
| Childcare center building (2025 asset) | cost $160,000, nonresidential real property, placed in service 2025-06-16 |
| Childcare expenditures | building $160,000; teachers' wages $52,000 (in wages); supplies $9,000 (in supplies); infant care slots $30,000 (in employee benefit programs); referral service $6,000 (Part V) |
| K-1, Hill Country Staffing Partners LLC (00-0008882) | box 1 $40,000; box 15 AH $3,500 |
| Estimated tax payments | 4 × $70,000 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The childcare expenditures have no document.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8882 line 1 | 160,000 + 52,000 + 9,000 + 30,000 | 251,000 |
| 8882 line 2 | 251,000 × 25% | 62,750 |
| 8882 line 3 | referral service | 6,000 |
| 8882 line 4 | 6,000 × 10% | 600 |
| 8882 line 5 | K-1 code AH | 3,500 |
| 8882 line 6, 7 | 62,750 + 600 + 3,500, under $150,000 | 66,850 |
| Shares of 63,350 | building 40,000; wages 13,000; supplies 2,250; infant care 7,500; referral 600 | 63,350 |
| Form 4562 line 19j basis | 160,000 − 40,000 | 120,000 |
| Form 4562 line 19j, 22 | 39-year SL, mid-month June; plus 18,000 | 1,667; 19,667 |
| Schedule C lines 14, 22, 26, 48 | 60,000 − 7,500; 140,000 − 2,250; 620,000 − 13,000; 6,000 − 600 | 52,500; 137,750; 607,000; 5,400 |
| Schedule C line 28, 31 | expenses; 2,100,000 − 1,080,317 | 1,080,317; 1,019,683 |
| Schedule SE line 4a, 12 | 1,019,683 × 0.9235; 21,836 + 27,309 | 941,677; 49,145 |
| Schedule 1 line 10, 1040 line 11a | 1,019,683 + 40,000; less 24,573 | 1,059,683; 1,035,110 |
| 1040 line 13a | Form 8995-A: 20% × (1,019,683 − 24,573), under 50% of W-2 wages and 20% of taxable income before QBI | 199,022 |
| 1040 line 15, 16 | 1,035,110 − 15,750 − 199,022; 37% bracket | 820,338; 260,545 |
| Form 6251 line 9 | 26% × 239,100 + 28% × (800,423 − 239,100) | 219,336 |
| Form 3800 line 1k (e) | own 63,350 + K-1 3,500 | 66,850 |
| Form 3800 line 16, 17, 38 | 260,545 − greater of 219,336 and 58,886 | 41,209 |
| Schedule 3 line 6a, 1040 line 20 | Form 3800 line 38 | 41,209 |
| 1040 line 22, 24 | 260,545 − 41,209; plus 49,145 + 6,675 | 219,336; 275,156 |
| 1040 line 34, 35a | 280,000 − 275,156 | 4,844 |
