# cowin — a sensor lab claims the regular research credit (synthetic)

Cowin Marrowdale is single and lives in Seattle, Washington, all year. He runs a sensor laboratory (Schedule C) and materially participates in it. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against Form 6765 and its instructions, then locked (`verification: "unverified"`). The return is federal only: Washington has no income tax.

He is also a general partner in an optics partnership. Its Schedule K-1 (Form 1065) reports ordinary income and a research credit (box 15, code M). He takes the standard deduction and paid $192,000 of estimated tax.

The scenario covers:

- Form 6765 Section A, the regular credit: energy consortia payments (line 1), a start-up's fixed-base percentage in its 7th year (line 6), and line 13 at 20% with no section 280C election.
- Section C: line 28, the K-1 credit on line 29, line 30.
- Section E: lines 37, 39 and 40; line 41 is No.
- Section F from Section G, which he fills although it is optional for 2025: three business components and the aggregate entry, with wages, supplies, computer rental and contract research at 100%, 75% and 65%.
- Schedule C line 26: the wages less line 28 (decision A103).
- Form 3800 Part III line 4i (the lab, an eligible small business) and line 1c (the partnership, which is not), and Schedule 3 line 6a.

Section B and Section D are blank: `dena` covers them.

Simplifications: the research is a stated answer from the lab's books, which no official form holds. The attributable taxable income of the lab and of the partnership (Form 3800's research credit limitation) are his stated answers. The K-1 has no box 14 amount.

Forms that file: Form 1040, Schedules 1, 2, 3, C, E and SE, Forms 3800, 6251, 6765, 8959 and 8995-A.

## Input documents

- `docs/01-schedule-k1-larkspur-optics-partners.pdf`: Schedule K-1 (Form 1065), made by `generate-docs.ts` with the existing K-1 generator. It is not a new type of document.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 6765 line 48 | 333,000 + 30,000 + 6,000 + 49,000 | 418,000 |
| 6765 line 45 | 40,000 × 65% + 20,000 × 75% + 8,000 × 100% | 49,000 |
| 6765 line 6 | (240,000 + 290,000) ÷ (2,200,000 + 2,400,000) ÷ 3, four places | 3.84% |
| 6765 line 7 | average of 1.8, 2.0, 2.2 and 2.4 million | 2,100,000 |
| 6765 lines 8 to 11 | 80,640; 337,360; 209,000; smaller | 209,000 |
| 6765 lines 12, 13 | 5,000 + 209,000; × 20% | 214,000 / 42,800 |
| 6765 lines 28 to 30 | 42,800 + 3,000 | 45,800 |
| Schedule C line 26 | 1,500,000 − 42,800 | 1,457,200 |
| Schedule C line 31 | 2,600,000 − 1,933,200 | 666,800 |
| Form 1040 line 15 | 690,800 − 19,847 − 15,750 − 131,041 | 524,162 |
| Form 1040 line 16 | 2025 rate schedule, single | 153,004 |
| Form 3800 line 4i, line 1c | the research limits (140,113 and 5,254) do not bind | 42,800 / 3,000 |
| Form 3800 line 38, Schedule 3 line 6a | the tax limits (31,279 and 121,003) do not bind | 45,800 |
| Form 1040 line 34 | 192,000 − (153,004 − 45,800 + 43,436) | 41,360 |
