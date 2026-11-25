# pevara — a made-up couple with two home chargers (synthetic)

Pevara and Teodor Halloran are married and file jointly. They live in Austin, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Each spouse has one W-2. They have a world index fund that paid $95 of foreign tax (the election, no Form 1116), and a daughter of 9 (the child tax credit). In 2025 they put two electric vehicle chargers at their home, each with one charging port: one in the garage, one on the driveway. The home is in an eligible census tract, and they use the chargers only for their own cars. They take the standard deduction. The return is federal only: Texas has no income tax.

The scenario renders a filled Form 8911 with Part II. The garage charger reaches the $1,000 limit for one item. Lines 6a and 6b take the foreign tax credit and the child tax credit off the tax first. Line 8 is the tentative minimum tax from Form 6251, which files because the credit is claimed. The credit reaches Schedule 3 line 6j. Part I is blank: neither charger has business use, so Form 3800, which the engine does not compute, stays off the return. The unit tests cover Part I and the stops (`tests/unit/federal/8911/`).

Forms checked: Form 8911, Form 6251, Schedule 3, Schedule 2, Schedule 8812, Form 1040. Schedule 2 files with Form 6251 and holds only zeros.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Colorado River Health Partners (Pevara) | box 1 $141,000, box 2 $19,800 |
| W-2, Balcones Survey Group (Teodor) | box 1 $84,000, box 2 $9,100 |
| 1099-DIV, Hill Country World Index Fund | box 1a $1,300, box 1b $1,100, box 7 $95 |
| Installer's invoice, garage charger (`docs/01-invoice-garage-charger.pdf`) | $4,150, working 2025-04-11 |
| Installer's invoice, driveway charger (`docs/02-invoice-driveway-charger.pdf`) | $2,080, working 2025-09-26 |
| Answers, both chargers | eligible census tract 48453002424, main home, 0% business use |

The two invoices are made by `generate-docs.ts` from the values in `facts.ts` (`documents/refuelingPropertyInvoice.ts`, the first document of its type).

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| Schedule A garage, lines 8, 18 | cost; line 10 is 0 | 4,150 |
| Schedule A garage, lines 19, 21 | 4,150 × 30% = 1,245; the $1,000 limit | 1,245; 1,000 |
| Schedule A driveway, lines 8, 18, 19, 21 | 2,080 × 30% | 2,080; 624 |
| 8911 item A | two Schedules A with a credit | 2 |
| 8911 lines 1–3 | no business use | blank |
| 8911 line 4 | 1,000 + 624 | 1,624 |
| 8911 line 5 | 1040 line 16 + Schedule 2 line 1z (none) | 32,607 |
| 8911 line 6a | Schedule 3 line 1, the election | 95 |
| 8911 line 6b | 1040 line 19; Schedule 3 lines 2–5 and 7 have none | 2,200 |
| 8911 line 6c | 95 + 2,200 | 2,295 |
| 8911 line 7 | 32,607 − 2,295 | 30,312 |
| 8911 line 8 | 6251 line 7 23,097 − the $95 credit (rule-decisions row A1) | 23,002 |
| 8911 line 9 | 30,312 − 23,002 | 7,310 |
| 8911 line 10 | smaller of 1,624 and 7,310 | 1,624 |
| 6251 lines 4, 5, 6 | 194,800 + 31,500; MFJ exemption; 226,300 − 137,000 | 226,300; 137,000; 89,300 |
| 6251 line 7 | Part III: 88,200 × 26% = 22,932; 1,100 × 15% = 165 | 23,097 |
| 6251 line 10, 11 | 32,607 − 95; no AMT | 32,512; 0 |
| Schedule 3 lines 1, 6j, 7, 8 | 95; 8911 line 10; 1,624; 95 + 1,624 | 95; 1,624; 1,624; 1,719 |
| Schedule 8812 lines 5, 14 | one child × 2,200 | 2,200 |
| 1040 lines 1z, 3a, 3b, 9, 11a | 141,000 + 84,000; the fund; 225,000 + 1,300 | 225,000; 1,100; 1,300; 226,300 |
| 1040 lines 12e, 15 | joint standard deduction; 226,300 − 31,500 | 31,500; 194,800 |
| 1040 line 16 | QDCG worksheet: 193,700 at the 2025 joint rates = 32,442, plus 1,100 × 15% | 32,607 |
| 1040 lines 19, 20, 21 | Schedule 8812; Schedule 3 line 8; 2,200 + 1,719 | 2,200; 1,719; 3,919 |
| 1040 lines 22, 24 | 32,607 − 3,919 | 28,688 |
| 1040 lines 25a, 33, 34, 35a | 19,800 + 9,100 withheld; 28,900 − 28,688 | 28,900; 212 |
