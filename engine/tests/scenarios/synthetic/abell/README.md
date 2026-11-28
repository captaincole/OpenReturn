# abell — a renewable fuel producer with two facilities (synthetic)

Abell Fenwright is single and lives in Hereford, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form and its instructions, then locked (`verification: "unverified"`).

Abell runs a renewable fuel business as a sole proprietorship (Schedule C). It makes fuel at two facilities:

- A biorefinery placed in service in February 2025. It meets the prevailing wage and apprenticeship rules (line 7 Yes). The producer registration letter is dated March 14, 2025, so the 20,000 gallons of renewable diesel made before it earn nothing. One fuel uses a provisional emissions rate (line 6). One SAF lot has no unrelated party certification, and one blended diesel is above 50 kg: neither takes a row.
- A biogas upgrading unit on a dairy, owned by the dairy (line 2b). It was placed in service in 2023 and does not meet the wage rules (line 7 No), so it takes the base amount. Abell sold $4,000 of its credit for cash under section 6418 (line 1, Form 3800 column (f)).

Abell is also a limited partner in a fuel blending partnership. Its Schedule K-1 (Form 1065) reports business income and a clean fuel production credit (box 15 code X). He takes the standard deduction. The return is federal only: Texas has no income tax.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 7218 (three copies) and 8995-A.

Simplifications: feedstock is a Part V expense, not cost of goods sold. The K-1 prints no box 14 and no section 199A statement. The expected values check copy 1 of Form 7218; the hand check below covers all three.

## Inputs

| Input | Amounts |
| --- | --- |
| Schedule C, Fenwright Renewable Fuels | receipts $612,000; wages $128,000; insurance $18,400; repairs $26,300; supplies $41,200; utilities $52,700; feedstock $164,500 |
| Biorefinery, renewable diesel (used cooking oil, 22 kg) | 60,000 gallons, 20,000 before registration |
| Biorefinery, biodiesel (soybean oil, 37 kg) | 30,000 gallons |
| Biorefinery, HEFA jet fuel SAF (used cooking oil, 24 kg), certified | 15,000 gallons |
| Biorefinery, renewable diesel (camelina oil, PER 18 kg) | 4,321 gallons |
| Biorefinery, HEFA jet fuel SAF (soybean oil, 31 kg), not certified | 2,500 gallons |
| Biorefinery, blended diesel (58 kg) | 8,000 gallons |
| Digester, renewable natural gas (dairy manure, 10 kg) | 50,000 gallon equivalents |
| Digester, renewable natural gas (landfill gas, 30 kg) | 20,000 gallon equivalents |
| Digester, credit sold | $4,000 |
| K-1, Panhandle Fuel Partners LP (00-0007220) | box 1 $21,000; box 15 X $3,200 |

## Documents

The K-1 is a PDF in `docs/`, made by `generate-docs.ts` from the existing Schedule K-1 (Form 1065) generator. The facility facts come from the production records, the registration letters and the emissions rate table: no information return prints them.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 7218 copy 1 row 1 | (50 − 22) / 50 = 0.56 → 0.6; 60,000 − 20,000; $1.00 × 1.0611 → $1.06; 0.6 × 40,000 × 1.06 | 0.6; 40,000; 1.06; 25,440 |
| row 2 | (50 − 37) / 50 = 0.26 → 0.3; 0.3 × 30,000 × 1.06 | 9,540 |
| row 3 | (50 − 24) / 50 = 0.52 → 0.5; $1.75 × 1.0611 = 1.8569 → $1.86; 0.5 × 15,000 × 1.86 | 13,950 |
| row 4 | (50 − 18) / 50 = 0.64 → 0.6; 0.6 × 4,321 × 1.06 = 2,748.16 | 2,748 |
| line 25, Part II lines 1 and 3 | 25,440 + 9,540 + 13,950 + 2,748.16, rounded once | 51,678 |
| 7218 copy 2 rows 1 and 2 | 0.8 × 50,000 × 0.21; 0.4 × 20,000 × 0.21 | 8,400; 1,680 |
| copy 2 line 25, lines 1 and 3 | 8,400 + 1,680 | 10,080 |
| 7218 copy 3 lines 2 and 3 | K-1 box 15 code X | 3,200 |
| 3800 Part III line 1q (e), (f), (g) | 51,678 + 10,080 + 3,200; the sale; (e) + (f) | 64,958; −4,000; 60,958 |
| Schedule C line 31 | 612,000 − 431,100 | 180,900 |
| 1040 line 11a, 15 | 180,900 + 21,000 − 12,781; less 15,750 and 33,624 QBI | 189,119; 139,745 |
| 1040 line 16 | 17,651 + 24% × (139,745 − 103,350) | 26,386 |
| 6251 line 9 | 26% × (155,495 − 88,100) | 17,523 |
| 3800 line 16, 38 | 26,386 − 17,523 | 8,863 |
| Schedule 3 line 6a | 3800 line 38 | 8,863 |

Part V lists the K-1's line 1q row before the two facilities, as for every form added after Form 8820 (`3800/sources.ts`), and uses the limit in that order: the K-1 takes $3,200 and Hereford $5,663 (8,863 − 3,200), so Hereford carries $46,015 forward and Cedar Hollow $6,080.
