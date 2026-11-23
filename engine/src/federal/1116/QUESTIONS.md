# Form 1116 — open questions

Each place where the form and its instructions do not settle a rule. The engine applies the default named. "Dollars" says whether the choice can change an amount.

## 1. Which rate the foreign qualified dividends bear

- Text: "multiply your foreign source qualified dividends ... by 0.4054 if ... taxed at a rate of 15%, and by 0.5405 if they are taxed at a 20% rate" (`irs-1116-inst-2025::sec::qualified-dividends-and-capital-gain-tax::b02`).
- The QDCG worksheet taxes the worldwide amount in bands (lines 9, 17, 20). The text does not say which band the foreign part falls in when the worldwide amount spans two.
- Default: the foreign part is spread in the same proportions as the worldwide amount (`partI.ts adjustedPreferential`).
- Dollars: yes, when the bands split.

## 2. Taking the adjustment exception

- Text: "If you qualify for the adjustment exception, you can elect not to adjust" (`irs-1116-inst-2025::sec::individuals-who-completed-a-qualified-dividends::b01`).
- Default: a filer who qualifies takes the exception. No decision overrides it. The AMT rule of Regulations section 1.904(b)-1(b)(3) is not read.
- Dollars: yes. The exception can give a smaller or larger credit.

## 3. The high-taxed income test

- Text: high-taxed income is income whose foreign taxes "exceed the highest U.S. tax that can be imposed on the income" (`irs-1116-inst-2025::sec::categories-of-income::b03`).
- The regulation groups the income item by item (Regulations section 1.904-4(c)); the form text does not.
- Default: each passive country column is tested: its tax against 37% of line 3d less line 6, before the qualified dividend adjustment. A 15% withholding on adjusted dividends would always fail a test on the adjusted amount. A column that fails makes line 13 a gap on every copy.
- Dollars: yes (a gap instead of an amount, or the reverse).

## 4. Line 3b

- Text: "any other deductions that don't definitely relate to any specific type of income (for example, deductions shown on Schedule 1 (Form 1040), Part II)" (`irs-1116-inst-2025::sec::line-3b::b01`).
- Default: Schedule 1 line 26 less line 21 (student loan interest goes to line 4b, `line-4b::b01`). The self-employment adjustments (lines 15–17) stay in, though they relate to business income.
- Dollars: yes.

## 5. Line 3e, gross income from all sources

- Text: "gross receipts (reduced by cost of goods sold), total capital and ordinary gains (before subtracting any losses), and all other income (before subtracting any deductions)" (`irs-1116-inst-2025::sec::lines-3d-and-3e::b01`).
- Default: Form 1040 lines 1z, 2b, 3b, 4b, 5b, 6b; each Schedule D gain line above 0 (carryovers left out; a line nets its own sales); Schedule C line 7; Schedule E lines 23a and 23b; Schedule 1 lines 1, 2a, 7 and 8b–8z above 0. More than one Schedule C, Schedule E Parts II–IV, Form 4797 or Schedule F make it a gap.
- Dollars: yes.

## 6. Line 2 and Schedule A line 5a income taxes

- Text: "Also include on line 2 state and local income taxes related to foreign source income" (`irs-1116-inst-2025::sec::line-2-4::b01`); Pub. 514 allocates by "the total income taxed by the state" (`irs-pub-514-2025::sec::determining-taxable-income-from-sources::b09`), which no line defines.
- Default: an itemizer who deducts income taxes on Schedule A line 5a gets a gap on Part I. With the sales tax election, line 3a takes Schedule A line 4 plus line 5e.
- Dollars: yes (a gap).

## 7. Interest allocation under $5,000

- Text: with gross foreign income of $5,000 or less, "you can allocate all of your interest expense to U.S. source income" (`irs-1116-inst-2025::sec::line-4a::b01`, `line-4b::b01`).
- Default: the engine takes that choice. Above $5,000, line 4a uses the worksheet; investment, student loan or car loan interest makes Part I a gap (the asset method needs basis).
- Dollars: yes.

## 8. Line 19 and line 3f rounding

- Text: line 3f is rounded "to at least four decimal places" (`line-3f::b01`); line 19 has no rounding rule (`line-19::b01`).
- Default: both keep four places, and line 21 multiplies by the rounded line 19. The Worksheet for Lump-Sum Distributions rounds the ratio it enters on line 19 "to at least four places" (`explanation-of-certain-line-items-on-schedule-k-3::b03`).
- Dollars: yes, a dollar or so. Blind case 4: line 19 at four places (0.0619) gives line 21 $2,043; at six places (0.061944), $2,044.

## 9. Line h

- Text: none. The form asks "Resident of (name of country)".
- Default: "United States" when the home address is in a U.S. state; else a gap.
- Dollars: no.

## 10. Part II column (l) with several dates

- Text: "Date paid or accrued"; "1099 taxes" for 1099 amounts (`part-ii-foreign-taxes-paid-or::b04`).
- Default: a row with more than one date says "Various".
- Dollars: no.

## 11. The election and a carryover

- Text: the election year cannot use carryovers (`part-iii-figuring-the-credit::b03`, `b04`); the election is a choice.
- Default: the election applies when it can, unless a passive carryover above 0 is stated; then Form 1116 files. `decisions.scope.must_file_1116` true files the form instead. False with no election leaves Schedule 3 line 1 blank (the taxpayer may deduct the tax; no decision records that).
- Dollars: yes.

## 12. Schedule B (Form 1116) and the attached sheets

- Text: Schedule B is attached with a line 10 carryover or a carryover made this year (`part-iii-figuring-the-credit::b01`); more than three countries go on attached sheets (`specific-instructions::b01`).
- Default: line 10 is the stated carryover (Schedule B line 3, column (xiv)). The engine prints neither Schedule B nor the extra sheets; columns A–C print, and the totals include every country.
- Dollars: no.

## 13. Lines 12, 22 and 34

- Default: blank, unless Form 2555 or 4563 files (line 12, and Part I, a gap) or Form 5471 files (line 22 a gap). The boycott, oil and gas, mineral and splitting-event reductions have no facts.
- Dollars: yes when one applies.

## 14. Line 16 on the loss category's form

- Text: the example puts each reduction "(in parentheses) on line 16 of the passive category income Form 1116" and on the treaty category's form (`irs-1116-inst-2025::sec::line-16::b04`). It says nothing about line 16 of the form with the loss.
- Default: the loss form's line 16 stays 0, so its line 17 is the loss. The blind fill entered the used loss as a positive amount, so its line 17 is 0.
- Dollars: no credit change. Line 17 is zero or less either way, so line 19 is 0 and line 24 is 0. Only the printed lines 16 and 17 of the loss form differ.

## 15. The election's regular tax: Schedule 2 line 1a or line 1z

- Text: the Form 1040 instructions say "Form 1040 or 1040-SR, line 16, and Schedule 2, line 1a" (`irs-1040-inst-2025::sec::specific-instructions-2::b02`); the Form 1116 instructions say "your regular tax" (`publications-see-pub-514-foreign-tax-credit-for::b03`), which line 20 defines as line 16 plus Schedule 2 line 1z (`line-20::b01`).
- Default: line 16 plus Schedule 2 line 1z, less Form 4972 tax (`returnAmounts.ts regularTaxForCredit`).
- Dollars: yes, when Schedule 2 has lines 1b–1y and the regular tax is below the foreign tax.

## 16. The election's conditions

- Text: the Form 1040 instructions list five conditions (interest and dividends only, the 16-day holding period, no Form 4563, a legal tax liability, recognized countries) (`irs-1040-inst-2025::sec::specific-instructions-2::b01`). The Form 1116 instructions list three (passive income, a qualified payee statement, the $300/$600 limit) (`publications-see-pub-514-foreign-tax-credit-for::b01`, `b02`).
- Default: the Form 1116 list. The holding period and creditability are taken as given by the payee statement. The limit test compares the unrounded total of the taxes.
- Dollars: yes (the election, or Form 1116).

## 17. The election's total: rounded before the comparison

- Text: none on the cents.
- Default: the taxes keep their cents while adding, and the total is rounded to the nearest dollar before the comparison with the regular tax (the 1040 rounding rule). The blind fill made the same choice.
- Dollars: yes, $1.

## 18. Line 1a with the qualified dividend adjustment

- Text: "multiply your foreign source qualified dividends ... by 0.4054" (`qualified-dividends-and-capital-gain-tax::b02`); no rule on the product's cents.
- Default: the cents stay inside line 1a, and line 1a is rounded once (`partI.ts`). The blind fill made the same choice.
- Dollars: yes, $1 on line 1a; line 7 can move by $1.

## Second opinions

- Blind fill (13 cases, `.scratch/blind`): two dollar differences. Case 4 line 19 is 0.0619 (engine) against 0.061944 (blind), so lines 21 and 24 are $2,043 against $2,044; question 8. Case 6 general line 16 is 0 against +$3,000; question 14. Every other line agreed.
- Line 19 places: the Worksheet for Lump-Sum Distributions enters its ratio "as a decimal (rounded to at least four places) here and on Form 1116, line 19" (`irs-1116-inst-2025::sec::explanation-of-certain-line-items-on-schedule-k-3::b03`). That supports four places on line 19 as one allowed choice; "at least" also allows more, so question 8 stays open.
- PolicyEngine-US 2.152.17 (commit 94f818ade5): it does not model Form 1116. `foreign_tax_credit_potential` is a bare input with no formula, and `foreign_tax_credit` is its smaller with `income_tax_before_credits` (regular tax plus capital gains tax plus AMT). No constant ($300/$600, 0.4054, 0.5946, the exception limits) and no line logic to compare. Its cap includes AMT; line 20 is the section 26(b)(1) regular tax, Form 1040 line 16 plus Schedule 2 line 1z (`line-20::b01`). That is a scope difference, and the engine follows the form.
- IRS Direct File (issue #140): no checkout in this worktree. Not compared.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Line 16 foreign-loss and U.S.-loss allocations | published example with numbers |
| Line 4a (Worksheet for Home Mortgage Interest), line 3f rounding | published example with numbers |
| Election (Schedule 3 line 1 with no form), limits $300/$600 | stated rule |
| Lines 8–11, 14, 17–24, Part IV | stated rule |
| Worksheet for Line 18, line 1a factors, adjustment exception | stated rule (band split: own reading) |
| Header, line i, Part II rows (q)–(u), (m)–(p), (l) | stated rule (line h, "Various": own reading) |
| Lines 3a, 3b, 3d, 3e, 3g | stated rule (3b, 3e: own reading) |
| Line 13 high-taxed test | own reading |
| Line 2 with state income tax, 4b above $5,000, 3e with K-1s | unsupported |
| Categories other than passive and general; AMT Forms 1116 (Form 6251 line 8) | unsupported |
| Line 16 with earlier loss accounts or Form 461; line 12 with Form 2555/4563; line 22 with Form 5471 | unsupported |
