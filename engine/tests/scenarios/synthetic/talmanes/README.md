# talmanes — a joint return after two single returns, with a refund (synthetic)

Talmanes and Seren Ostrander married in March 2025 and file jointly. They live in Nashville, Tennessee. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Both work. Talmanes's employer withheld $17,600 from a stock vest in February; the rest of the withholding of both jobs came evenly, $3,200 a month, and $900 of Additional Medicare Tax in December. They earned $40,000 of bank interest. One estimated tax payment of $22,000 went in on January 15, 2026, so the return shows a refund. For 2024 each filed a single return: together $60,000 of tax and $330,000 of AGI. Seren became disabled in May 2025, so they ask to waive $40 of the penalty. The return is federal only: Tennessee has no income tax on wages or interest.

Form 2210 checks three boxes: B (a waiver of part of the penalty), D (withholding on the dates it was withheld is lower than four equal parts) and E (a joint return for 2025 but not for 2024, and line 8 is smaller than line 5). The penalty comes off the refund: Form 1040 line 35a is line 34 minus line 38.

Forms that file: Form 1040, Schedules B and 2, Forms 8959, 8960 and 2210.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Harpeth Data Systems (Talmanes) | box 1 $300,000, box 2 $50,000, box 5 $300,000, box 6 $5,250 |
| W-2, Belle Meade Pediatric Clinic (Seren) | box 1 $60,000, box 2 $6,000 |
| 1099-INT, Cumberland Federal Credit Union | box 1 $40,000 |
| Withholding by date (pay stubs) | 2/14 $17,600; 4/15 $11,200; 6/13 $6,400; 9/15 $9,600; 12/31 $12,100 |
| Estimated tax | 1/15/26 $22,000 |
| 2024 | tax $60,000 and AGI $330,000 (two single returns added) |
| Waiver | part, $40 |

No input documents have PDFs.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 2210 line 1 | Form 1040 line 22 | 74,134 |
| 2210 line 2 | Schedule 2 lines 11 ($990) and 12 ($1,520) | 2,510 |
| 2210 lines 3, 4, 5 | no refundable credits; 74,134 + 2,510; × 90% | 0; 76,644; 68,980 |
| 2210 lines 6, 7 | Form 1040 line 25d; 76,644 − 56,900 | 56,900; 19,744 |
| 2210 lines 8, 9 | 60,000 × 110% (2024 AGI over $150,000); smaller of 68,980 and 66,000 | 66,000; 66,000 |
| Box E | joint for 2025 only, and 66,000 is smaller than 68,980 | checked |
| 2210 line 10 | 66,000 × 25% | 16,500 each |
| 2210 line 11 (box D) | 17,600 + 11,200; 6,400; 9,600; 12,100 + 22,000 | 28,800; 6,400; 9,600; 34,100 |
| 2210 column (a) | line 18 = 28,800 − 16,500 | 12,300 |
| 2210 column (b) | line 13 = 6,400 + 12,300; line 18 = 18,700 − 16,500 | 18,700; 2,200 |
| 2210 column (c) | line 13 = 9,600 + 2,200; line 17 = 16,500 − 11,800 | 11,800; 4,700 |
| 2210 column (d) | line 14 = 4,700; line 15 = 34,100 − 4,700 | 4,700; 29,400 |
| Worksheet | 4,700 from 9/15 to the 12/31 withholding: 107 days × 7% ÷ 365 = 96.45 | 96 |
| Withholding in four equal parts | 14,225 a quarter: underpayments 2,275, 4,550, 6,825; penalty about 267 | higher, so box D |
| 2210 line 19 (box B) | 96 − 40 | 56 |
| 1040 lines 25d, 26, 33 | 56,000 + 900; 22,000; 56,900 + 22,000 | 56,900; 22,000; 78,900 |
| 1040 lines 24, 34 | 74,134 + 2,510; 78,900 − 76,644 | 76,644; 2,256 |
| 1040 line 38 | Form 2210 line 19 | 56 |
| 1040 line 35a | 2,256 − 56 (figuring-the-penalty::b01) | 2,200 |
