# thaddeus — a made-up couple with MSAs and long-term care (synthetic)

Thaddeus and Marguerite Brightwater are married and file jointly. They live in Tacoma, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Thaddeus works for a small employer with a self-only HDHP and contributes to his Archer MSA. Both spouses take Archer MSA distributions. Marguerite is 68, on Medicare, and takes Medicare Advantage MSA distributions. She is also the policyholder of a long-term care contract and a life policy on her mother, who is chronically ill. The return is federal only: Washington has no income tax.

The scenario fills every section of Form 8853 and checks that its results reach Schedule 1 lines 8e and 23, Schedule 2 lines 17e and 17f, and Form 1040. The published examples that check the rules are unit tests (`tests/unit/federal/8853/`).

Forms that file: Form 1040, Schedule 1, Schedule 1-A, Schedule 2, Form 8853.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Puget Cedar Joinery | box 1 $142,000, box 2 $21,000; no box 12 code R |
| Archer MSA coverage | self-only HDHP all year, deductible $3,600 |
| Archer MSA answers | own contributions $2,200; compensation $142,000; rolled over $1,000; medical $3,950; Marguerite's taxable part (past 65) $1,200 |
| 1099-SA, Archer MSA | Thaddeus $4,850 (code 1); Marguerite $3,000 (code 1) |
| 1099-SA, Medicare Advantage MSA | Marguerite $5,200 (code 1) and $1,800 (code 3) |
| Medicare Advantage answers | medical $4,100; part after disability $800; value 12/31/2024 $4,000; deductible 1/1/2025 $6,000 |
| 1099-LTC, Mount Rainier Mutual | box 1 $48,000, per diem, qualified, chronically ill |
| 1099-LTC, Olympic Life | box 2 $6,000, per diem, chronically ill |
| LTC answers | no other payees; one 120-day period; costs $30,000; reimbursements $6,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8853 header SSN | both spouses have MSAs: the first SSN | 400-00-8853 |
| 8853 line 1 | no code R | blank |
| 8853 line 2 | own contributions | 2,200 |
| 8853 line 3 | 65% × 3,600 × 12 / 12 | 2,340 |
| 8853 line 4 | compensation | 142,000 |
| 8853 line 5 | smallest of 2,200, 2,340, 142,000 | 2,200 |
| 8853 line 6a | 4,850 + 3,000 | 7,850 |
| 8853 line 6b, 6c | rollover; 7,850 − 1,000 | 1,000; 6,850 |
| 8853 line 7, 8 | medical; 6,850 − 3,950 | 3,950; 2,900 |
| 8853 line 9a, 9b | 1,200 excepted; 20% × 1,700 | checked; 340 |
| 8853 line 10, 11, 12 | 5,200 + 1,800; medical; 7,000 − 4,100 | 7,000; 4,100; 2,900 |
| 8853 line 13a | 800 excepted (disability) | checked |
| 8853 line 13b | worksheet: 1) 2,100 2) 4,000 3) 6,000 4) 3,600 5) 400 6) 1,700 7) 850 | 850 |
| 8853 page 2 header | policyholder Marguerite | 400-00-8854 |
| 8853 line 15, 16 | no other payee; box 5 chronically ill | No; No |
| 8853 line 17, 18, 19 | per diem box 1; qualified; box 2 chronically ill | 48,000; 48,000; 6,000 |
| 8853 line 20 | 48,000 + 6,000 | 54,000 |
| 8853 line 21 | $420 × 120 | 50,400 |
| 8853 line 22, 23 | costs; larger of 50,400 and 30,000 | 30,000; 50,400 |
| 8853 line 24, 25 | reimbursements; 50,400 − 6,000 | 6,000; 44,400 |
| 8853 line 26 | 54,000 − 44,400 | 9,600 |
| Schedule 1 line 8e, 9, 10 | 2,900 + 2,900 + 9,600 | 15,400 |
| Schedule 1 line 23, 26 | 8853 line 5 | 2,200 |
| Schedule 2 line 17e, 17f | 8853 lines 9b, 13b | 340; 850 |
| Schedule 2 line 18, 21 | 340 + 850 | 1,190 |
| 1040 line 8, 9 | 142,000 + 15,400 | 15,400; 157,400 |
| 1040 line 10, 11a | 157,400 − 2,200 | 2,200; 155,200 |
| 1040 line 12e | joint standard 31,500 + 1,600 (Marguerite 65+) | 33,100 |
| 1040 line 13b | Schedule 1-A: 6,000 − 6% × (155,200 − 150,000) | 5,688 |
| 1040 line 15 | 155,200 − 33,100 − 5,688 | 116,412 |
| 1040 line 16 | 22% × 116,412 − 10,172 (Tax Computation Worksheet) | 15,439 |
| 1040 line 23, 24 | Schedule 2 line 21; 15,439 + 1,190 | 1,190; 16,629 |
| 1040 line 34 | 21,000 − 16,629 | 4,371 |
