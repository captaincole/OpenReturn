# ellorien — a divorced parent and three children (synthetic)

Ellorien Tarvale is divorced from Davin Tarvale and files as head of household. She lives in Henderson, Nevada, so the return is federal only. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

They have three children, and each one shows a different branch of Form 8332:

- **Mira (9)** lives with Ellorien. Ellorien released the 2025 claim to Davin. Mira is not on the Dependents table and gets no child tax credit. She is still Ellorien's head of household child (her name goes in the 1040 entry space) and an EIC child.
- **Tobin (12)** lives with Davin. Davin signed Form 8332 for 2025, 2026 and 2027. Ellorien claims Tobin and the child tax credit, and attaches the form (copy 1). Tobin is not an EIC child: he did not live with her more than half the year.
- **Senna (7)** lives with Ellorien. An earlier release to Davin covered 2025, but Ellorien revoked it in June 2024 for all future years. The revocation is effective for 2025, so she claims Senna and attaches the Part III copy (copy 2).

Forms that file: Form 1040, Schedules 8812 and EIC, Form 8332 (two copies). The published examples (about years) and the limit cases are unit tests (`tests/unit/federal/8332/`).

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Desert Willow Family Clinic | box 1 $38,000, box 2 $1,200 |
| Form 8332 from Davin (document) | Part I 2025; Part II 2026, 2027; his SSN 400-00-8333 |
| Ellorien's Part III (answer) | all future years, given to Davin in 2024 |
| Dependents (answers) | Mira 12 months, released; Tobin 4 months, release received; Senna 12 months |
| Head of household qualifying person (answer) | Mira |

## Input document

`docs/01-form-8332-tobin-tarvale.pdf` is the form Davin signed, from `generate-docs.ts` (`tests/scenarios/documents/form8332.ts`), with the same fact object `facts.ts` uses. The W-2 has no PDF: its fact is the boxes as it would print them.

### Compared with real examples

- [Form 8332 (Rev. December 2025)](https://www.irs.gov/pub/irs-pdf/f8332.pdf), the official form: same header, Parts I to III, the signature, SSN and date line under each part, one child per form. Ours matches its labels.
- [Form 8332 (Rev. January 2006)](https://www.irs.gov/pub/irs-prior/f8332--2006.pdf): it took "Name(s) of child (or children)" and had no Part III. Ours follows the current revision: one child, with Part III.
- [Form 8332 generator (Jotform)](https://www.jotform.com/tax-form-generator/8332/): it asks for the noncustodial parent's name and SSN, then for each part the child's name, the year(s), the custodial parent's signature, SSN and date. Ours has the same entries. It has no field for the custodial parent's printed name, and neither does ours.

The signature is typed ("/s/ Davin Tarvale") and dated. Part III is blank on the copy Davin gave.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8332 copy 1 header | the noncustodial parent: Ellorien | Ellorien Tarvale, 400-00-8332 |
| 8332 copy 1 Part I | Tobin; 2025; Davin's SSN | Tobin Tarvale, 25, 400-00-8333 |
| 8332 copy 1 Part II | the future years Davin wrote | 2026 and 2027 |
| 8332 copy 1 Part III | no revocation on a release copy | blank |
| 8332 copy 2 header | the noncustodial parent: Davin | Davin Tarvale, 400-00-8333 |
| 8332 copy 2 Part III | Senna; all future years; Ellorien's SSN | Senna Tarvale, all future years, 400-00-8332 |
| 8332 copy 2 Parts I, II | a revocation copy fills Part III only | blank |
| 1040 HOH child's name | Mira is the qualifying person and not a dependent | Mira Tarvale |
| 1040 Dependents | Tobin (not lived with her), Senna (lived with her); both child tax credit | 2 rows |
| 1040 line 1a, 9, 11a | W-2 box 1 | 38,000 |
| 1040 line 12e | head of household standard deduction | 23,625 |
| 1040 line 15 | 38,000 − 23,625 | 14,375 |
| 1040 line 16 | tax table, 14,350–14,400, head of household | 1,438 |
| 8812 line 4, 5 | Tobin and Senna; 2 × 2,200 | 2; 4,400 |
| 8812 line 13, 14 | Credit Limit Worksheet A: line 18 tax | 1,438 |
| 8812 line 16a, 16b, 17 | 4,400 − 1,438; 2 × 1,700; smaller | 2,962; 3,400; 2,962 |
| 8812 line 18a, 19, 20 | 38,000; − 2,500; × 15% | 38,000; 35,500; 5,325 |
| 8812 line 27, 1040 line 28 | line 16b under 5,100: smaller of 17 and 20 | 2,962 |
| Schedule EIC | Mira and Senna, 12 months each | 2 children |
| 1040 line 27a | EIC table, 38,000–38,050, two children | 4,061 |
| 1040 line 19, 21, 22 | 8812 line 14; 1,438 − 1,438 | 1,438; 1,438; 0 |
| 1040 line 25a, 33, 34, 35a | 1,200 + 4,061 + 2,962 | 1,200; 8,223 |
