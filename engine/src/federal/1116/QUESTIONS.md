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
- Default: both keep four places, and line 21 multiplies by the rounded line 19.
- Dollars: yes, a dollar or so.

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
