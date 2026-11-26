# Form 8958 — open questions

Form 8958 lists the community and separate items of a separate return, and how each divides between the person on the return and the spouse or registered domestic partner (RDP). The engine figures each split from the item's answers (`lines.ts`). The form is a statement: no other form reads it.

The items keep their first numbers, so "doubt 3" below and in other notes still points to the same item.

## Two texts conflict

- **2. The odd dollar.** Decided: row A49 of `docs/rule-decisions.md` and the `DECISION` comment in `lines.ts`. Column C is column A less column B. At most $1, on the spouse's column.

## Should we do this now

- **1. Which column is the filer.** Both column headings read "Allocated to Spouse or RDP" (`irs-8958-form-2025::sec::face-page-1::b01`). No text says which is the filer. The header names "Your" first and "Spouse's or partner's" second, so column B is the filer and column C the spouse or RDP. No dollars change. Done.

- **3. RDP self-employment tax.** "RDPs split self-employment income from sole proprietorships and partnerships for self-employment tax purposes" (`irs-8958-form-2025::sec::credits-taxes-and-payments::b01`). Each RDP figures the tax on his or her half. The engine halves the stated line 10 total. That is exact when both halves fall under the same rates (both RDPs under the social security wage base). When they do not, state two line 10 items, one for each RDP, with basis `separate`. Default: halves. Changes dollars only in that case. Not now: a per-RDP tax needs each RDP's other wages, which a separate return does not hold, and the two-item answer already gives the exact rows.

- **4. Income from separate property.** Pub. 555 names the states that treat it as community income (`irs-pub-555-2025::sec::in-idaho-louisiana-texas-and-wisconsin-in::b15`). It speaks of "Dividends, interest, and rents" (`::b09`) and a separate property partnership (`::b14`). A gain on separate property is separate (`::b10`). The engine applies the state rule to lines 2, 3 and 8 only. An item on line 12 that is income from separate property needs its basis stated as `community` or `separate`. No dollars change for the lines the rule names. Done.

- **5. Withholding on other items.** Pub. 555: "Report the credit for federal income tax withheld on community wages in the same manner as your wages" (`irs-pub-555-2025::sec::credits-taxes-and-payments::b03`). It names wages only. The engine divides the withholding of any item (a pension, interest) as the item divides. Own reading; it changes dollars only for a part-community or separate item with withholding. Done.

- **6. Living apart all year: related deductions.** "Treat income and related deductions from a trade or business that isn't a partnership as those of the spouse carrying on the trade or business" (`irs-pub-555-2025::sec::community-property-laws::b06`). Line 12 deductions follow their stated basis; the engine does not tie a deduction to a business. State such a deduction as `separate` with its owner. Not now: a link from a deduction to its business is a new field on every item, and the stated basis gives the same row.

- **7. Joint estimated tax.** "Either of you can claim all of the estimated tax paid, or you may divide it between you in any way that you agree upon" (`irs-pub-555-2025::sec::credits-taxes-and-payments::b03`). The split is the couple's agreement, not an engine choice. With no agreement the engine uses the Pub. 555 ratio (`::b04`) with the tax on each separate return as stated in the item. It does not read this return's Form 1040 line 24. No dollars change when the stated tax matches line 24. Not now: the spouse's tax must be stated in any case, and the rows are built in the resolver, before any line of the return is computed.

- **8. Line 9 from line 10.** The deductible part is half the tax (Schedule SE line 13, `irs-1040sse-face-2025::sec::face-part-i::b03`) and "is split only when the self-employment tax is split" (`irs-8958-form-2025::sec::identifying-income-and-deductions::b03`). The engine fills line 9 from the line 10 rows, so no item names line 9. No dollars change. Done.

- **10. Who files.** The form files from facts only when the return is separate and has at least one item. A married person filing separately in a community property state with no item recorded is not asked: whether there are items is Cade's question. The domicile is its own fact, not the home address state (Pub. 555: "the laws of the state in which you are domiciled govern", `irs-pub-555-2025::sec::community-or-separate::b01`). Done.

- **11. The RDP's name and SSN.** The form names the "Spouse's or partner's" name and SSN. An RDP's partner uses the spouse identity facts (`SPOUSE_KEYS`). Form 1040 prints the spouse only on a joint or separate married return, so a single RDP's Form 1040 does not show the partner. Done.

- **12. Line 5 for a married sole proprietor.** Sole proprietorship income that is community income splits evenly (`irs-8958-form-2025::sec::identifying-income-and-deductions::b01`). For spouses, "self-employment tax is imposed on the spouse carrying on the trade or business" (`::credits-taxes-and-payments::b01`). Line 5 shows the income-tax split (half each); only lines 9 and 10 follow the self-employment tax rule. A reader who puts all of line 5 in the owner's column moves half the profit ($20,000 on a $40,000 business). Default: half each. The blind fill read it the same way. Done.

- **13. Withholding on a W-2 that spans the wedding date.** The W-2 shows one withholding amount for the year. The engine divides it as the wages divide (with $15,000 of $60,000 earned before the marriage, a quarter of the withholding is the filer's separate credit). Withholding by pay period could differ from that ratio. Default: the wage ratio; a different split needs two items, one per period. The blind fill read it the same way. Done.

- **14. Separate property income of spouses living apart.** In Idaho, Louisiana, Texas and Wisconsin, income from separate property is community income (`irs-pub-555-2025::sec::in-idaho-louisiana-texas-and-wisconsin-in::b15`). When the living-apart rules apply, "Treat income from the separate property of one spouse as the income of that spouse" (`irs-pub-555-2025::sec::community-property-laws::b06`). The engine applies the living-apart rule first, as the George and Sharon example does (`irs-pub-555-2025::sec::george-sharon::b01`): $1,000 of dividends stays with the owner, not $500 each. The blind fill read it the same way. Done.

- **15. A married filer who is not married filing separately.** A married person can file as head of household "under rules for married taxpayers living apart" and still "must include" the spouse's community earnings "in your gross income" (`irs-pub-555-2025::sec::credits-taxes-and-payments::b04`–`b05`). A person divorced during the year is taxed on "half the community income for the part of the year before the community ends" (`irs-pub-555-2025::sec::end-of-the-community::b03`). Both are spouses, not RDPs: all nine states apply, the spouse's self-employment tax rule applies and so can the living-apart rules. Done (tax review, 2026-11-26): a head of household filer with a 1040 lived-apart answer, or any single or head of household filer with the fact `community_property.married_during_year`, is a spouse. Without either, a single or head of household filer is still an RDP. Whether a single filer was married during the year is Cade's question; the engine does not ask it.

## Pattern change

- **9. More items than rows.** "If you need more room, attach a statement" (`irs-8958-form-2025::sec::purpose-of-form::b01`). Line 4 has one row, though its instruction says "on separate lines" (`::line-4::b01`). Before: the engine writes no attached statements, so a line with more items than rows (or a second state refund) is unsupported. After: the engine would print an attached statement with each item's source and its three amounts; a second Form 8958 is not what the instructions ask for, so the copies mechanism does not fit.

- **The return should take column B.** See "Proposals for a discussion" below. Before: each document fact goes to its line in full. After: each line of the return takes column B of Form 8958.

## Second opinions

- **Blind fill (2026-11-26).** 14 cases, 81 cells, filled by hand from the blank form, its instructions and Pub. 555. Every cell matches the engine, including the odd-dollar rows (cases 1, 13, 14), the pension by months (case 5), the self-employment tax for spouses and RDPs (cases 6, 7), the living-apart rules (cases 8, 9) and joint estimated tax (cases 10, 11). Its dollar doubts are doubts 2, 5, 12, 13 and 14 here.
- **PolicyEngine-US 2.154.0 (commit 363e9fc5, 2026-11-25).** It does not model Form 8958 or any community property allocation: no variable or parameter names community property, separate property or Form 8958. Its one overlap is line 9: `self_employment_tax_ald_person` is each person's self-employment tax times `percent_deductible` (0.5). That matches the engine's `DEDUCTIBLE_SE_TAX_RATE` (Schedule SE line 13) and the rule that the deductible part follows the person who owes the tax. It figures self-employment tax per person, so it cannot check the RDP split (doubt 3). No disagreement.
- **IRS Direct File.** The repository names no checkout of its tax logic, so it was not compared.

## Proposals for a discussion

**The return should take column B.** Pub. 555: "On the appropriate lines of your separate return, list only your share of the income and deductions" (`irs-pub-555-2025::sec::separate-return-preparation::b01`). Today the return reads the filer's own documents in full: Form 1040 line 1a is the filer's W-2, not half of both spouses' community wages. Form 8958 is a statement next to it. The two agree only when the couple's community items balance, as in the made-up taxpayer `careane`. The change would be a community property layer between the facts and the forms:

- Before: each document fact goes to its line in full; the spouse's documents are not on a separate return.
- After: each document fact carries its community or separate basis; the spouse's documents are recorded too; each line takes column B. Schedule SE takes the lines "Community income taxed to spouse" and "Exempt community income" (`irs-1040sse-inst-2025::sec::community-income::b02`–`b03`), and Schedule 2 line 4 takes "ECI".

This changes how facts reach every income line, so it waits for a person.

**Attached statements.** A line with more items than the form has rows needs a statement (doubt 9). The engine has no statement output for any form, so this would be a new output type, not a Form 8958 change.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header: names and SSNs | stated rule (the form) |
| Lines 1–8, 12: community items, half each | published example with numbers (Pub. 555 George and Sharon; FTB Pub. 1031 Examples 1–3) |
| Lines 1–8, 12: separate items, all to the owner | published example with numbers (FTB Pub. 1031 Examples 1–3) |
| Income from separate property by state | published example with numbers (Pub. 555 George and Sharon; FTB Pub. 1031 Example 3) |
| Part-community items (pensions by months, wages after separation) | published example with numbers (Pub. 555 Henry Wright; FTB Pub. 1031 Example 2) |
| Living-apart rules | published example with numbers (Pub. 555 George and Sharon) |
| Spouse or RDP on a single or head of household return | stated rule (Pub. 555); depends on the lived-apart answers or `married_during_year` (doubt 15) |
| IRA distributions | stated rule |
| Line 10, self-employment tax | stated rule; RDP halves own reading (doubt 3) |
| Line 9, deductible part | stated rule |
| Line 11, withholding | stated rule for wages; own reading for other items (doubt 5) |
| Line 12, joint estimated tax | stated rule |
| Column B and C order | own reading (doubt 1) |
| A line with more items than rows | unsupported (no attached statement) |
