# dain — a reactor engineer claims both nuclear power production credits (synthetic)

Dain Thornvale is single and lives in Granbury, Texas. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 7213 and its instructions, then locked (`verification: "unverified"`). The return is federal only: Texas has no income tax.

Dain earns $400,000 of wages. His single-member LLC (Schedule C) owns two undivided reactor shares and sells their electricity:

- A 0.5 MW share of the 1,100 MW Brazos Bend advanced reactor, placed in service in 2024 (section 45J, Part I). The IRS allocated only 0.4 MW of facility limitation to the share.
- A share of the Pecos Valley station, placed in service in 1990 (section 45U, Part II). Its receipts include $30,000 of state ZEC payments that the credit does not reduce. He meets the prevailing wage requirements and sold $10,000 of the credit under section 6418.

He is also a general partner in Llano Isotope Partners LP. Its Schedule K-1 (Form 1065) reports only box 15 code A ($2,000, section 45U) and code B ($3,000, section 45J).

The return files three Forms 7213: one for each facility, and one for the K-1 credits ("Credit From Pass-Through Entities"). The golden PDF and `expected.ts` hold the first copy. The other two are checked by `tests/unit/federal/7213/form.test.ts`.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 7213, 8959 and 8995-A.

Simplifications: the facility facts are stated answers from the meter and sales records, the IRS acceptance letter and the NRC license, which no official form holds. The K-1 has no income boxes. The LLC pays no wages, so its QBI deduction is 0 above the threshold.

Documents: `docs/01-schedule-k1-llano-isotope-partners.pdf` (made by `generate-docs.ts`).

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 7213 (copy 1) Part I line 1 | the facility limitation in the letter | 0.4 MW |
| Part I line 2 | the share's nameplate capacity (rule-decisions A128) | 0.5 MW |
| Part I line 3 | 0.4 ÷ 0.5 | 80% |
| Part I line 4 | the share's kWh sold | 4,000,000 |
| Part I line 5a | 80% × 4,000,000 | 3,200,000 kWh |
| Part I line 5b | 3,200,000 × $0.018 | 57,600 |
| Part I line 6a | 0.4 ÷ 1,000 | 0.0004 MW |
| Part I line 6b | 0.0004 × $125,000,000 | 50,000 |
| Part I lines 7, 9 | the smaller of 57,600 and 50,000 | 50,000 |
| 7213 (copy 2) Part II line 1 | kWh sold | 6,000,000 |
| Part II line 3 | 6,000,000 × $0.003 | 18,000 |
| Part II lines 4, 5, 6 | receipts; ZEC payments; line 4 (the credit does not reduce the ZEC payments) | 210,000; 30,000; 210,000 |
| Part II line 7 | 6,000,000 × $0.026 (rule-decisions A127) | 156,000 |
| Part II line 8 | 210,000 − 156,000 | 54,000 |
| Part II line 9 | the smaller of 18,000 and 16% × 54,000 | 8,640 |
| Part II line 10 | 18,000 − 8,640 | 9,360 |
| Part II lines 11, 13 | 9,360 × 5 (prevailing wage) | 46,800 |
| 7213 (copy 3) Part I lines 8, 9 | K-1 box 15 code B | 3,000 |
| Part II lines 12, 13 | K-1 box 15 code A | 2,000 |
| Form 1040 line 16 | 2025 single rate schedule on 532,241 | 155,832 |
| Form 6251 line 7 | 28% × 459,891 − 4,782 | 123,987 |
| Form 3800 line 1cc, column (g) | 50,000 + 3,000 | 53,000 |
| Form 3800 line 1u, columns (e), (f), (g) | 46,800 + 2,000; the sale; 48,800 − 10,000 | 48,800; −10,000; 38,800 |
| Form 3800 line 13 | 25% × (155,832 − 25,000) | 32,708 |
| Form 3800 lines 16, 17, 38 | 155,832 − the greater of 32,708 and 123,987 | 31,845 |
| Schedule 3 line 6a; Form 1040 line 20 | Form 3800 line 38 | 31,845 |
| Form 1040 line 22 | 155,832 − 31,845 | 123,987 |
| Form 1040 line 24 | 123,987 + 7,064 (SE tax 4,017, Additional Medicare Tax 3,047) | 131,051 |
| Form 1040 line 37 | 131,051 − 121,750 | 9,301 |

The rest of the 1cc and 1u credits ($59,955) carries forward: Form 3800 allows the 1cc credit first, in the order of use. Part V lists each line's K-1 row before the facility's row, as for every form added after Form 8820 (`3800/sources.ts`), and uses the limit in that order: line 3 (the 1cc K-1) takes $3,000 and line 4 (the facility) $28,845, so the facility carries $21,155 forward, and lines 1 and 2 (1u) carry $2,000 and $36,800.
