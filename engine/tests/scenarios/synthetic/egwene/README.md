# egwene — a made-up worker paid as a contractor (synthetic)

Egwene Marchetti is single and lives in Waco, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

She is a practice manager with a W-2. Four firms paid her as a contractor when she was an employee, so she files Form 8919 with one firm for each reason code:

- H: her own clinic paid a signing bonus on a 1099-NEC.
- A: a logistics firm, with a Form SS-8 determination letter.
- G: a tutor who paid her weekly; she filed Form SS-8 and has no reply.
- C: an events firm, with an IRS letter; she does not know its EIN.

She also has a small photography business (Schedule C), so Schedule SE files. Her W-2 and Form 8919 line 10 fill the social security wage base, so Schedule SE line 10 is 0. Her Medicare wages and self-employment income pass $200,000, so Form 8959 files. The return is federal only: Texas has no income tax. There are no input documents: the facts are the boxes and her answers.

Forms that file: Form 1040, Schedules 1, 2, C and SE, Form 8919, Form 8959, Form 8995.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Brazos Valley Clinic | box 1, 3, 5 $140,000; box 2 $19,500 |
| 1099-NEC, Brazos Valley Clinic | box 1 $7,500.25 (named by the code H firm) |
| 1099-NEC, Pecan Hollow Logistics | box 1 $31,200 (named by the code A firm) |
| Form 8919 firms | H $7,500.25; A $31,200 (08/14/2025); G $9,800.40; C $4,350 (03/03/2025) |
| Business, Marchetti Photo | receipts $15,000, supplies $3,000 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8919 lines 1–4 (f) | each firm, whole dollars | 7,500; 31,200; 9,800; 4,350 |
| 8919 line 6 | 52,850.65, cents kept, total rounded | 52,851 |
| 8919 line 8 | W-2 boxes 3 and 7 | 140,000 |
| 8919 line 9 | 176,100 − 140,000 | 36,100 |
| 8919 line 10 | smaller of 52,851 and 36,100 | 36,100 |
| 8919 line 11 | 36,100 × 6.2% = 2,238.20 | 2,238 |
| 8919 line 12 | 52,851 × 1.45% = 766.34 | 766 |
| 8919 line 13 | 2,238 + 766 | 3,004 |
| 1040 line 1g | 8919 line 6 | 52,851 |
| 1040 line 1z | 140,000 + 52,851 | 192,851 |
| Schedule SE lines 2, 4a | 12,000; × 92.35% | 12,000; 11,082 |
| Schedule SE line 8c | 8919 line 10 | 36,100 |
| Schedule SE line 8d, 9, 10 | 140,000 + 36,100; 176,100 − 176,100; 0 | 176,100; 0; 0 |
| Schedule SE line 11, 12, 13 | 11,082 × 2.9% = 321.38; half = 160.50 | 321; 321; 161 |
| 8959 line 3, 4 | 8919 line 6; + 140,000 | 52,851; 192,851 |
| 8959 lines 6, 7 | under $200,000 | 0; 0 |
| 8959 lines 11, 12, 13 | 200,000 − 192,851; 11,082 − 7,149; × 0.9% | 7,149; 3,933; 35 |
| Schedule 2 lines 4, 6, 7, 11, 21 | SE tax; 8919 line 13; 6; 8959; total | 321; 3,004; 3,004; 35; 3,360 |
| 1040 line 9, 10, 11a | 192,851 + 12,000; SE deduction | 204,851; 161; 204,690 |
| 1040 line 13a | QBI: (12,000 − 161) × 20% | 2,368 |
| 1040 line 15, 16 | 204,690 − 15,750 − 2,368; single schedule | 186,572; 37,624 |
| 1040 line 23, 24 | Schedule 2 line 21; 37,624 + 3,360 | 3,360; 40,984 |
| 1040 line 37 | 40,984 − 19,500 | 21,484 |
