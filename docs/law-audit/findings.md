# Law audit: findings, first chunk

This document lists where the engine's form rules and the official texts do not agree, for the first 16 forms of the audit (14 federal, 2 California). Nothing in the engine was changed. The list of all forms and their audit state is in [tracking.md](tracking.md). The method and its test run are in [pilot.md](pilot.md).

- Audit date: 2026-11-27. Code: `main` after pull request #408.
- Texts: the 2025 form faces, instructions and publications in the corpus, the Internal Revenue Code, 26 CFR Parts 1 and 301, and California's Revenue and Taxation Code in the law library.

## How a finding was made

1. A reader with no access to the code wrote each form's record: every requirement of the form face and the instructions, with what the regulation and the statute say. A script checked each quote word for word against the stored text.
2. A second reader with no access to the texts wrote what the code does, one claim for each decision.
3. A matcher compared the two in both directions: a requirement the code does differently, a requirement with no code and no reported gap, and code with no requirement.
4. The lead checked each candidate. The largest ones were confirmed in the code by hand. A finding with "low" or "medium" confidence rests on reading the code; no engine run confirmed it unless the finding says so.

A gap the engine reports openly (`unsupported`, or a question it asks) is not a finding.

## The four classes

1. The texts agree with each other, and the engine does something else or less, with no reported gap. A stale comment or a stale gap reason is in this class too.
2. Two texts disagree, and the engine follows one. Most are an old regulation against a newer statute.
3. A text is unclear, has an error, or the library does not hold the passage that would settle the point.
4. A possible loophole: a stated answer that nothing checks decides an amount.

## The findings to read first

These change tax for a taxpayer the product is built for, with inputs the engine takes today.

| Finding | Form | What happens | Example |
| --- | --- | --- | --- |
| 6251-F1 | Form 6251 | The form files only for a stock option exercise or one of four credit forms. A taxpayer who owes the minimum tax for another reason gets no form, no tax and no gap. | Tens of thousands of dollars in the example |
| 8960-F1, 8960-F2 | Form 8960 | The form does not file when the only investment income is a rental or a royalty, and its income test leaves out rents. | $1,900 and $1,558 too low |
| 8582-F1 | Form 8582 | A partnership's rental income is never treated as nonpassive (the building rented to the owner's own business). | $9,600 too low |
| 8582-F3 | Form 8582 | A recorded "Form 8582 does not file" decision lets the whole rental loss through with no check of the limits. | $4,800 too low |
| schedule-a-F1 to F3 | Schedule A | The state tax line leaves out state estimated payments, withholding on forms other than Form W-2, and a prior-year balance paid in 2025. | The deduction is too low |
| schedule-a-F7 | Schedule A | Gifts to charity have no limit by percentage of income and no reported gap. | The deduction can be too high |
| 8889-F1, F2, F6 | Form 8889 | One form for both spouses, no last-month rule, and a "no" on line 15 taxes every dollar of the distributions. | $2,150 too low; $4,000 of income too high |
| schedule-se-F2 | Schedule SE | A spouse's business on a joint return: the only answer the open question accepts drops the spouse's tax. | $7,065 too low |
| 4952-F3 | Form 4952 | The limit counts every Schedule D gain, also on property not held for investment. | $6,000 too high |
| 1116-F1, 1116-F6 | Form 1116 | The election to skip the form accepts a foreign bank's own statement, and the interest allocation leaves out rental and business interest. | $134 and $528 too high |
| 8995-F1 | Form 8995 | With two businesses, or a spouse's business, the deduction stays blank with no reason. | Return does not complete |

## What repeats across forms

- **Filing tests are the weak point.** Forms 6251, 8960, 8959, 8889 and FTB 3514 each have a case where the form does not file, so its lines never run and no gap shows. The scenarios do not find these, because a scenario starts from a return that has the form.
- **Stale gap comments and reasons.** A comment says a fact or a form does not exist, and it exists now (Forms 8814, 4797, 8839, 8853 and 2555, Schedule K-1 box 14, royalties, railroad compensation in Form W-2 box 14). More than a dozen findings are of this kind. `grep -rn "no fact" engine/src` finds more candidates at no cost.
- **Railroad compensation.** Form 8959, Schedule SE line 8a and Schedule 8812 line 21 each ignore Form W-2 box 14. Schedule 3 already detects a railroad Form W-2.
- **A January 1 birthday.** FTB 3514, Form 8889, Schedule 8812 and Form 8863 each count it in their own way. Only the Form 1040 instructions state the rule (the age is reached the day before).
- **A stated answer decides the amount.** An explicit "does not file" or "files" decision skips the tests of Forms 8582 and 8995. The grounding review is the only check.
- **Old regulations.** Regulations under sections 25A, 163(d), 408, 408A and 1402 still hold rules that the statute has replaced. The engine follows the statute and the instructions each time.

## Where two instructions disagree

- **The election to claim the foreign tax credit with no Form 1116.** The Form 1040 instructions list five conditions; the Form 1116 instructions list three. The two also name a different tax amount as the cap (Schedule 2 line 1a against line 1z). The engine follows the Form 1116 instructions (1116-F3, 1116-F4).
- **Foreign currency.** The texts in the library say to convert income at the rate when received. The engine converts an amount with no date at the yearly average, under a recorded decision of 2026-11-24 (1116-F9, 1116-F10).
- **Earned income of exactly one-half of support.** The Form 8863 instructions say "less than"; the statute says "does not exceed" (8863-F6).
- **Property taxes against net investment income.** The Form 8960 instructions allow them; the regulation lists income taxes only (8960-F7).
- **The self-employment tax deduction in the rental loss income test.** The Form 8582 instructions and Publication 925 add it back; the statute's list does not have it (8582-F4).
- **California's young child and foster youth credits.** The form reduces the credit by parts of $100; the statute counts each part of $100 as a full $100 (3514-F6).

## Errors found in the official texts

- Section 1401(b)(2)(B) points to section 3121(b)(2) for the wages that reduce the threshold. The regulation reads it as section 3101(b)(2) (8959-F3).
- Form 8960 instructions, line 4a: income "not subject to" self-employment tax goes on line 4b. The statute says the opposite (8960-F12).
- Form 8606 instructions: a wrong year on line 4, and a sentence on the 10% tax that the instructions' own example does not follow (8606-F8, F9, F10).
- Form 8582 instructions: one paragraph names the allowed-loss column as the place to find last year's unallowed loss (8582-F7).
- Form 8863 instructions: two text errors with no dollars (8863-F9).

## Limits of the library

- **Effective dates.** The library holds the statute as it reads today, with amendments that start after 2025, and it does not hold the notes with the effective dates. So the statute often shows a number that the 2025 form does not have (a $7,500 dependent care exclusion against $5,000, a 50% phase-out rate of the minimum tax exemption against 25%, a $400 minimum deduction for business income). Each form reports this once as class 3. A person must read the notes to close these points.
- **Amounts adjusted each year.** The revenue procedures and the Social Security wage base are not held. The engine's amounts match the form faces in every case checked.
- **Regulations not held.** 26 CFR Part 31 (employment taxes), the regulations for health savings accounts, and California's own regulations (title 18).
- **California.** The Budget Act factor for the earned income tax credit is not held.

## Notes for the next chunk

- Cost of this chunk: about 3.7 million Sonnet tokens for the readers and about 3.2 million Fable tokens for the matchers, with at most four agents at one time.
- The readers used "law missing" for passages they did not look for. The matchers read those passages again. The prompt now forbids it.
- The topic labels of the records are not uniform enough to compare two forms by script (many are line numbers). The next chunk needs a fixed list of subjects. The conflicts between two instructions above were found by the matchers, not by a script.
- The records and the working files are in `.scratch/law-audit` of the audit's worktree, which git does not hold.

## Free test cases

The instructions of these forms hold worked examples with their results. The matchers listed them (the last column of the next table). Each one can become an engine test with no answer key from outside.

## Count by form

| Form | Class 1 | Class 2 | Class 3 | Class 4 | Worked examples in the instructions |
| --- | --- | --- | --- | --- | --- |
| Form 1116 | 8 | 2 | 4 | 1 | 6 |
| Form 2441 | 3 | 1 | 1 | 0 | 7 |
| FTB 3514 | 4 | 1 | 3 | 0 | 1 |
| Form 4952 | 5 | 1 | 0 | 0 | 3 |
| Form 6251 | 4 | 0 | 4 | 0 | 5 |
| Form 8582 | 4 | 1 | 1 | 1 | 13 |
| Form 8606 | 6 | 2 | 3 | 1 | 6 |
| Form 8863 | 3 | 3 | 2 | 1 | 3 |
| Form 8889 | 12 | 0 | 3 | 1 | 0 |
| Form 8959 | 2 | 0 | 2 | 0 | 0 |
| Form 8960 | 10 | 1 | 1 | 1 | 8 |
| Form 8995 | 3 | 0 | 2 | 2 | 0 |
| Schedule 8812 | 5 | 0 | 4 | 0 | 3 |
| Schedule A | 7 | 0 | 1 | 1 | 2 |
| Schedule S (California) | 3 | 0 | 4 | 2 | 0 |
| Schedule SE | 3 | 2 | 1 | 1 | 0 |
| **All** | **82** | **14** | **36** | **12** | |

## Form 1116

### Class 1: the texts agree and the engine does something else or less

**1116-F1** (medium confidence). The election treats a foreign account's own statement as a qualified payee statement.

- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01`: "All the income and any foreign taxes paid on it were reported to you on a qualified payee statement."
- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02`: "Qualified payee statements include Form 1099-DIV, Form 1099-INT, Schedule K-1 (Form 1041), Schedule K-3 (Form 1065), Schedule K-3 (Form 1120-S), or similar substitute statements."
- Text, `usc-26-2025::sec::s904::j-3`: "such item of income is shown on a payee statement furnished to the individual"
- Text, `usc-26-2025::sec::s904::j-3`: "The term "payee statement" has the meaning given to such term by section 6724(d)(2)."
- Text, `usc-26-2025::sec::s6724::d-2`: "The term "payee statement" means any statement required to be furnished under"
- Engine: Every interest and dividend fact is a source with onPayeeStatement true, also a fact with foreignCurrency, which the fact's own comment calls 'Income of a foreign account recorded in the account's currency, as its statement prints it' (engine/src/facts/kinds/foreignCurrency.ts:2). So foreign bank interest with a tax withheld of $300 or less ($600 joint) takes the election: no Form 1116, no limit. The same fact prints '1099 taxes' in Part II column (l) when the form does file.
- Effect: Single, 12% bracket, interest of about $1,300 from a German bank with about $290 of German tax withheld: the election gives a credit of $290. Form 1116 limits it to about 12% of $1,300 less apportioned deductions, at most $156, so the credit is at least $134 too high.
- Who meets this: Common for the target user with a foreign bank or brokerage account: this is the only kind of fact that holds a foreign currency.
- Code: `engine/src/federal/1116/sources.ts:93`

**1116-F2** (medium confidence). The election's test 'all foreign source gross income is passive' sees only income that has a foreign tax or a statement.

- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01`: "All of your foreign source gross income was "passive category income""
- Text, `usc-26-2025::sec::s904::j-2`: "the entire amount of such individual's gross income for the taxable year from sources without the United States consists of qualified passive income"
- Engine: electionApplies tests only the entries of the source list (resolveInfo.ts:60). The list holds a 1099 with foreign tax or a foreign income statement, a stated foreign tax, a trust K-1 with foreign taxes, and a PFIC only when its foreign tax is above 0 (sources.ts:245). Foreign income with no foreign tax is not in the list: a PFIC distribution with no tax (not on a payee statement), wages for work done abroad with no foreign tax and no Form 2555, foreign rent on Schedule E. No question asks for it.
- Effect: A taxpayer with $250 of fund foreign tax and a PFIC distribution of $2,000 with no foreign tax: the engine enters $250 by election. The texts require Form 1116; its limit may be the same $250 or less. Dollars only when the limit is below the tax.
- Who meets this: A PFIC with no foreign tax: rare. Wages for days worked abroad: common, and the credit rarely changes.
- Code: `engine/src/federal/1116/resolveInfo.ts:55`

**1116-F5** (medium confidence). The adjustment exception is taken with no test for a taxpayer who owes the alternative minimum tax.

- Text, `irs-1116-inst-2025::sec::qualified-dividends-and-capital-gain-tax::b02`: "If you are subject to the AMT, see the special rules in Regulations section 1.904(b)-1(b)(3)."
- Text, `cfr-26-2025::sec::s1.904(b)-1::b-3-p2`: "may make such election if the rate of tax imposed on such taxpayer's alternative minimum taxable income (excluding net capital gain and any qualified dividend income) under section 55 does not exceed 26 percent"
- Engine: qualifiesForAdjustmentException tests only the worksheet line 5 amount ($394,600 or $197,300) and the $20,000 of foreign dividends and gains (lines.ts:43); limitation.ts:51 then skips the line 1a factors and the Worksheet for Line 18. Form 6251 is never read. QUESTIONS.md item 2 says 'The AMT rule of Regulations section 1.904(b)-1(b)(3) is not read'; nothing is unsupported.
- Effect: Single, taxable income $150,000 with $20,000 of qualified dividends ($5,000 foreign, $750 foreign tax), an incentive stock option exercise that brings AMT at the 28% rate, line 20 of $27,000. Engine (no adjustment): limit 27,000 x 5,000 / 150,000 = $900, credit $750. With the adjustment: line 1a 5,000 x 0.4054 = $2,027, line 18 150,000 - 20,000 x 0.5946 = $138,108, limit $396. The credit is about $354 too high (before apportioned deductions).
- Who meets this: The target user: stock option exercise with AMT, foreign dividends through funds, more than $300 of foreign tax.
- Code: `engine/src/federal/1116/lines.ts:43`

**1116-F6** (high confidence). Line 4b: business interest and passive activity interest are not in the asset-method guard.

- Text, `irs-1116-inst-2025::sec::line-4b::b01`: "Other interest expense includes investment interest, interest incurred in a trade or business, passive activity interest, deductible student loan interest, and qualified passenger vehicle loan interest."
- Text, `irs-1116-inst-2025::sec::line-4b::b01`: "Otherwise, each type of interest expense is apportioned separately using an "asset method.""
- Engine: With gross foreign income above $5,000, Part I is unsupported only when otherInterestExpense is above 0, and that amount adds Schedule A line 9, Schedule 1 line 21 and Schedule 1-A line 30 (returnAmounts.ts:215). Schedule C lines 16a and 16b and Schedule E lines 12 and 13 are not read, so with such interest line 4b stays blank and the form computes.
- Effect: Foreign dividends of $8,000 and a U.S. rental with $12,000 of mortgage interest on Schedule E; assets by basis are 20% foreign stock. Line 4b should be $2,400; the engine enters nothing, so line 7 is $2,400 too high and, at a line 20 to line 18 ratio of 22%, the limit is about $528 too high.
- Who meets this: Common for the target user: a rental property or a Schedule C with interest, and more than $5,000 of foreign income.
- Code: `engine/src/federal/1116/returnAmounts.ts:215`

**1116-F7** (medium confidence). A Schedule D filer's foreign capital gain distributions go on line 1a in full when no rate adjustment applies (Worksheet A is skipped).

- Text, `irs-1116-inst-2025::sec::schedule-d-filers::b04`: "You must use Worksheet A, Worksheet B, or the instructions under Capital Gains and Losses in Pub. 514 to determine the adjustments you must make to your foreign capital gains or losses."
- Text, `usc-26-2025::sec::s904::b-2-A`: "Taxable income from sources outside the United States shall include gain from the sale or exchange of capital assets only to the extent of foreign source capital gain net income."
- Text, `usc-26-2025::sec::s904::b-3-A`: "The term "foreign source capital gain net income" means the lesser of"
- Engine: limitationOf returns at line 54 when the rate adjustment is not required or the exception applies, before the Schedule D check at line 57. So the unsupported reason for a Schedule D filer's foreign capital gain distributions fires only with the rate adjustment. Without it, line 1a takes the full foreign capital gain distributions, and the U.S. capital loss adjustment of Worksheet A is not made (nor its effect on the U.S. loss of line 16).
- Effect: A fund statement with $3,000 of foreign capital gain distributions and U.S. capital losses of $8,000 on Schedule D: capital gain net income is 0, so the foreign gain on line 1a should be 0. The engine enters $3,000; at a 22% ratio the limit is $660 too high.
- Who meets this: Rare: a foreign income statement that reports capital gain distributions as foreign source, and net U.S. capital losses.
- Code: `engine/src/federal/1116/limitation.ts:54`

**1116-F11** (medium confidence). Every reported foreign tax is taken as creditable: no question on the 16-day holding period, a refundable part, or a sanctioned country.

- Text, `usc-26-2025::sec::s901::k-1`: "such stock is held by the recipient of the dividend for 15 days or less during the 31-day period beginning on the date which is 15 days before the date on which such share becomes ex-dividend with respect to such dividend"
- Text, `irs-1116-inst-2025::sec::foreign-taxes-not-eligible-for-a-credit::b01`: "Only $15 is eligible for the foreign tax credit"
- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b03`: "You are still required to take into account the general rules for determining whether a tax is creditable."
- Engine: A source's foreignTaxPaid is box 7 of the 1099-DIV, box 6 of the 1099-INT, the trust K-1 amount or the stated amount (sources.ts:92, 117, 133), and all of it is credited, by the election or on Form 1116. No fact or decision records the holding period of the stock, a tax above the treaty rate that the country would refund, or a country on the sanctioned list (a stated tax goes by its stated category). QUESTIONS.md item 16: 'The holding period and creditability are taken as given by the payee statement.' Nothing is unsupported and no question is pending.
- Effect: A foreign stock bought 5 days before the ex-dividend date and sold 5 days after, $200 in box 7: the engine credits $200; the texts allow 0. A dividend with $25 withheld where the treaty rate gives $15 (the instruction's example): the engine credits $25.
- Who meets this: Holding period: rare for a fund holder, possible for a trader. Tax above the treaty rate: common for stock held directly in a foreign account (the tax withheld is on the account statement, and the engine reads that statement).
- Code: `engine/src/federal/1116/sources.ts:92`

**1116-F12** (medium confidence). Line 3e counts capital gains after the losses inside each Schedule D line.

- Text, `irs-1116-inst-2025::sec::lines-3d-and-3e::b01`: "total capital and ordinary gains (before subtracting any losses)"
- Engine: capitalGains adds each Schedule D line (1a, 1b, 2, 3, 4, 5, 8a, 8b, 9, 10, 11, 12, 13) when it is above 0 (returnAmounts.ts:103). A line is the net of its sales, so losses on the same line reduce line 3e, and a line that nets to a loss counts 0 though it holds gains. QUESTIONS.md item 5 records it ('a line nets its own sales').
- Effect: Wages $200,000, foreign income $5,000, sales with $30,000 of gains and $30,000 of losses on Schedule D line 8a, deductions on line 3c of $30,000. Engine: line 3e $205,000, line 3f 0.0244, line 3g $732. Text: line 3e $235,000, line 3f 0.0213, line 3g $639. Line 7 is $93 too low; the limit about $20 too low.
- Who meets this: Common: any Form 1116 filer with brokerage sales. Small dollars, and against the taxpayer.
- Code: `engine/src/federal/1116/returnAmounts.ts:103`

**1116-F13** (low confidence). The high-taxed income test groups passive income by country; the regulation groups it by withholding rate.

- Text, `irs-1116-inst-2025::sec::specific-instructions::b03`: "See Regulations section 1.904-4(c) for more information."
- Text, `cfr-26-2025::sec::s1.904-4::c-3-i`: "All passive income received during the taxable year that is subject to a withholding tax of fifteen percent or greater shall be treated as one item of income."
- Text, `cfr-26-2025::sec::s1.904-4::c-3-iii`: "All passive income received during the taxable year that is subject to no withholding tax or other foreign tax shall be treated as one item of income."
- Engine: isHighTaxed tests each country column of the passive form: the column's tax against 37% of line 3d less line 6 (partI.ts:230). A column that fails makes line 13 unsupported on every copy (a guard). A column that passes stays passive. A column that mixes income with no tax and income with a high tax can pass though the regulation's group of income taxed at 15% or more is high-taxed; a column can also fail alone though its group passes (then the engine is unsupported where it could compute). QUESTIONS.md item 3 records the test as the engine's own reading.
- Effect: One country column with $1,000 of interest and no tax and $1,000 of dividends with $450 of tax: the engine's test is 450 against 37% of about $2,000, so the income stays passive. By the regulation the $1,000 taxed at 45% is its own item, high-taxed, and moves with its $450 of tax to the general category form. The credit can change by up to the $450.
- Who meets this: Rare: a withholding rate near or above 37% of the income after deductions (35% countries), in a column with untaxed income.
- Code: `engine/src/federal/1116/partI.ts:230`

### Class 2: two texts disagree and the engine follows one

**1116-F3** (high confidence). The Form 1040 instructions list five conditions for the election; the engine follows the three of the Form 1116 instructions.

- Text, `irs-1040-inst-2025::sec::specific-instructions-2::b01`: "reported to you on Form 1099-INT, Form 1099-DIV, or Schedule K-3 (or substitute statement)"
- Text, `irs-1040-inst-2025::sec::specific-instructions-2::b01`: "You held the stock or bonds on which the dividends or interest were paid for at least 16 days"
- Text, `irs-1040-inst-2025::sec::specific-instructions-2::b01`: "You aren't filing Form 4563 or excluding income from sources within Puerto Rico."
- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02`: "Qualified payee statements include Form 1099-DIV, Form 1099-INT, Schedule K-1 (Form 1041), Schedule K-3 (Form 1065), Schedule K-3 (Form 1120-S), or similar substitute statements."
- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b03`: "You are still required to reduce the taxes available for credit by any amount you would have entered on line 12 of Form 1116."
- Engine: The Form 1116 list: passive, payee statement, $300 or $600; plus no Form 2555 and no stated passive carryover. Form 4563 does not end the election, the 16-day holding period is not asked, and a trust's Schedule K-1 (Form 1041) counts as a payee statement (the Form 1040 list does not name it; the statute's section 6724(d)(2)(A) covers section 6034A statements, which supports the engine). QUESTIONS.md item 16 records the choice; there is no DECISION comment and no row in docs/rule-decisions.md.
- Effect: A trust K-1 with $250 of foreign tax: the engine enters $250 by election; by the Form 1040 list the taxpayer files Form 1116 and the limit may give less. A Form 4563 filer with $200 of fund foreign tax: the engine enters $200 with no line 12 reduction.
- Who meets this: A trust K-1 with small foreign taxes: common. Form 4563: rare.
- Code: `engine/src/federal/1116/resolveInfo.ts:59`

**1116-F4** (high confidence). The election's cap: the Form 1040 instructions say line 16 plus Schedule 2 line 1a; the engine uses line 20's regular tax (Schedule 2 line 1z).

- Text, `irs-1040-inst-2025::sec::specific-instructions-2::b02`: "Form 1040 or 1040-SR, line 16, and Schedule 2, line 1a"
- Text, `irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b03`: "the smaller of (a) your total foreign tax, or (b) your regular tax"
- Text, `irs-1116-inst-2025::sec::line-20::b01`: "Enter the total of Form 1040, 1040-SR, or 1040-NR, line 16, and Schedule 2 (Form 1040), Part I, line 1z, less any tax included on line 16 from Form 4972."
- Engine: The Form 1116 instructions: Form 1040 line 16, less Form 4972 tax, plus Schedule 2 line 1z, less a negative Form 8978 amount (returnAmounts.ts regularTaxForCredit). QUESTIONS.md item 15 records it; no DECISION comment.
- Effect: Line 16 of $100, Schedule 2 line 1a of 0 and lines 1b to 1y of $150, foreign tax of $280: the engine's credit is $250; the Form 1040 instructions give $100.
- Who meets this: Rare: a tax on line 16 below the foreign tax and an amount on Schedule 2 lines 1b to 1y.
- Code: `engine/src/federal/1116/returnAmounts.ts:166`

### Class 3: a text is unclear, in error, or not in the library

**1116-F8** (medium confidence). Which rate the foreign qualified dividends bear when the worldwide amount is taxed at two rates: the texts are silent, the engine blends.

- Text, `irs-1116-inst-2025::sec::qualified-dividends-and-capital-gain-tax::b02`: "multiply your foreign source qualified dividends or capital gain distributions in each separate category by 0.4054 if the foreign source qualified dividends or capital gain distributions are taxed at a rate of 15%, and by 0.5405 if they are taxed at a 20% rate"
- Engine: adjustedPreferential multiplies the foreign amount by one blended factor: (worksheet line 17 x 0.4054 + line 20 x 0.5405) / (lines 9 + 17 + 20), so the foreign part is spread over the 0%, 15% and 20% amounts like the worldwide amount. QUESTIONS.md item 1 records it as the engine's own reading. No text in the library (instructions, Pub. 514, 26 CFR 1.904(b)-1) was found that assigns dividends to a rate.
- Effect: Worldwide $80,000 at 15% and $20,000 at 20%, foreign qualified dividends $10,000: the engine's line 1a part is $4,324; all at 15% gives $4,054, all at 20% gives $5,405. At a 30% ratio the limit moves by up to $324.
- Who meets this: High incomes only (the 20% rate), with the adjustment required and no exception.
- Code: `engine/src/federal/1116/partI.ts:47`

**1116-F9** (high confidence). Foreign income with no date converts at the IRS yearly average; the library's texts say the rate when received (a recorded decision).

- Text, `irs-pub-514-2025::sec::foreign-currency-and-exchange::b03`: "you must immediately translate into dollars all items of income"
- Text, `irs-pub-514-2025::sec::foreign-currency-and-exchange::b03`: "If there is more than one exchange rate, use the one that most properly reflects your income."
- Text, `irs-2555-face-2025::sec::face-part-iv::b01`: "Report amounts in U.S. dollars, using the exchange rates in effect when you actually or constructively received the income."
- Text, `irs-1116-inst-2025::sec::foreign-currency-conversion::b01`: "If you have to convert from foreign currency, attach a detailed explanation of how you figured the conversion rate."
- Engine: A decision exists: 'DECISION (2026-11-24)' at engine/src/incomeInDollars.ts:123 and rows 10 and 11 of docs/rule-decisions.md. A dated amount takes the Federal Reserve H.10 rate of its day; the part of a box with no date takes the IRS yearly average for 2025. The decision's second text (the IRS 'accepts any posted exchange rate that is used consistently' and publishes yearly averages) is an irs.gov page that the library does not hold. The Form 1116 instructions give no rate for income; Pub. 514 and the Form 2555 face give the rate at receipt; no statute or regulation read sets a rate for an individual's income outside a business unit.
- Effect: From the decision log: $2 to $50 on $1,200 of interest. The foreign income on lines 1a and 3d and the income on Form 1040 move together.
- Who meets this: Every foreign account fact whose statement does not date the income.
- Code: `engine/src/incomeInDollars.ts:132`
- Note from the check: A recorded decision of 2026-11-24 covers this; it is listed so the texts stay in view.

**1116-F10** (low confidence). Foreign tax rates: the source of the daily rate and of the yearly average is the engine's choice (recorded decisions); two exceptions to the average have no code.

- Text, `irs-1116-inst-2025::sec::foreign-currency-conversion::b01`: "If you take a credit for taxes paid, the conversion rate is the rate of exchange in effect on the day you paid the foreign taxes (or on the day the tax was withheld)."
- Text, `irs-1116-inst-2025::sec::foreign-currency-conversion::b01`: "you must generally use the average exchange rate for the tax year to which the taxes relate"
- Text, `cfr-26-2025::sec::s1.986(a)-1::a-1`: "are translated into dollars using the weighted average exchange rate (as defined in § 1.989(b)-1)"
- Text, `irs-pub-514-2025::sec::foreign-currency-and-exchange::b03`: "you can get exchange rates from banks and U.S."
- Text, `usc-26-2025::sec::s986::a-1-C`: "Subparagraph (A) shall not apply to any foreign income taxes the liability for which is denominated in any inflationary currency"
- Engine: The rule itself is met: a tax withheld takes the rate of its day (date required), and with the accrued fact it takes the yearly average (incomeInDollars.ts:207). Decisions exist for the sources: 'DECISION (2026-11-24)' at engine/src/currency/rates.ts:78 (daily rate from the Federal Reserve H.10 release, 20 currencies; rule-decisions row 9) and row 11 (the IRS yearly average table, not the Federal Reserve's). No text names a source; the regulation calls for a 'weighted average exchange rate' defined in 26 CFR 1.989(b)-1, which was not compared with the IRS table. The average is used for every accrued tax: no test for an inflationary currency or for a tax paid before the year or more than 2 years after it. Whether any of the 20 currencies is inflationary for 2025 is not settled by a text in the library (the International Monetary Fund price index would settle it).
- Effect: From the decision log: about $2 on 1,180 euros between the two averages. No dollars from the missing exceptions unless one of the 20 currencies is inflationary.
- Who meets this: Every foreign account with tax withheld in a foreign currency.
- Code: `engine/src/incomeInDollars.ts:207`
- Note from the check: Recorded decisions of 2026-11-24 cover the rate sources.

**1116-F14** (low confidence). Qualified dividends elected as investment income on Form 4952 line 4g are adjusted and counted like the others.

- Text, `irs-1116-inst-2025::sec::schedule-d-filers::b03`: "Don't adjust the amount of any foreign source qualified dividends that you elected to include on Form 4952, line 4g."
- Text, `irs-1116-inst-2025::sec::schedule-d-filers::b03`: "Ignore any qualified dividends you elected to include on Form 4952, line 4g, in determining the amount of your foreign source qualified dividends."
- Engine: The engine fills Form 4952 line 4g from an elected amount (engine/src/federal/4952/bindings.ts:73). Form 1116 does not read it: foreignPreferential counts every source's qualified dividends for the $20,000 test (limitation.ts:29) and line1aAmount applies the factor to all of them (partI.ts:56). The texts do not say how the elected amount divides between foreign and U.S. dividends; the engine in effect assumes none of it is foreign. The text sits in the Schedule D filers part of the instructions; the part for other filers does not repeat it.
- Effect: Foreign qualified dividends of $10,000, all elected on line 4g, U.S. dividends of $30,000 not elected, adjustment required at 15%: the engine enters $4,054 on line 1a; the text enters $10,000. At a 30% ratio the limit is about $1,784 too low. This holds only if the taxpayer may name the foreign dividends as the elected ones; a text on Form 4952 line 4g that says how the election picks dividends would settle it.
- Who meets this: Rare: an investment interest election together with a required adjustment.
- Code: `engine/src/federal/1116/partI.ts:56`

### Class 4: a possible loophole

**1116-F15** (medium confidence). A stated foreign tax gives its own dollar amount and its own foreign income; nothing checks the rate or that the income is on the return.

- Text, `irs-1116-inst-2025::sec::foreign-currency-conversion::b01`: "If you take a credit for taxes paid, the conversion rate is the rate of exchange in effect on the day you paid the foreign taxes (or on the day the tax was withheld)."
- Text, `irs-1116-inst-2025::sec::line-3e::b01`: "Enter on line 3e in each column your gross income from all sources and all categories, both U.S. and foreign."
- Engine: A stated foreign tax fact holds foreignTaxPaid in dollars, foreignTaxInForeignCurrency, datePaid and grossIncome, with no currency code (engine/src/facts/kinds/foreignTax.ts:53). Part II prints both amounts as stated; the engine's own rate tables are not applied to them, and the accrued fact does not change them. Line 3d takes the stated gross income; line 3e is built from the return's lines only, so a stated income that is on no line of the return raises line 3d but not line 3e (line 3f is capped at 1).
- Effect: A tax of 1,000 euros stated as $1,300 when the day's rate gives $1,080: Part II and line 14 are $220 too high, and the credit too when the limit allows. A stated $50,000 of foreign wages with no Form W-2 on the return: line 15 is $50,000 higher than the return's income supports, and the limit rises with it.
- Who meets this: Every stated foreign tax (wages taxed abroad, a foreign rental). The 1099 path converts with the engine's tables; this path does not.
- Code: `engine/src/federal/1116/sources.ts:125`

## Form 2441

### Class 1: the texts agree and the engine does something else or less

**2441-F1** (high confidence). Line 9b drops 2024 expenses paid in 2025, with no reason, when Part II is closed.

- Text, `irs-2441-face-2025::sec::face-part-iii::b03`: "Exception. If you paid 2024 expenses in 2025, see the instructions for line 9b"
- Text, `irs-2441-face-2025::sec::face-part-ii::b02`: "If you paid 2024 expenses in 2025, complete Worksheet A in the instructions."
- Text, `irs-2441-inst-2025::sec::line-9b::b01`: "line 9b the amount from line 13 of Worksheet A."
- Engine: Line 9b is unsupported (Worksheet A not modeled) when the stated 2024 expenses paid in 2025 are above 0, but the binding sits behind the Part II gate (partII, bindings.ts:128). Path 1: with benefits and line 29 at 0, the gate returns blank for lines 3 to 11, so line 9b is blank, line 11 is blank, and dependentCareCreditGap (creditGap.ts:35) reports nothing because line 10 is blank too. Path 2: with no 2025 expenses for any qualifying person, claimsCredit is false, the form does not file for the credit (resolveInfo.ts:139), the answer is not asked (resolveInfo.ts:171), and a recorded answer is ignored.
- Effect: One child, $5,000 of box 10 benefits excluded, $4,000 more paid in 2025, and $600 of 2024 care paid in 2025 (stated). Line 27 $3,000 less line 28 $5,000 is 0, so the engine prints no credit and no gap. Worksheet A can give up to $600 x 0.20 = $120 of credit on line 9b when the 2024 limits had room. The return shows $0 with no unsupported line.
- Who meets this: Rare: a filer with a full dependent care account who also paid a 2024 bill in 2025 (path 1), or a filer whose only care payment in 2025 was for 2024 care (path 2).
- Code: `engine/src/federal/2441/bindings.ts:240`

**2441-F2** (medium confidence). Lines 4, 5, 18 and 19 never include nontaxable combat pay, and no guard says so.

- Text, `irs-2441-inst-2025::sec::lines-4-and-5::b02`: "4. Nontaxable combat pay if you elect to include it in earned"
- Text, `irs-2441-inst-2025::sec::line-18::b01`: "You can elect to include your nontaxable combat pay in"
- Text, `usc-26-2025::sec::s32::c-2-B`: "a taxpayer may elect to treat amounts excluded from gross income by reason of section 112 as earned income"
- Engine: Earned income is Form 1040 line 1z (or line 1 without 1e) plus self-employment earnings less Form 2555 line 43. W-2 box 12 code Q is an input (FTB 3514 and Schedule EIC make their lines unsupported for it), but Form 2441 does not read it and has no unsupported result for it. The comment at lines.ts:87 says combat pay is 'unsupported on the lines this reads'; the lines it reads (1z, 1a to 1h) do not hold combat pay, and Form 1040 line 1i (always in Form 1040's unsupported list) is the earned income credit's election, a separate one.
- Effect: Joint return, two children, $6,000 of care, AGI over $43,000. One spouse served in a combat zone all year: $0 taxable wages, $30,000 in box 12 code Q. Engine: line 5 is $0, line 6 is $0, credit $0. With the election: line 5 $30,000, line 6 $6,000, credit $6,000 x 0.20 = $1,200. The engine's return is a valid one (no election made) but $1,200 worse, with no gap shown. The same amount limits the exclusion on line 20.
- Who meets this: Rare: a service member with combat pay whose other earned income is under the expenses on line 3 (or line 17).
- Code: `engine/src/federal/2441/lines.ts:87`

**2441-F3** (medium confidence). Nothing asks whether the care provider is a barred relative.

- Text, `irs-2441-inst-2025::sec::who-can-take-the-credit-or-exclude::b01`: "4. The person who provided the care wasn't your spouse,"
- Text, `irs-2441-inst-2025::sec::due-diligence::b01`: "Don't list an ineligible related individual as a care"
- Text, `usc-26-2025::sec::s21::e-6`: "who is a child of the taxpayer (within the meaning of section 152(f)(1)) who has not attained the age of 19 at the close of the taxable year"
- Text, `cfr-26-2025::sec::s1.21-4::a`: "Who is the parent of the taxpayer's child who is a qualifying individual"
- Text, `usc-26-2025::sec::s129::c`: "who is a child of such employee (within the meaning of section 152(f)(1)) under the age of 19 at the close of such taxable year"
- Engine: The provider fact holds name, address, number, tax-exempt flag, household-employee flag and amount paid (facts/kinds/dependentCare.ts:10). No field and no question records the provider's relationship. Every listed provider's payments count through the stated expenses, for the credit and for the exclusion (line 16).
- Effect: A filer pays $3,000 to their 17-year-old child (or to the child's other parent) to watch a younger child and states it as an expense. Engine: credit up to $3,000 x 0.20 = $600. Texts: $0. The statute bars the child under 19 and a dependent; the spouse and the child's parent come from regulation 1.21-4(a)(3) and (4) and the instructions.
- Who meets this: Uncommon but plausible: care by an older sibling or by the other parent. It holds only if the taxpayer states such a payment as a qualified expense; the engine treats 'qualified' as part of the stated answer.
- Code: `engine/src/federal/2441/bindings.ts:67`

### Class 2: two texts disagree and the engine follows one

**2441-F4** (medium confidence). Married living apart: section 21(e)(4) and the instructions name any qualifying person, regulation 1.21-3(b) points to section 7703(b), which needs a child.

- Text, `usc-26-2025::sec::s21::e-4`: "maintains as his home a household which constitutes for more than one-half of the taxable year the principal place of abode of a qualifying individual"
- Text, `irs-2441-inst-2025::sec::married-persons-filing-separately::b01`: "Your home was the qualifying person's main home for more"
- Text, `cfr-26-2025::sec::s1.21-3::b`: "who is treated as not married under section 7703(b) and the regulations thereunder"
- Text, `usc-26-2025::sec::s7703::b`: "the principal place of abode of a child (within the meaning of section 152(f)(1))"
- Engine: Follows the instructions and section 21(e)(4): one stated answer, dependent_care.mfs_treated_as_unmarried, whose question names the qualifying person's home (facts/kinds/dependentCare.ts:88). A yes opens Part II, checks line A, and puts line 18 on line 19 with the $5,000 limit.
- Effect: Married filing separately, lived apart all year, keeps a home for a disabled parent who is a qualifying person, $3,000 of care. Instructions and section 21(e)(4), which the engine follows: credit $3,000 x 0.20 = $600. Regulation 1.21-3(b) read through section 7703(b): no child, so still married, credit $0.
- Who meets this: Rare: a separated filer whose only qualifying person is not their child.
- Code: `engine/src/federal/2441/bindings.ts:190`

### Class 3: a text is unclear, in error, or not in the library

**2441-F5** (low confidence). Effective date not checkable: the statute text reads 50 percent and $7,500 / $3,750, the 2025 form reads 35 percent and $5,000 / $2,500.

- Text, `usc-26-2025::sec::s21::a`: "means 50 percent—"
- Text, `irs-2441-face-2025::sec::face-part-ii::b02`: "43,000—No limit .20"
- Text, `cfr-26-2025::sec::s1.21-1::a-2`: "35 percent reduced by 1 percentage point for each $2,000 (or fraction thereof) by which the taxpayer's adjusted gross income for the taxable year exceeds $15,000, but not less than 20 percent"
- Text, `usc-26-2025::sec::s129::a-2`: "shall not exceed $7,500 ($3,750 in the case of a separate return by a married individual)"
- Text, `irs-2441-face-2025::sec::face-part-iii::b02`: "Enter $5,000 ($2,500 if married filing separately and you were required to enter your spouse's earned income on line 19)."
- Engine: Follows the 2025 form, instructions and regulation: line 8 runs from 35 percent to 20 percent over $43,000 (lines.ts:47), and line 21 is $5,000, or $2,500 for married filing separately not treated as unmarried (partIII.ts:31). The library holds the current statute text with no notes, so it cannot show that the 50 percent rate and the $7,500 / $3,750 limit start after 2025. Regulation 1.21-2 also prints older amounts ($2,400 / $4,800 and $200 / $400) beside the $3,000 / $6,000 and $250 / $500 that the statute and the form use.
- Effect: If the statute text applied to 2025: AGI $60,000 and $6,000 on line 6 gives about 35 percent ($2,100) instead of 20 percent ($1,200); $7,500 in box 10 would exclude $7,500 instead of $5,000. The 2025 form and instructions give the engine's amounts.
- Who meets this: Every Form 2441, if the amendment applied to 2025; none if it starts in 2026. The statutory notes (effective dates) would settle it.
- Code: `engine/src/federal/2441/lines.ts:47`

## FTB 3514

### Class 1: the texts agree and the engine does something else or less

**3514-F1** (high confidence). Line 4 leaves out the child's interest and dividends from Form 8814.

- Text, `ca-3514-inst-2025::sec::worksheet-1::b01`: "Enter the amount from federal Form 8814, Parents' Election to Report Child's Interest and Dividends, line 1b"
- Text, `ca-3514-inst-2025::sec::worksheet-1::b01`: "Enter any amounts from federal Form 8814, line 12 for child's interest and dividends"
- Text, `ca-3514-inst-2025::sec::worksheet-1::b02`: "Add the amounts on lines 1, 2, 3, 4, 7, 8, and 11. Enter the total."
- Engine: Adds Form 1040 lines 2a, 2b, 3b and 7a and the personal property rental only. The comment says Form 8814 has 'no fact kind', but the engine has Form 8814 (engine/src/federal/8814) and the federal EIC worksheet adds its line 1b and line 12 (engine/src/federal/schedule-eic/worksheet1.ts:184). No guard reports the gap.
- Effect: A parent with $20,000 of wages, $4,000 of own interest and $1,500 on Form 8814 line 12: the worksheet gives $5,500, over $4,814, so no credit. The engine gives $4,000 on line 4 and allows the EITC (and the YCTC of $1,189 with a child under six).
- Who meets this: Rare: a low-income parent who elects Form 8814 and is near the $4,814 limit. Reachable today with no Schedule E.
- Code: `engine/src/state/ca/3514/lines.ts:39`

**3514-F2** (medium confidence). Line 4 does not subtract the Form 4797 gain from the capital gain.

- Text, `ca-3514-inst-2025::sec::worksheet-1::b01`: "Enter the gain from federal Form 4797, Sales of Business Property, line 7. If the amount on that line is a loss, enter -0-."
- Text, `ca-3514-inst-2025::sec::worksheet-1::b01`: "Subtract line 6 from line 5. If the result is less than zero, enter -0-"
- Engine: Counts all of Form 1040 line 7a (a loss as 0). The comment says Form 4797 has 'no fact kind', but the engine has Form 4797 and sends its gain to Schedule D (engine/src/federal/schedule-d/bindings.ts:8). The federal EIC code reports this case as unsupported (FORM_4797_GAP, engine/src/federal/schedule-eic/worksheet1.ts:194); FTB 3514 has no guard.
- Effect: A Schedule C filer with $15,000 of net profit, one child and a $6,000 gain on Form 4797 line 7: the worksheet's line 7 is $0 and the credit is allowed. The engine puts $6,000 on line 4, over $4,814, and gives no EITC (the table credit at that income, and a YCTC of $1,189 with a child under six, are lost).
- Who meets this: Rare: a low-income filer who sells business property at a gain and has no Schedule E.
- Code: `engine/src/state/ca/3514/lines.ts:51`

**3514-F3** (medium confidence). Line 18 leaves out a partner's self-employment earnings (Schedule K-1 box 14 code A), and the form does not file for a partner with no other earned income.

- Text, `ca-3514-inst-2025::sec::worksheet-3::b01`: "Enter the net profit (or loss) from federal Schedule K-1 (Form 1065), box 14, code A"
- Text, `ca-3514-inst-2025::sec::worksheet-3::b01`: "Total business income or (loss). Add line 1, line 2, line 3, and subtract line 4."
- Engine: Line 18 is Schedule 1 line 3 plus line 6 less line 15. The comment says 'K-1s have no fact kind, so they add 0', but the engine reads box 14 code A as an item (engine/src/federal/passThrough/partnershipBoxes.ts:195). Lines 18 and 19 print without it. The credit itself is unsupported only by accident: a K-1 makes Schedule E file, and Schedule E makes line 4 unsupported. The resolver counts only W-2 wages, a business, a farm, combat pay or waiver payments as earned income (resolveInfo.ts:79), so a partner with only K-1 earnings gets no form and a blank Form 540 line 75 with no reason.
- Effect: A partner with $7,000 in box 14 code A, no wages and one qualifying child: the form does not file and Form 540 line 75 is blank, where the table's column for one child reaches $2,016 near that income (less the effect of line 4 of Worksheet 3).
- Who meets this: Rare: a low-income general partner. A partner who also has California wages gets the form, with the credit unsupported and lines 18 and 19 too low.
- Code: `engine/src/state/ca/3514/lines.ts:73`

**3514-F5** (medium confidence). A child born and died in 2025 with no SSN or ITIN is dropped.

- Text, `ca-3514-inst-2025::sec::line-7-ssn-or-itin::b01`: "The child must have a valid SSN or ITIN, as defined below, unless the child was born and died in 2025."
- Text, `ca-3514-inst-2025::sec::line-7-ssn-or-itin::b01`: "write "Died" on this line and attach a copy of the child's birth certificate"
- Engine: Keeps only the qualifying children with an SSN or an ITIN; any other child leaves the columns and the table count, with no guard.
- Effect: A filer with $7,000 of wages whose only child was born and died in 2025 with no number: the engine uses the no-child column (at most $302 in the table) where the form allows the one-child column (up to $2,016), and gives no YCTC ($1,189).
- Who meets this: Rare. The statute has no such exception (the record marks the layers unclear: section 32(c)(3)(D) lets other methods be prescribed), so the lead may class this as 2.
- Code: `engine/src/state/ca/3514/children.ts:51`
- Note from the check: The exception is in the instructions only; the statute does not state it.

### Class 2: two texts disagree and the engine follows one

**3514-F6** (high confidence). The form reduces the YCTC and the FYTC by parts of $100; the statute counts each part of $100 as a full $100. The engine follows the form.

- Text, `ca-3514-face-2025::sec::face-part-vii::b01`: "Divide line 25 by 100. Enter the result as a decimal out to two decimal places, do not round."
- Text, `ca-rtc-2025::sec::s17052.1::a-2-C-i`: "The young child tax credit shall be reduced by twenty dollars ($20) for each one hundred dollars ($100), or fraction thereof"
- Text, `ca-rtc-2025::sec::s17052.2::a-2-C-i`: "The foster youth tax credit shall be reduced by twenty dollars ($20) for each one hundred dollars ($100), or fraction thereof"
- Engine: Follows the form: the excess over $27,425 divided by 100 to two decimals, times $21.71 for each claimant, cut to cents.
- Effect: Earned income of $27,475 and one claimant: the form's reduction is $10.85 and the credit is $1,178. With each part of $100 as a full step the reduction is $21.71 and the credit is $1,167: $11 less. The difference is at most about $21 for one claimant and $43 for two.
- Who meets this: Common: every YCTC or FYTC claimant with earned income over $27,425 that is not a multiple of $100.
- Code: `engine/src/state/ca/3514/youngChildAndFosterYouth.ts:46`

### Class 3: a text is unclear, in error, or not in the library

**3514-F8** (medium confidence). A January 1 birthday is counted three ways: age 18 by the instructions' date, age 26 by the engine's own analogy, age 6 by birth year.

- Text, `ca-3514-inst-2025::sec::step-4-filer-without-a-qualifying-child::b01`: "born on or before January 1, 2008"
- Text, `ca-3514-inst-2025::sec::step-4-filer-without-a-qualifying-child::b01`: "Were you (or your spouse/RDP if filing a joint return) at least age 18 at the end of 2025?"
- Text, `ca-3514-inst-2025::sec::step-10-qualifications-for-foster-youth-tax-credit::b01`: "You are at least 18 years old and younger than 26 years old as of the last day of the taxable year."
- Text, `ca-rtc-2025::sec::s17052.2::c-1`: "Is 18 to 25 years of age, inclusive, as of the last day of the taxable year."
- Text, `ca-3514-inst-2025::sec::step-8-qualifications-for-young-child-tax::b01`: "Your qualifying child is younger than six years old as of the last day of the taxable year."
- Engine: Age 18: born on or before January 1, 2008, as Step 4 prints (limits.ts:42). Under 26 for the FYTC: born after January 1, 2000, a date no text gives; the comment says 'a January 1 birthday reaches the age on December 31' (limits.ts:52). Under six for the YCTC: tax year less birth year, so a child born January 1, 2020 counts as 5 (children.ts:32). The two rules give opposite answers for a January 1 birthday.
- Effect: A foster youth born January 1, 2000 is 25 on December 31, 2025 by plain counting and gets no FYTC in the engine: $1,189. A child born January 1, 2020 gets the YCTC in the engine ($1,189) and would not under the Step 4 way of counting.
- Who meets this: Rare: only a person born on January 1 of 2000, 2008 or 2020.
- Code: `engine/src/state/ca/3514/limits.ts:52`

**3514-F9** (low confidence). A yes on line 1a or 1b changes nothing, and the texts give no result for line 1a or for the 10-year bar.

- Text, `ca-3514-face-2025::sec::face-part-i::b01`: "Has the Internal Revenue Service (IRS) previously disallowed your federal Earned Income Credit (EIC)? Yes No"
- Text, `ca-3514-face-2025::sec::face-header::b01`: "you may not be allowed to take the credit for up to 10 years"
- Text, `ca-3514-inst-2025::sec::specific-instructions::b01`: "answer "Yes" on line 1b within the form and follow Step 1 through Step 7"
- Engine: Prints the two stated answers. Neither stops or changes a credit, and no input records a period in which the credit is barred.
- Effect: No dollars shown by the texts. A filer inside a bar period would get the full credit from the engine.
- Who meets this: Rare: a filer with an earlier disallowance.
- Code: `engine/src/state/ca/3514/bindings.ts:92`

**3514-F10** (high confidence). The year's amounts and the Budget Act factor cannot be checked against the statute (library limit, reported once).

- Text, `ca-rtc-2025::sec::s17052::a`: "Unless otherwise specified in the annual Budget Act, the earned income tax credit adjustment factor for a taxable year beginning on or after January 1, 2015, shall be 0 percent."
- Text, `ca-rtc-2025::sec::s17052::e`: "shall be recomputed annually in the same manner as the recomputation of income tax brackets under subdivision (h) of Section 17041"
- Text, `ca-3514-inst-2025::sec::b-differences-in-california-and-federal-law::b01`: "Both your earned income and federal adjusted gross income (AGI) must be less than $32,901 to qualify for the California credit."
- Engine: Uses the amounts the form and instructions print: $32,901, $4,814, $4,661 / $6,998 / $9,823, $1,189, $27,425, $21.71, $35,640, $32,900, and the booklet's EITC table as stored data (engine/src/data/ca-eitc-table-2025.json, 658 rows, no formula). Each constant matches its instruction text. The statute holds base amounts only ($30,000, $3,400, $3,290 / $4,940 / $6,935, $1,176, $25,000, $20), and the 2025 Budget Act factor and the yearly recomputation are not in the library. The record also cannot tell whether the table follows section 17052(b) or the alternate tables of 17052(o).
- Effect: No dollars: the engine agrees with the instructions; only the statute layer is unchecked.
- Who meets this: Every return with this form.
- Code: `engine/src/state/ca/3514/limits.ts:9`

## Form 4952

### Class 1: the texts agree and the engine does something else or less

**4952-F1** (medium confidence). Line 4a leaves out interest and dividends that Schedule B counts from a K-1, a tax credit bond or a PFIC.

- Text, `irs-4952-form-2025::sec::part-ii-net-investment-income::b01`: "Include investment income reported to you on Schedule K-1 from a partnership or an S corporation. Also include net investment income from an estate or a trust."
- Text, `usc-26-2025::sec::s163::d-4-B`: "(i) gross income from property held for investment (other than any gain taken into account under clause (ii)(I)),"
- Engine: Line 4a adds only 1099-INT box 1 and box 3 and 1099-DIV box 1a (resolveInfo.ts:36-40, :81), plus Form 8814. Schedule B lines 1 and 5 also add K-1 interest and dividends (routes interest_list, dividend_list), tax credit bond interest and Form 8621 dividends (schedule-b/resolveInfo.ts:92-96, :77-83). Line 4b adds only 1099-DIV box 1b, so K-1 qualified dividends cannot be elected on line 4g either. A K-1 that prints box 20 code A (S corporation box 17 code A) is guarded: that item has no route and Schedule E line 41 is unsupported. A K-1 with no such code is not guarded, and a trust K-1 (Form 1041) has interest in box 1 with no code.
- Effect: A beneficiary with $5,000 of interest in box 1 of a trust K-1, $1,000 of bank interest and $6,000 of margin interest: line 4a is $1,000, not $6,000, so line 8 is $1,000, not $6,000. The deduction is $5,000 too low this year (it carries forward on line 7).
- Who meets this: Rare: a K-1 with portfolio interest or dividends and no investment-income code recorded (a trust K-1 always), together with investment interest expense. Tax credit bonds and PFICs: rare.
- Code: `engine/src/federal/4952/resolveInfo.ts:81`

**4952-F2** (high confidence). Line 4a leaves out royalties, and the comment says royalties have no fact kind.

- Text, `irs-4952-form-2025::sec::part-ii-net-investment-income::b01`: "Gross income from property held for investment includes income, unless derived in the ordinary course of a trade or business, from interest, ordinary dividends (except Alaska Permanent Fund dividends), annuities, and royalties."
- Text, `usc-26-2025::sec::s469::e-1`: "(I) gross income from interest, dividends, annuities, or royalties not derived in the ordinary course of a trade or business,"
- Engine: Line 4a reads no royalty. The comment at bindings.ts:30-32 says 'annuities, royalties and K-1 investment income have no fact kind yet'. The rental fact now has propertyType 'royalties' with royaltiesReceived and royaltyActivity 'portfolio' (facts/kinds/rental.ts:20, :49, :68), and Schedule E line 4 prints it (schedule-e/lines.ts:206). The comment is stale and nothing guards the gap.
- Effect: A taxpayer with $4,000 of portfolio royalties (no expenses), $1,000 of interest and $6,000 of margin interest: line 4a is $1,000, not $5,000, so line 8 is $1,000, not $5,000. The deduction is $4,000 too low this year.
- Who meets this: Rare: a portfolio royalty property and investment interest expense on one return.
- Code: `engine/src/federal/4952/bindings.ts:30`

**4952-F3** (medium confidence). Lines 4d and 4e take all of Schedule D, also gains and losses on property not held for investment.

- Text, `irs-4952-form-2025::sec::line-4d::b01`: "Net gain from the disposition of property held for investment is the excess, if any, of your total gains over your total losses from the disposition of property held for investment."
- Text, `usc-26-2025::sec::s163::d-4-B`: "(II) the net capital gain determined by only taking into account gains and losses from dispositions of property held for investment, plus"
- Text, `irs-4952-form-2025::sec::specific-instructions::b02`: "However, it doesn't include an interest in a passive activity."
- Engine: Line 4d is Schedule D line 16 and line 4e is built from Schedule D lines 15 and 7, with no filter (lines.ts:12-33). Schedule D lines 4, 5, 11 and 12 take the section 1231 gain of Form 4797 (business or rental property), Form 6252 gain on personal-use property, Form 8824 and Form 6781 amounts, and K-1 gains whatever the activity (schedule-d/bindings.ts:196-260, :383-411).
- Effect: A taxpayer sells a rental building with a $10,000 section 1231 gain (Schedule D line 11) and has no other sale, $2,000 of interest, $8,000 of margin interest and an elected amount of $6,000. Engine: line 4d and 4e $10,000, line 4g $6,000, line 8 $8,000. With only investment property: line 4d 0, line 4g 0, line 8 $2,000. The deduction is $6,000 too high. In the other direction a loss on such property lowers line 4d and the deduction. Without an election a long-term gain changes no dollars; a short-term one raises line 4f.
- Who meets this: Uncommon: investment interest expense on a return that also sells business, rental or personal-use property, or has K-1 gains from a passive activity.
- Code: `engine/src/federal/4952/lines.ts:12`

**4952-F4** (medium confidence). The no-form exception counts savings bond interest that Form 8815 excludes.

- Text, `irs-4952-form-2025::sec::who-must-file::b01`: "Your investment income from interest and ordinary dividends minus any qualified dividends is more than your investment interest expense."
- Text, `usc-26-2025::sec::s163::d-4-B`: "(i) gross income from property held for investment (other than any gain taken into account under clause (ii)(I)),"
- Text, `usc-26-2025::sec::s135::a`: "no amount shall be includible in gross income by reason of the redemption during such year of any qualified United States savings bond."
- Engine: The exception test adds 1099-INT box 1 and box 3 in full (resolveInfo.ts:36-47). Line 4a subtracts Schedule B line 3, the Form 8815 exclusion (bindings.ts:45-48). So the test can pass on income that line 4a does not count; Schedule A line 9 then takes the whole interest paid with no form (schedule-a/bindings.ts:216).
- Effect: A taxpayer with $5,000 of savings bond interest in box 3, all excluded on Form 8815, $3,000 of margin interest, no other investment income: the exception applies and Schedule A line 9 is $3,000. On the form, line 4a is 0, line 8 is 0 and $3,000 carries forward. The deduction is $3,000 too high.
- Who meets this: Rare: Form 8815 and investment interest expense on one return, with little other investment income.
- Code: `engine/src/federal/4952/resolveInfo.ts:44`

**4952-F6** (medium confidence). A child's qualified dividends from Form 8814 cannot be elected on line 4g.

- Text, `irs-pub-550-2025::sec::net-investment-income::b03`: "Child's qualified dividends. If part of the amount you report is your child's qualified dividends, that part (which is reported on Form 1040, line 3a) generally does not count as investment income. However, you can choose to in- clude all or part of it in investment income, as explained under Choosing to include qualified dividends, earlier."
- Engine: Line 4b is the parents' 1099-DIV box 1b only (bindings.ts:50), and line 4a takes Form 8814 line 12, which leaves the child's qualified dividends out. Line 4g is capped at line 4b plus line 4e (bindings.ts:76-80), so an elected amount that is the child's qualified dividends is cut with no message. The child's capital gain distributions do reach line 4e through Schedule D or Form 1040 line 7a.
- Effect: Parents with a child's $1,500 of qualified dividends on Form 8814 line 9, none of their own, no capital gain, and an elected amount of $1,500: line 4g is 0, not $1,500, so line 8 is up to $1,500 too low.
- Who meets this: Rare: Form 8814 with qualified dividends, investment interest above the other investment income, and an election.
- Code: `engine/src/federal/4952/bindings.ts:50`

### Class 2: two texts disagree and the engine follows one

**4952-F5** (high confidence). The regulation ends the qualified dividend election before 2009; the statute and the instructions allow it.

- Text, `cfr-26-2025::sec::s1.163(d)-1::a`: "An election may be made for qualified dividend income received by noncorporate taxpayers during any taxable year beginning after December 31, 2002, but before January 1, 2009."
- Text, `usc-26-2025::sec::s163::d-4-B`: "Such term shall include qualified dividend income (as defined in section 1(h)(11)(B)) only to the extent the taxpayer elects to treat such income as investment income for purposes of this subsection."
- Text, `irs-4952-form-2025::sec::line-4g::b01`: "But you can elect to include part or all of these amounts in investment income."
- Engine: Follows the statute and the 2025 instructions: line 4g takes the stated amount up to line 4b plus line 4e (bindings.ts:73-81). The regulation's dates are older than the statute's text.
- Effect: A taxpayer with $4,000 of qualified dividends, no capital gain and an elected amount of $4,000: the engine's line 4g is $4,000. Under the regulation's dates it would be 0 and line 8 up to $4,000 lower.
- Who meets this: Common among filers of the form: any election of qualified dividends.
- Code: `engine/src/federal/4952/bindings.ts:73`
- Note from the check: The regulation is older than the statute.

## Form 6251

### Class 1: the texts agree and the engine does something else or less

**6251-F1** (high confidence). The form does not file when line 7 is more than line 10 unless another trigger exists.

- Text, `irs-6251-inst-2025::sec::who-must-file::b01`: "Form 6251, line 7, is greater than line 10."
- Text, `irs-6251-inst-2025::sec::who-must-file::b01`: "The total of Form 6251, lines 2c through 3, is negative"
- Text, `usc-26-2025::sec::s55::a`: "a tax equal to the excess (if any) of"
- Engine: The resolver files the form on the explicit decision, an incentive stock option exercise, or Forms 8801, 8911, 8834 or 3800. It never compares line 7 with line 10 (the comment says KNOWN GAP). A return with no such trigger gets no Form 6251, no AMT on Schedule 2 line 2, and no gap or pending input. No code in cade/src names decisions.scope.must_file_6251, so nothing records the decision in the product.
- Effect: A single filer with the standard deduction, AGI of $100,000 and $400,000 in Form 1099-INT box 9 (line 2g, which the engine reads): line 4 is $500,000, line 6 is $411,900, line 7 is $110,550. Line 10 is the regular tax on under $100,000 of taxable income. The return prints with no AMT: tens of thousands of dollars too low.
- Who meets this: Rare without stock options, but real: large private activity bond interest, or a large investment interest difference. Every input in the example is one the engine takes.
- Code: `engine/src/federal/6251/resolveInfo.ts:43`
- Note from the check: The code comment names this as a known gap; the gap is silent on the return.

**6251-F2** (medium confidence). A gap on line 7 or in Part III reads as a blank line 11, so the total tax prints without the AMT.

- Text, `irs-6251-face-2025::sec::face-part-ii::b01`: "complete Part III on the 7"
- Text, `irs-6251-face-2025::sec::face-part-ii::b02`: "11 AMT. Subtract line 10 from line 9. If zero or less, enter -0-. Enter here and on Schedule 2 (Form 1040), line 2"
- Text, `irs-6251-face-2025::sec::face-part-iii::b01`: "14 Enter the amount from Schedule D (Form 1040), line 19"
- Engine: With an amount on Schedule D line 19, lines 13, 15, 20 and 27 return unsupported. A gap reads as blank through the accessor (defineForm.ts:145), so line 40 and line 7 are blank, and line9Of and line11Of return undefined, not a gap. With Form 2555, line 7 is unsupported and line9Of reads it as blank the same way. amtGap passes on only a gap from line 8, 9 or 10, so Schedule 2 line 2 is blank and Form 1040 lines 17 and 18 show no gap. The comment at foreignTaxCredit.ts:90 says a missing amount must not drop the AMT from the total tax.
- Effect: A filer with a $300,000 incentive stock option spread who also sells a rental building (Form 4797, unrecaptured section 1250 gain on Schedule D line 19): Form 6251 files, Part III is a gap, line 11 is blank, and Form 1040 line 18 prints the total tax with no AMT. The spread adds $300,000 to line 4, which is up to $84,000 of line 7 at 28%. The gap shows only on Form 6251's own lines.
- Who meets this: Needs Form 6251 to file, plus Form 4797 section 1250 gain or Form 2555. Uncommon, but both are forms the target user has.
- Code: `engine/src/federal/6251/foreignTaxCredit.ts:67`

**6251-F3** (high confidence). Stale gap reasons: lines 2e, 2j, 2m and 2n name inputs the engine now has.

- Text, `irs-6251-face-2025::sec::face-part-i::b01`: "e Net operating loss deduction from Schedule 1 (Form 1040), line 8a. Enter as a positive amount"
- Text, `irs-6251-face-2025::sec::face-part-i::b01`: "j Estates and trusts (amount from Schedule K-1 (Form 1041), box 12, code A)"
- Engine: Line 2e is unsupported with the reason 'Schedule 1 line 8a is unsupported: no fact holds a net operating loss carryforward', but Schedule 1 line 8a is computed now (schedule-1/nolDeduction.ts), so line 1b holds an NOL deduction that line 2e never adds back. Line 2j says 'Schedule K-1 (Form 1041) is not ingested', but box 12 code A is in passThrough/trustBoxes.ts:97. Line 2m says Form 8582, Schedule E and K-1s are not modeled; line 2n says Form 6198 and the basis limits are not modeled; all exist. Comments say 'Schedule E is not modeled' (bindings.ts:92, 308), 'Form 2555 is not modeled' (162, 354) and 'no Schedule K-1 (Form 1041) is ingested' (157). Line 3 is also unsupported for a filer who does not itemize and has no Form 8864 amount, with a reason about a deducted mortgage that such a filer cannot have; the same filer with a Form 8864 amount gets a number. All these lines stay guarded.
- Effect: No dollars from the text itself. Line 2e: a return with a $50,000 NOL deduction shows line 4 without the $50,000 on line 2e and without line 2f; the two cancel unless the 90% limit applies, and both lines report unsupported.
- Who meets this: Every return with Form 6251 and an NOL deduction, a trust K-1, passive activities or an at-risk activity reads a wrong reason.
- Code: `engine/src/federal/6251/bindings.ts:527`

**6251-F7** (low confidence). Line 2i takes the Form 3921 spread at the exercise date, with no check that the stock is vested and no amount paid for the option.

- Text, `irs-6251-inst-2025::sec::line-2i-exercise-of-incentive-stock-options::b01`: "The fair market value (FMV) of the stock acquired"
- Text, `irs-6251-inst-2025::sec::line-2i-exercise-of-incentive-stock-options::b01`: "The amount you paid for the stock, including any"
- Engine: With Forms 3921 on file and the shares held at year end, line 2i is (box 4 - box 3) x box 5 of each form: the value on the exercise date less the exercise price. No fact says whether the rights were transferable or still at risk of forfeiture on that date, whether the election was made, or what was paid for the option.
- Effect: 1,000 shares exercised early and still unvested at year end, $10 exercise price, $25 value, no election: the texts give no line 2i amount for 2025; the engine enters $15,000, and up to $4,200 of AMT at 28%.
- Who meets this: Only a filer whose exercised shares are unvested (early exercise) or who paid for the option. The instructions' own example (vested at exercise, nothing paid) matches the engine.
- Code: `engine/src/isoSpread.ts:28`

### Class 3: a text is unclear, in error, or not in the library

**6251-F4** (high confidence). Amount not checkable: the 2025 exemption, phase-out and rate-break amounts come from a revenue procedure the library does not hold.

- Text, `irs-6251-face-2025::sec::face-part-ii::b01`: "Single or head of household $ 626,350 $ 88,100"
- Text, `usc-26-2025::sec::s55::d-4-A`: "by substituting "$109,400" for "$78,750" in subparagraph (A)"
- Engine: Uses the amounts printed on the form and in its instructions: $88,100, $137,000, $68,500; $626,350 and $1,252,700; $900,350; $239,100 and $119,550; $4,782 and $2,391. Every one matches the form face or the instructions.
- Effect: No dollars: the engine equals the form. The statute holds only base amounts; the yearly adjustment cannot be checked.
- Who meets this: Every Form 6251.
- Code: `engine/src/federal/6251/bindings.ts:26`

**6251-F5** (medium confidence). Effective date not checkable: the statute text also gives a 50% exemption phase-out rate; the 2025 form uses 25%.

- Text, `irs-6251-inst-2025::sec::exemption-worksheet::b01`: "5. Multiply line 4 by 25% (0.25)"
- Text, `usc-26-2025::sec::s55::d-2`: "shall be reduced (but not below zero) by an amount equal to 25 percent of the amount by which the alternative minimum taxable income of the taxpayer exceeds—"
- Text, `usc-26-2025::sec::s55::d-4-A`: "(IV) by substituting "50 percent" for "25 percent""
- Engine: Reduces the exemption by 25% of the excess (EXEMPTION_PHASE_OUT_RATE), and uses 25% for the married filing separately addition on line 4, as the 2025 form and instructions do.
- Effect: Single, line 4 of $700,000: at 25% the exemption is $69,687; at 50% it is $51,275, and line 7 is about $5,150 higher. The library does not hold the statute's notes, so the year the 50% rate starts cannot be read.
- Who meets this: Every filer with line 4 above $626,350 ($1,252,700 joint).
- Code: `engine/src/federal/6251/bindings.ts:36`

**6251-F6** (low confidence). Line 10 adds all of Schedule 2 line 1z; the statute leaves some recapture taxes out of the regular tax.

- Text, `irs-6251-face-2025::sec::face-part-ii::b02`: "10 Add Form 1040 or 1040-SR, line 16 (minus any tax from Form 4972), and Schedule 2 (Form 1040), line 1z."
- Text, `usc-26-2025::sec::s55::c`: "Such term shall not include any increase in tax under section 45(e)(11)(C), 49(b) or 50(a) or subsection (j) or (k) of section 42."
- Engine: Adds Schedule 2 line 1z whole, as the form face says. Line 1z holds Form 4255 amounts (lines 1d, 1e, 1f, 1y), which the engine computes.
- Effect: If a Form 4255 amount on Schedule 2 lines 1d to 1y is an increase in tax under section 50(a): a $10,000 amount makes line 10 $10,000 higher than the statute's regular tax, and the AMT up to $10,000 lower. If none is, no dollars.
- Who meets this: Only a filer with Form 6251 and a Form 4255 amount on Schedule 2 lines 1d to 1y.
- Code: `engine/src/federal/6251/foreignTaxCredit.ts:45`

**6251-F8** (low confidence). The AMT investment interest carryover is taken as 0 when the regular carryover is 0, with no question.

- Text, `irs-6251-inst-2025::sec::line-2c-investment-interest::b01`: "Enter your AMT disallowed investment interest"
- Engine: Line 2 of the AMT Form 4952 is the stated fact; with no fact it is 0 when the regular Form 4952 line 2 is 0, and the form asks for the fact only when the regular carryover is above 0 (resolveInfo.ts:79). No text says the two carryovers are zero together.
- Effect: A filer with a $2,000 AMT carryover from 2024 and no regular carryover, with room on the AMT Form 4952: line 2c should be $2,000 more negative; the AMT is up to $560 too high.
- Who meets this: Only a filer whose 2024 AMT Form 4952 disallowed interest while the regular one did not.
- Code: `engine/src/federal/6251/bindings.ts:75`

## Form 8582

### Class 1: the texts agree and the engine does something else or less

**8582-F1** (medium confidence). A partnership K-1's passive net income is never recharacterized as nonpassive.

- Text, `irs-8582-inst-2025::sec::recharacterization-of-passive-income::b01`: "Certain income from passive activities must be recharacterized and excluded from passive activity income."
- Text, `irs-pub-925-2025::sec::disclosure-requirement::b05`: "If the result is net income, don't enter any of the income or losses from the activity or property on Form 8582 or its separate parts"
- Text, `irs-pub-925-2025::sec::rental-of-property-to::b01`: "If you rent property to a trade or business activity in which you materially participated, net rental income from the property is treated as nonpassive income."
- Text, `cfr-26-2025::sec::s1.469-2::f-6`: "(i) Is rented for use in a trade or business activity (within the meaning of paragraph (e)(2) of this section) in which the taxpayer materially participates (within the meaning of § 1.469-5T) for the taxable year; and"
- Engine: Every rental item of a partnership K-1, and its business items when the partner did not materially participate, go in Part V. Net income goes in column (a) as passive income. No fact asks whether the partnership rents to a business the partner materially participates in, whether the partner took part for more than 100 hours (a significant participation activity), or the other recharacterization cases, and no case is unsupported for them. The engine's own Schedule E properties do guard these cases (self-rental modeled; a short stay or land with income waits).
- Effect: A K-1 from the LLC that owns the building rented to the owner's own practice shows $30,000 of rental income; the same return has a $30,000 loss on a rental house with no special allowance (MAGI over $150,000). Rule: the $30,000 is nonpassive and stays off Form 8582, so the $30,000 loss is not allowed. Engine: line 3 is zero and the whole loss is allowed. Taxable income is $30,000 too low; at 32% the tax is $9,600 too low.
- Who meets this: Common for the target user: a business owner who holds the building in a separate LLC, with any other passive loss on the return. Significant participation: uncommon.
- Code: `engine/src/federal/passThrough/passiveActivity.ts:51-58,82-93,119-138`

**8582-F2** (medium confidence). Rental-activity exceptions other than the 7-day one are taken not to apply, with no question.

- Text, `irs-8582-inst-2025::sec::rental-activities::b01`: "b. 30 days or less and significant personal services were provided in making the rental property available for customer use."
- Text, `cfr-26-2025::sec::s1.469-1t::e-3-ii-B`: "(B) The average period of customer use for such property is 30 days or less, and significant personal services"
- Text, `irs-8582-inst-2025::sec::rental-activities::b02`: "2. Extraordinary personal services were provided in making the rental property available for customer use."
- Engine: A property is not a rental activity only when its stated average customer use is 7 days or less. With an average of 8 to 30 days it is always a rental activity, so it is passive whatever the owner's participation. The comment says the other exceptions 'have no facts: they are taken not to apply'. Nothing asks and nothing is unsupported.
- Effect: A beach house with an average stay of 10 days, daily cleaning and meals by the owner, material participation, a $20,000 loss, MAGI of $200,000. Rule: not a rental activity, and with material participation not passive: the $20,000 loss is allowed. Engine: a passive rental with no special allowance: $0 allowed. Taxable income is $20,000 too high; at 32% the tax is $6,400 too high. With net income the error runs the other way (the income frees other passive losses).
- Who meets this: Uncommon: short-term rentals with an average stay of 8 to 30 days and hotel-like services.
- Code: `engine/src/federal/rentals/passive.ts:22-33`

**8582-F5** (medium confidence). Line 6 is left blank with no reason for a W-2 with adoption benefits; the comment names a Form 8839 gap that no longer exists.

- Text, `irs-8582-inst-2025::sec::line-6::b01`: "• The exclusion of amounts received under an employer's adoption assistance program,"
- Text, `usc-26-2025::sec::s469::i-3-E`: "(ii) the amounts excludable from gross income under sections 85(c), 135, and 137,"
- Engine: modifiedAgi returns undefined when W-2 box 12 code T is above 0, with the comment 'The excluded part of employer adoption benefits needs Form 8839, not modeled'. Form 8839 now has rules (8839/bindings.ts lines 20 to 31; line 30 is the excluded benefits). The blank is not unsupported(reason) and the form lists no missing input for it, so lines 6 to 9 and 11, Parts VI to VIII and Schedule E line 22 stay blank with nothing to ask.
- Effect: No wrong dollars: the return does not complete. An employee with $5,000 of employer adoption benefits and a rental loss with active participation gets a blank line 6 and a blank Schedule E line 22 with no reason.
- Who meets this: Rare: employer adoption benefits and a rental real estate loss in the same year.
- Code: `engine/src/federal/8582/magi.ts:156-157; engine/src/federal/8582/resolveInfo.ts:78-88`

**8582-F6** (medium confidence). A Form 4797 gain on property used in a passive rental is not passive income on Form 8582.

- Text, `irs-8582-inst-2025::sec::part-iv-2::b01`: "Example. A Schedule E rental activity has current year profit of $5,000 and a Form 4797 gain of $2,000. You enter $7,000 in column (a)."
- Text, `irs-8582-inst-2025::sec::passive-activity-income::b01`: "including gain from the disposition of an interest in a passive activity and from the disposition of property used in a passive activity at the time of the disposition."
- Text, `irs-8582-inst-2025::sec::disposition-of-less-than-an-entire-interest::b01`: "Gains and losses from the disposition of less than an entire interest in an activity are treated as part of the net"
- Engine: A property's row is Schedule E line 21 only. A Form 4797 sale can name its rental (rentalId), but Form 8582 reads no Form 4797 amount. A Form 4797 loss while Form 8582 files is unsupported; a gain has no guard. The gain also reaches line 6 as nonpassive income through Schedule 1 line 4 and Form 1040 line 7a. (A property marked disposedOfEntirely waits, so this is the sale of part of the activity's property, or an entire sale without that answer.)
- Effect: A passive rental with a $10,000 loss on line 21, MAGI over $150,000, and an $8,000 Form 4797 gain on equipment sold from that rental. Rule: column (a) $8,000 and column (b) $10,000, line 3 is a $2,000 loss, $8,000 of the loss is allowed. Engine: column (a) blank, line 3 is a $10,000 loss, $0 allowed. Taxable income is $8,000 too high; at 24% the tax is $1,920 too high.
- Who meets this: Uncommon: a sale of part of a passive rental's property at a gain in a year when the passive losses are limited.
- Code: `engine/src/federal/8582/activities.ts:166-178; engine/src/federal/4797/resolveInfo.ts:78-85`

### Class 2: two texts disagree and the engine follows one

**8582-F4** (medium confidence). Line 6 adds back the self-employment tax deduction, as the instructions say; the statute's list does not have it.

- Text, `irs-8582-inst-2025::sec::line-6::b01`: "The deduction allowed for the deductible part of self-employment taxes"
- Text, `irs-pub-925-2025::sec::rental-activities::b10`: "self-employment tax."
- Text, `usc-26-2025::sec::s469::i-3-E`: "(iii) the amounts allowable as a deduction under sections 219, 221, and 250, and"
- Engine: Follows the instructions and Pub. 925: Schedule 1 line 15 is not subtracted when line 6 is built (it is not in SCHEDULE_1_ADJUSTMENTS). Section 469(i)(3)(E) lists sections 86, 85(c), 135, 137, 219, 221, 250, the passive activity loss and the (c)(7) loss; it does not list the deduction for self-employment tax.
- Effect: Single, self-employed, AGI before the rental loss of $118,000 after an $8,000 self-employment tax deduction, a $25,000 rental loss with active participation. Instructions (engine): line 6 is $126,000, line 9 is $12,000. Statute as written: $118,000 and $16,000. The engine allows $4,000 less loss; at 24% the tax is $960 higher.
- Who meets this: Common: any self-employed taxpayer with a rental loss and MAGI between $100,000 and $150,000.
- Code: `engine/src/federal/8582/magi.ts:61-73`
- Note from the check: The code comment also cites section 469(i)(3)(F), which does not exist.

### Class 3: a text is unclear, in error, or not in the library

**8582-F7** (medium confidence). The instructions name two different places for a prior-year unallowed loss; one is the allowed-loss column.

- Text, `irs-8582-inst-2025::sec::passive-activity-income-and::b02`: "they can be found in column (c) of your 2024 Part VIII."
- Text, `irs-8582-inst-2025::sec::part-viii-allowed-losses::b02`: "Column (c). Subtract column (b) from column (a)."
- Text, `irs-8582-inst-2025::sec::part-iv-2::b02`: "You find these amounts in Part VII, column (c), of your 2024 Form 8582."
- Engine: Takes the prior-year unallowed loss as a stated amount (a rental's priorYearUnallowedLoss, a K-1 holding's carriedLosses.passive) and checks it against nothing. Part VIII column (c) is the allowed loss; the unallowed loss is Part VII column (c) (Part VIII column (b)). The text for a partnership or S corporation interest points at the wrong column.
- Effect: No dollars in the engine. A person who follows the K-1 paragraph enters last year's allowed loss as this year's carried loss. The question that asks for the amount should name Part VII column (c).
- Who meets this: Anyone with a carried passive loss on a K-1 who reads that paragraph.
- Code: `engine/src/federal/8582/activities.ts:172; engine/src/federal/passThrough/passiveActivity.ts:60-61`

### Class 4: a possible loophole

**8582-F3** (high confidence). A decision that Form 8582 does not file lets the whole rental loss through with no check of the exception's amounts.

- Text, `irs-8582-inst-2025::sec::who-must-file::b01`: "• Your total loss from the rental real estate activities wasn't more than $25,000 ($12,500 if married filing separately)."
- Text, `irs-8582-inst-2025::sec::who-must-file::b01`: "• Your modified adjusted gross income (see the instructions for line 6, later) was not more than $100,000 ($50,000 if married filing separately)."
- Text, `irs-8582-inst-2025::sec::who-must-file::b01`: "• If you're married filing separately, you lived apart from your spouse all year."
- Text, `usc-26-2025::sec::s469::i-3-A`: "by 50 percent of the amount by which the adjusted gross income of the taxpayer for the taxable year exceeds $100,000."
- Engine: The decision decisions.scope.must_file_8582 = false overrides the fallback (resolverInputs.ts:130-142). Schedule E then puts each property's line 21 loss on line 22 in full. It checks only that the property has no prior-year loss and has active participation. It does not check the $25,000 total loss, MAGI of $100,000, married filing separately living apart, or a K-1 rental interest held as a limited partner. The comment in 8582/resolveInfo.ts:106-108 says the exception 'is not modeled', yet this path applies it.
- Effect: Single, wages $180,000, a $20,000 rental loss with active participation, the decision recorded as false. Rule: MAGI is over $150,000, so no loss is allowed. Engine: line 22 shows $20,000. Taxable income is $20,000 too low; at 24% the tax is $4,800 too low.
- Who meets this: Only when the decision is recorded as false for a taxpayer who does not meet every condition; the grounding review is the only check.
- Code: `engine/src/federal/schedule-e/totals.ts:46,57-64; engine/src/federal/8582/resolveInfo.ts:153-154`

## Form 8606

### Class 1: the texts agree and the engine does something else or less

**8606-F1** (medium confidence). Line 7 counts returned contributions, recharacterizations and HSA funding distributions.

- Text, `irs-8606-inst-2025::sec::line-7::b01`: "Don't include any of the following on line 7."
- Text, `irs-8606-inst-2025::sec::line-7::b01`: "Recharacterizations of traditional IRA contributions to Roth IRA contributions."
- Text, `irs-8606-inst-2025::sec::line-7::b01`: "Distributions that are treated as a return of contributions under Return of IRA Contributions, earlier."
- Text, `irs-8606-inst-2025::sec::return-of-ira-contributions::b01`: "Don't report the contribution or distribution on Form 8606"
- Engine: Line 7 is box 1 of every 1099-R with the IRA/SEP/SIMPLE box checked, except Roth codes (J, Q, T) and code Y, less the stated rollovers and conversions. Codes 8 and P (returned contributions), N and R (recharacterizations) and a one-time HSA funding distribution are not taken off. Cade asks only what was rolled over or converted (cade/src/mastra/skills/form1099R.ts). With Part I, Form 1040 line 4b takes line 15c in place of the rows' box 2a.
- Effect: Basis 10,000, year-end value 90,000, a normal distribution of 10,000 and a recharacterization 1099-R (code N) of 6,000. Engine: line 7 16,000, line 10 0.09434, line 12 1,509, line 15c 14,491. The texts: line 7 10,000, line 12 1,000, line 15c 9,000. Line 4b is 5,491 too high and line 14 is 8,491, not 9,000.
- Who meets this: Uncommon but real: a person with IRA basis and a distribution who also recharacterized or took back a contribution in the year (both are usual steps for the people who file this form).
- Code: `engine/src/federal/8606/resolveInfo.ts:104`
- Note from the check: Holds only if a payer checks the IRA box on a Form 1099-R with code 8, P, N or R; the Form 1099-R instructions settle it and were not read.

**8606-F2** (medium confidence). An inherited IRA's distribution shares the person's own basis.

- Text, `irs-pub-590b-2025::sec::traditional-iras::b05`: "you can't combine this basis with any basis you have in your own traditional IRA(s)"
- Text, `irs-8606-inst-2025::sec::specific-instructions::b01`: "file a separate 2025 Form 8606 for the IRA from each decedent"
- Engine: No fact says an IRA is inherited. A 1099-R with code 4 and the IRA box checked goes on the person's own line 7, so the person's own basis is spread over it. One copy per person. The resolver's comment says inherited IRAs have no facts; nothing is unsupported.
- Effect: Own basis 20,000, own IRAs worth 80,000 at year end, no own distribution; 20,000 from a parent's IRA with no basis (code 4). Engine: line 10 0.20000, line 12 4,000, line 15c 16,000. The texts: all 20,000 is taxable and the own basis stays 20,000. Line 4b is 4,000 too low and line 14 is 16,000, not 20,000.
- Who meets this: Uncommon: a beneficiary of an IRA who also has basis in an own IRA. The reverse (an inherited IRA with basis) has no input at all.
- Code: `engine/src/federal/8606/resolveInfo.ts:104`

**8606-F3** (medium confidence). With a Form 8606 for each spouse, Form 1040 line 4b is blank with no reason.

- Text, `irs-8606-face-2025::sec::face-header::b01`: "If married, file a separate form for each spouse required to file 2025 Form 8606."
- Text, `irs-8606-face-2025::sec::face-part-i-2::b01`: "c Taxable amount. Subtract line 15b from line 15a."
- Engine: The engine makes one copy per spouse. Form 1040 line 4b reads only the first copy, so with two filers it returns undefined ('Only the first Form 8606 copy is evaluated, so two filers leave line 4b blank'). It is not unsupported() and no input is asked.
- Effect: A couple who each convert 20,000 with no basis: line 4b should be 40,000 and is blank. Whether the total income then leaves the 40,000 out or waits is for the lead to run.
- Who meets this: Common for this form: both spouses with nondeductible contributions and a conversion in one year.
- Code: `engine/src/federal/1040/income.ts:143`

**8606-F4** (medium confidence). A Roth IRA distribution that is all rolled over or returned files an empty form and can leave line 4b blank.

- Text, `irs-8606-inst-2025::sec::who-must-file::b02`: "You received distributions from a Roth IRA in 2025 (other than a rollover, recharacterization, or return of certain contributions"
- Text, `irs-8606-inst-2025::sec::line-19::b02`: "don't complete Part III; your Roth IRA distribution(s) isn't taxable"
- Engine: Any code J or T row makes the person a filer (resolveInfo.ts:147), also when notOnLine19 takes the whole amount; every Part III line is then blank. Form 1040 line 4b reads partIIIFigures().line25c, which is undefined when line 22's basis is not stated (line 23 is undefined), and rothAnswersComplete() asks for line 22 only when line 21 is above 0. So line 4b is blank and nothing is asked. I ran partIIIFigures for a 5,000 code J row with notOnLine19 5,000: line 19 0, line 25c undefined.
- Effect: A 5,000 Roth IRA distribution rolled over within 60 days and a 10,000 taxable traditional IRA distribution: line 4b should be 10,000 and is blank until the person states a Roth contribution basis that the form does not need. No dollars on Form 8606 itself: a copy with only the name files where the texts say none is needed.
- Who meets this: Uncommon: a Roth IRA rollover or a returned Roth contribution (code J with 8 or P) with no stated contribution basis.
- Code: `engine/src/federal/8606/resolveInfo.ts:171`

**8606-F5** (medium confidence). Line 20 is capped at $10,000, not at $10,000 less earlier first-time homebuyer distributions.

- Text, `irs-8606-face-2025::sec::face-part-iii::b01`: "Do not enter more than $10,000 reduced by the total of all your prior qualified first-time homebuyer distributions"
- Text, `irs-8606-inst-2025::sec::line-20::b01`: "you made a contribution (including a conversion or a rollover from a qualified retirement plan) to a Roth IRA for any year from 1998 through 2020"
- Text, `usc-26-2025::sec::s72::t-8-B`: "the excess (if any) of— (i) $10,000, over"
- Engine: Line 20 is the smaller of 10,000 and the stated expenses. No input holds earlier first-time homebuyer distributions, and nothing asks whether a Roth contribution was made for 1998 through 2020 (the 5-year condition).
- Effect: A person who used 10,000 for a first home in an earlier year and states 10,000 of expenses again, with a 30,000 distribution, contribution basis 5,000 and no conversion basis: engine line 20 10,000 and line 25c 15,000; the texts give line 20 0 and line 25c 25,000. Income is 10,000 too low.
- Who meets this: Rare: a second first-time homebuyer distribution, or one from a Roth IRA first funded after 2020.
- Code: `engine/src/federal/8606/partIII.ts:55`

**8606-F6** (high confidence). Stale comment: Form 1040 line 4b says Part III, line 25c, is not modeled.

- Text, `irs-8606-face-2025::sec::face-part-iii::b02`: "c Taxable amount. Subtract line 25b from line 25a."
- Engine: The comment above line4b reads 'Part III, line 25c, is not modeled'. Part III has rules (8606/partIII.ts) and Form 1040's resolver adds line 25c to the IRA taxable amount (1040/resolveInfo.ts:116).
- Effect: no dollars
- Who meets this: A reader of the code.
- Code: `engine/src/federal/1040/income.ts:127`

### Class 2: two texts disagree and the engine follows one

**8606-F11** (medium confidence). Regulation 1.408A-4 bars a conversion above $100,000 of income or on a separate return; the form and section 408A do not.

- Text, `cfr-26-2025::sec::s1.408a-4::qa2-a`: "An individual with modified AGI in excess of $100,000 for a taxable year is not permitted to convert an amount to a Roth IRA during that taxable year."
- Text, `cfr-26-2025::sec::s1.408a-4::qa2-b`: "a married individual filing a separate return is not permitted to convert an amount to a Roth IRA"
- Text, `irs-8606-face-2025::sec::face-part-i-2::b01`: "Complete this part if you converted part or all of your traditional IRAs to a Roth IRA in 2025."
- Engine: Follows the form: any stated conversion goes to lines 8 and 16 to 18, with no income or filing status test. Section 408A(c)(3) as the library holds it (read in this run) limits contributions by income and states no limit on conversions.
- Effect: A 50,000 conversion at 300,000 of income: the engine and the form tax line 18. The regulation would not permit the conversion; the passages read do not state the dollars that follow.
- Who meets this: Common (most of the target users convert above $100,000). The regulation text looks older than the statute; a person confirms.
- Code: `engine/src/federal/8606/bindings.ts:191`
- Note from the check: The regulation is older than the statute.

**8606-F12** (medium confidence). Regulation 1.408-4(a)(2) says basis in an IRA is zero; section 408(o) and the form give basis.

- Text, `cfr-26-2025::sec::s1.408-4::a`: "the basis (or investment in the contract) of any person in such an account or annuity is zero"
- Text, `usc-26-2025::sec::s408::o-4-B`: "the aggregate amount of designated nondeductible contributions for all preceding taxable years, over"
- Text, `irs-8606-inst-2025::sec::traditional-iras::b02`: "Your basis in traditional IRAs is the total of all your nondeductible contributions and your nontaxable amounts included in rollovers made to these IRAs minus the total of all your nontaxable distributions"
- Engine: Follows the form and the statute: basis is line 1 plus line 2 and makes part of each distribution nontaxable.
- Effect: Basis 10,000 of 100,000 and a 10,000 distribution: the engine taxes 9,000; with a basis of zero all 10,000 is taxable.
- Who meets this: Every Part I filer. The regulation text looks older than section 408(o); a person confirms.
- Code: `engine/src/federal/8606/bindings.ts:162`
- Note from the check: The regulation is older than the statute.

### Class 3: a text is unclear, in error, or not in the library

**8606-F8** (high confidence). The line 4 instructions print 'April 15, 2025' for April 15, 2026.

- Text, `irs-8606-inst-2025::sec::line-4::b01`: "that you made from January 1, 2026, through April 15, 2025, can be treated as nondeductible"
- Text, `irs-8606-face-2025::sec::face-part-i::b02`: "Enter your nondeductible contributions to traditional IRAs for 2025, including those made for 2025 from January 1, 2026, through April 15, 2026."
- Engine: Line 4 is a stated amount; the fact's text and the binding's comment say January 1 to April 15, 2026, as the form face.
- Effect: no dollars
- Who meets this: An error in the instructions; the engine follows the face.
- Code: `engine/src/federal/8606/bindings.ts:169`

**8606-F9** (high confidence). The instructions say the 10% tax generally applies to a returned contribution's earnings; their own example and the statute say it does not.

- Text, `irs-8606-inst-2025::sec::return-of-ira-contributions::b01`: "if you were under age 591/2 at the time of a distribution with related earnings, you are generally subject to the additional 10% tax on early distributions"
- Text, `irs-8606-inst-2025::sec::return-of-ira-contributions::b04`: "you also aren't subject to the additional tax on early distributions even though you were under age 591/2 at the time of the distribution"
- Text, `usc-26-2025::sec::s72::t-2-A`: "attributable to withdrawal of net income attributable to a contribution which is distributed pursuant to section 408(d)(4)"
- Engine: Form 8606 has no rule for it. Form 5329 (another record) has a reason text for a code 8 or P corrective distribution that says its earnings may be subject to the tax and the engine does not split it (5329/partI.ts:50).
- Effect: The example's 73 of earnings: 7 of tax under the first sentence, 0 under the example and section 72(t)(2)(A)(ix).
- Who meets this: A person under 59½ who takes back a contribution with earnings by the due date. The decision belongs to Form 5329's record.
- Code: `engine/src/federal/5329/partI.ts:50`

**8606-F10** (high confidence). The instructions say a covered person 'can contribute' only below the income limit; the limit is on the deduction.

- Text, `irs-8606-inst-2025::sec::references-to-2025-form-8915-f-references-to-2025::b02`: "you can contribute to a traditional IRA for 2025 only if your 2025 modified AGI for traditional IRA purposes is less than"
- Text, `usc-26-2025::sec::s408::o-2-C`: "as a contribution for which a deduction is not allowable under section 219"
- Engine: At or above 89,000 (146,000 qualifying surviving spouse, 10,000 married filing separately living together) the deduction's limit is 0 and the contribution becomes line 1. The contribution itself is allowed.
- Effect: no dollars (read literally, the sentence would leave no nondeductible contribution, and no line 1, above the limit)
- Who meets this: An error of wording in the What's New text; the engine follows the statute and line 1's own instructions.
- Code: `engine/src/federal/schedule-1/iraDeduction.ts:96`

### Class 4: a possible loophole

**8606-F7** (medium confidence). A stated line 1 is not held to the contribution limit.

- Text, `usc-26-2025::sec::s408::o-2-A`: "shall not exceed the nondeductible limit for such taxable year"
- Text, `irs-8606-inst-2025::sec::line-1::b01`: "you can make nondeductible contributions up to your contribution limit"
- Text, `irs-8606-inst-2025::sec::overall-contribution-limit-for::b01`: "your limit on contributions to traditional and Roth IRAs is generally the smaller of $7,000 ($8,000 if age 50 or older at the end of 2025) or your taxable compensation"
- Engine: When the person states nondeductible contributions and no total contributions, line 1 is the stated amount. Nothing compares it with 7,000 or 8,000 or with compensation. (With total contributions also stated, Schedule 1 line 20 is unsupported when the two disagree with the worksheet.)
- Effect: A stated 20,000: line 14 carries 20,000 of basis, 13,000 more than the year's limit allows, and the same year's conversion of 20,000 has line 18 of 0 where at most 7,000 could be basis: income 13,000 too low.
- Who meets this: Only with a wrong stated answer (an excess contribution, or employer SEP money taken for a nondeductible contribution).
- Code: `engine/src/federal/8606/bindings.ts:68`

## Form 8863

### Class 1: the texts agree and the engine does something else or less

**8863-F2** (medium confidence). A filer who is claimed as a dependent still gets the credit.

- Text, `irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b03`: "You're claimed as a dependent on another person's tax return, such as your parent's return."
- Text, `usc-26-2025::sec::s25a::g-3`: "no credit shall be allowed under subsection (a) to such individual for such individual's taxable year"
- Text, `cfr-26-2025::sec::s1.25a-1::f-1`: "If a student is a claimed dependent of another taxpayer, only that taxpayer may claim the education tax credit"
- Engine: The resolver files Form 8863 from a student fact or a Form 1098-T, and no line reads whether the filer is claimed as a dependent. The engine holds that answer for other forms: `student_loan.claimed_as_dependent` (Schedule 1 line 21) and `claimedAsDependent` in the saver's credit fact (Form 8880). QUESTIONS.md item 8 says no fact holds it and leaves the question to Cade.
- Effect: A student claimed by a parent, with $4,000 of expenses and tax of $2,500 or more: the engine gives line 19 $2,500 (or $1,500 plus $1,000 on line 8). The texts give $0.
- Who meets this: Common case (a college student who files a return and has a Form 1098-T). Today only Cade's question before the student fact prevents it; with `student_loan.claimed_as_dependent` true the return itself holds the contradiction.
- Code: `engine/src/federal/8863/resolveInfo.ts:98`

**8863-F3** (medium confidence). Lines 3 and 14 leave out excluded Puerto Rico income that a fact holds.

- Text, `irs-8863-face-2025::sec::face-part-i::b01`: "Enter the amount from Form 1040 or 1040-SR, line 11b. But if you're filing Form 2555 or 4563, or you're excluding income from Puerto Rico, see Pub. 970 for the amount to enter instead"
- Text, `irs-8863-inst-2025::sec::line-3::b01`: "you must include on line 3 the amount of income you excluded"
- Text, `usc-26-2025::sec::s25a::d`: "the adjusted gross income of the taxpayer for the taxable year increased by any amount excluded from gross income under section 911, 931, or 933"
- Engine: magiOf adds Form 4563 line 15 and is unsupported with Form 2555. It adds nothing for Puerto Rico and has no guard. The fact `clean_vehicle_credit.puerto_rico_excluded_income` holds the 2025 amount for Form 8936 line 1b; Form 8863 does not read it. QUESTIONS.md item 10 says no fact holds a Puerto Rico exclusion, which is no longer true.
- Effect: Single filer, line 11b $70,000, excluded Puerto Rico income $30,000, line 1 $2,500: MAGI is $100,000 and the credit is $0. The engine uses $70,000 and gives $2,500.
- Who meets this: Rare: a bona fide resident of Puerto Rico with an education credit. The engine can see the amount only when the Form 8936 answer is recorded; with no such fact it is an input the engine lacks.
- Code: `engine/src/federal/8863/credit.ts:60`

**8863-F4** (medium confidence). A student with no Form 1098-T gets the credit with no check of the exceptions.

- Text, `usc-26-2025::sec::s25a::g-8`: "Except as otherwise provided by the Secretary, no credit shall be allowed under this section unless the taxpayer receives a statement furnished under section 6050S(d)"
- Text, `irs-8863-inst-2025::sec::future-developments::b01`: "the law requires a taxpayer (or a dependent) to have"
- Text, `irs-8863-inst-2025::sec::future-developments::b03`: "After January 31, 2026, but before you file the return, you or the student"
- Engine: A stated No on line 22(2) prints No and the credit is computed as usual. No answer records that the school need not furnish the form, or that the filer asked for it after January 31, 2026. QUESTIONS.md item 7 names this and leaves it to Cade; the engine has no guard and no missing input.
- Effect: A student with $4,000 of expenses, No on line 22(2) for every school, and neither exception: the engine gives up to $2,500; the texts give $0.
- Who meets this: Uncommon: most students get a Form 1098-T. It needs a filer who answers No and does not meet an exception.
- Code: `engine/src/federal/8863/students.ts:43`

### Class 2: two texts disagree and the engine follows one

**8863-F1** (high confidence). Regulation older than the statute: income limits, refundable part, number of years, course materials.

- Text, `cfr-26-2025::sec::s1.25a-1::c`: "phased out ratably for taxpayers with modified adjusted gross income between $40,000 and $50,000 ($80,000 and $100,000 for married individuals who file a joint return)"
- Text, `usc-26-2025::sec::s25a::d`: "$80,000 ($160,000 in the case of a joint return), bears to"
- Text, `irs-8863-face-2025::sec::face-part-i::b01`: "Enter $180,000 if married filing jointly; or $90,000 if single, head of household, or qualifying surviving spouse"
- Text, `cfr-26-2025::sec::s1.25a-1::a`: "An individual taxpayer is allowed a nonrefundable education tax credit"
- Text, `usc-26-2025::sec::s25a::i`: "Forty percent of so much of the credit allowed under subsection (a) as is attributable to the American Opportunity Tax Credit (determined after application of subsection (d)"
- Text, `cfr-26-2025::sec::s1.25a-3::d-1-iii`: "the student has not completed the first two years of postsecondary education"
- Text, `usc-26-2025::sec::s25a::b-2-C`: "if the student has completed (before the beginning of such taxable year) the first 4 years of postsecondary education at an eligible educational institution"
- Text, `cfr-26-2025::sec::s1.25a-2::d-2`: "Qualified tuition and related expenses include fees for books, supplies, and equipment used in a course of study only if the fees must be paid to the eligible educational institution"
- Text, `usc-26-2025::sec::s25a::f-1`: "subparagraph (A) shall be applied by substituting "tuition, fees, and course materials" for "tuition and fees""
- Engine: Follows the statute and the 2025 form on all four points: limits of 90,000 and 180,000 with ranges of 10,000 and 20,000; 40% of line 7 refundable; the first 4 years on line 25; course materials bought elsewhere count for the American opportunity credit.
- Effect: Single filer, MAGI $85,000, line 1 $2,500: statute and form give line 7 $1,250, of which $500 is refundable; the regulation's text gives no credit. A third-year student gets the credit under the statute and none under the regulation.
- Who meets this: Every return with Form 8863. The statute and the form agree; only the regulation (written for the Hope credit) differs.
- Code: `engine/src/federal/8863/lines.ts:10`

**8863-F6** (high confidence). Line 7: earned income of exactly one-half of support (instructions 'less than', statute 'does not exceed').

- Text, `irs-8863-inst-2025::sec::line-7::b02`: "b. Age 18 at the end of 2025 and your earned income (defined later) was less than one-half of"
- Text, `usc-26-2025::sec::s1::g-2`: "whose earned income (as defined in section 911(d)(2)) for such taxable year does not exceed one-half of the amount of the individual's support"
- Text, `usc-26-2025::sec::s25a::i`: "The preceding sentence shall not apply to any taxpayer for any taxable year if such taxpayer is a child to whom subsection (g) of section 1 applies for such taxable year."
- Engine: Follows the instructions: the answer `earnedIncomeLessThanHalfOfSupport` is the instructions' question 5, so a filer at exactly one-half answers No and takes the refundable part.
- Effect: Filer aged 18, earned income $10,000, support $20,000, a parent alive, line 7 $2,500: the instructions give line 8 $1,000 and line 9 $1,500; the statute gives line 8 $0 and line 9 $2,500.
- Who meets this: Rare: earned income must equal exactly one-half of support.
- Code: `engine/src/federal/8863/refund.ts:48`

**8863-F7** (medium confidence). Required student activity fees: the instructions and the regulation count them, the statute's words exclude them.

- Text, `irs-8863-inst-2025::sec::qualified-education-expenses::b01`: "Qualified education expenses include nonacademic"
- Text, `cfr-26-2025::sec::s1.25a-2::d-2`: "only if the fee must be paid to the eligible educational institution for the enrollment or attendance of the student at the institution"
- Text, `usc-26-2025::sec::s25a::f-1`: "Such term does not include student activity fees, athletic fees, insurance expenses, or other expenses unrelated to an individual's academic course of instruction."
- Engine: Follows the instructions and the regulation: `tuitionAndFeesPaid` is defined as tuition and fees required for enrollment, and the whole stated amount counts.
- Effect: A required $300 activity fee in a lifetime learning student's expenses (under the $10,000 cap): the instructions give $60 more credit than the statute's words. For an American opportunity student under $2,000 of expenses it is $300.
- Who meets this: Common: many schools charge a required activity fee. The published instructions and the regulation agree with the engine.
- Code: `engine/src/federal/8863/lines.ts:46`

### Class 3: a text is unclear, in error, or not in the library

**8863-F8** (medium confidence). Line 7 ages: the Form 8863 texts do not say how a January 1 birthday counts.

- Text, `irs-8863-inst-2025::sec::line-7::b02`: "a. Under age 18 at the end of 2025, or"
- Text, `usc-26-2025::sec::s1::g-2`: "has not attained age 18 before the close of the taxable year, or"
- Engine: Counts a January 1 birthday as the day before (born January 1, 2002 is 24 at the end of 2025), a rule it takes from the Form 1040 instructions for the kiddie tax (irs-1040-inst-2025::sec::tax-table-or-tax-computation-work::b02), not from a Form 8863 text (QUESTIONS.md item 9).
- Effect: A single filer born January 1, 2002, with a parent alive, a full-time student with low earned income, line 7 $2,500: the engine gives line 8 $1,000; the other reading (age 23) gives line 8 $0 and line 9 $2,500.
- Who meets this: Rare: a non-joint filer born on January 1 of 2002, 2007 or 2008 who takes the American opportunity credit.
- Code: `engine/src/federal/8863/refund.ts:23`

**8863-F9** (high confidence). Two errors in the instructions' text: 'with dependent child' on the MAGI bar, and a wrong year in the Wilbert example.

- Text, `irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b03`: "Your MAGI is $180,000 or more if married filing jointly; or $90,000 or more if single, head of household, or qualifying surviving spouse with dependent child."
- Text, `irs-8863-face-2025::sec::face-part-i::b01`: "Enter $180,000 if married filing jointly; or $90,000 if single, head of household, or qualifying surviving spouse"
- Text, `irs-8863-inst-2025::sec::american-opportunity-credit::b03`: "If Wilbert files Form 8863 for 2025, he would check "No" for Part III, line 23."
- Engine: Uses $90,000 for single, head of household and qualifying surviving spouse with no dependent-child test, as the face and the statute do. Line 23 is the stated answer; the example's result (3 prior years, No) matches the code.
- Effect: No dollars.
- Who meets this: No taxpayer: a note on the texts only. The record says the Wilbert example lists 2025 among the prior years.
- Code: `engine/src/federal/8863/lines.ts:69`

### Class 4: a possible loophole

**8863-F5** (medium confidence). Nothing checks that the student is the filer, the spouse or a dependent on the return.

- Text, `irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b01`: "You may be able to claim an education credit if you, your spouse, or a dependent you claim on your tax return was a student"
- Text, `usc-26-2025::sec::s25a::f-1`: "any dependent of the taxpayer with respect to whom the taxpayer is allowed a deduction under section 151"
- Text, `irs-8863-inst-2025::sec::part-iii-student-and-educational::b01`: "Enter the student's name as shown on page 1 of your tax return."
- Engine: The student's name and SSN come from the student fact as stated. studentPartIII does not compare them with the filer, the spouse or the dependent facts of Form 1040.
- Effect: A parent records a student fact for a child who is not a dependent on the return: the engine gives up to $2,500 for that student; the texts give $0.
- Who meets this: Uncommon: a child the parent no longer claims, or a name or SSN that differs from page 1. The engine holds the names and SSNs to compare.
- Code: `engine/src/federal/8863/students.ts:73`

## Form 8889

### Class 1: the texts agree and the engine does something else or less

**8889-F1** (high confidence). A joint return puts both spouses' HSA amounts on one Form 8889 with one limit.

- Text, `irs-8889-face-2025::sec::face-part-i::b01`: "If you are filing jointly and both you and your spouse each have separate HSAs, complete a separate Part I for each spouse."
- Text, `irs-8889-inst-2025::sec::specific-instructions::b01`: "complete a separate Form 8889 for each of you."
- Text, `irs-8889-inst-2025::sec::line-6::b01`: "divide the amount on line 5 equally between you and your spouse, unless you both agree on a different allocation"
- Text, `irs-8889-face-2025::sec::face-part-i::b02`: "9 Employer contributions made to your HSAs for 2025"
- Text, `irs-8889-inst-2025::sec::how-to-complete-part-i::b01`: "Combine the amounts on line 13 of both Forms 8889 and enter this amount on Schedule 1 (Form 1040), line 13."
- Engine: One Form 8889 per return, with the taxpayer's name and SSN. Line 9 adds box 12 code W of every W-2 fact and line 14a adds box 1 of every HSA Form 1099-SA; neither reads the fact's owner (taxpayer or spouse). Line 6 always copies line 5. The coverage answers and own contributions have one slot.
- Effect: Joint return, each spouse has self-only coverage all year and $3,000 in box 12 code W; the taxpayer also contributed $1,000 outside payroll. Engine: line 3 $4,300, line 9 $6,000, line 12 $0, line 13 $0. Two forms: the taxpayer's line 12 is $1,300 and line 13 is $1,000, so the deduction is $1,000 too low. With both on family coverage the one combined form gives the same total.
- Who meets this: Common: a married couple where the spouse has an HSA (a W-2 with code W or a Form 1099-SA with owner spouse).
- Code: `engine/src/federal/8889/resolveInfo.ts:66`

**8889-F2** (high confidence). Line 3 does not apply the last-month rule.

- Text, `irs-8889-inst-2025::sec::who-must-file::b02`: "You may consider yourself an "eligible individual" for the entire year if you are an eligible individual on the 1st day of the last month of the tax year"
- Text, `irs-8889-inst-2025::sec::line-3::b01`: "You are treated as having the same HDHP coverage for the entire year as you had on the first day of the last month of your tax year."
- Text, `usc-26-2025::sec::s223::b-8-A`: "an individual who is an eligible individual during the last month of such taxable year shall be treated—"
- Engine: Line 3 is the annual amount times the stated months of coverage, divided by 12, in every case. A comment says the last-month rule is not modeled; no unsupported result or question reports it.
- Effect: Self-only HDHP from July 1 through December, $4,300 contributed outside payroll. Engine: line 3 $2,150, line 13 $2,150. Texts: eligible on December 1, so line 3 is $4,300 and the deduction is $4,300. The deduction is $2,150 too low.
- Who meets this: Common: anyone whose HDHP coverage started during the year and who is covered on December 1.
- Code: `engine/src/federal/8889/bindings.ts:31`

**8889-F3** (high confidence). A change between self-only and family coverage in the year cannot be stated; line 3 uses one type for all months.

- Text, `irs-8889-inst-2025::sec::line-3::b01`: "4. If you were, or were considered, an eligible individual for the entire year and you changed your type of coverage during the year, enter on line 3 (see (6) in this list) the greater of:"
- Text, `irs-8889-inst-2025::sec::line-3::b02`: "If you had family coverage on the first day of the last month, you do not need to use the worksheet; enter $8,550 on line 3."
- Text, `irs-8889-inst-2025::sec::line-1::b01`: "check the box for the plan that was in effect for a longer period."
- Text, `irs-8889-inst-2025::sec::start-here::b01`: "Enter $8,550 on the line below for the month. If, at the end of 2025, you were unmarried and age 55 or older, enter $9,550 for the month."
- Text, `usc-26-2025::sec::s223::b-8-A`: "(ii) as having been enrolled, during each of the months such individual is treated as an eligible individual solely by reason of clause (i), in the same high deductible health plan in which the individual was enrolled for the last month of such taxable year."
- Engine: One stated coverage type and one count of months. Line 3 multiplies that type's annual amount by the months. There is no month-by-month worksheet and no greater-of rule.
- Effect: Family coverage January to June, self-only July to December, eligible all year. Worksheet: (6 x $8,550 + 6 x $4,300) / 12 = $6,425, which is more than $4,300, so line 3 is $6,425. Engine: $4,300 when 'self-only, 12 months' is stated ($2,125 too low) or $8,550 when 'family, 12 months' is stated ($2,125 too high). The record also notes that for a person eligible all year the statute gives the monthly sum and the instructions the greater-of amount; the engine follows neither.
- Who meets this: Uncommon: marriage, divorce, a birth or a job change that moves the plan between self-only and family.
- Code: `engine/src/federal/8889/bindings.ts:31`

**8889-F4** (medium confidence). Months of HDHP coverage stand in for months as an eligible individual; Medicare and other coverage are never asked.

- Text, `irs-8889-inst-2025::sec::figuring-your-hsa-deduction::b01`: "You cannot deduct any contributions for any month in which you were enrolled in Medicare."
- Text, `usc-26-2025::sec::s223::b-7`: "for the first month such individual is entitled to benefits under title XVIII of the Social Security Act and for each month thereafter."
- Text, `irs-8889-inst-2025::sec::who-must-file::b02`: "To be eligible to have contributions made to your HSA, you must be covered under a high deductible health plan (HDHP) and have no other health coverage except certain disregarded coverage."
- Text, `usc-26-2025::sec::s223::b-3`: "In the case of an individual who has attained age 55 before the close of the taxable year, the applicable limitation under subparagraphs (A) and (B) of paragraph (2) shall be increased by the additional contribution amount."
- Engine: The only input is hsa.coverage_months, which Cade asks as 'months covered'. No input records Medicare enrollment or other health coverage, and the engine does not use the date of birth to ask about Medicare at 65.
- Effect: Self-only HDHP all year, turns 65 and enrolls in Medicare on July 1, states 12 months covered, contributes $5,300. Engine: line 3 $5,300, line 13 $5,300. Texts: 6 months x $5,300 / 12 = $2,650. The deduction is $2,650 too high. The instructions say 'enrolled in Medicare' and the statute says 'entitled to benefits'; no text in the library says whether the two are the same (class 3 part).
- Who meets this: Uncommon: a worker who starts Medicare during the year, or who has a general-purpose health FSA or a spouse's non-HDHP plan.
- Code: `engine/src/federal/8889/resolveInfo.ts:32`

**8889-F5** (medium confidence). A person who can be claimed as a dependent still gets the HSA deduction.

- Text, `irs-8889-inst-2025::sec::who-must-file::b02`: "you cannot be enrolled in Medicare or be another person's dependent."
- Text, `usc-26-2025::sec::s223::b-6`: "No deduction shall be allowed under this section to any individual with respect to whom a deduction under section 151 is allowable to another taxpayer"
- Engine: Line 13 is the smaller of line 2 and line 12. No part of Form 8889 reads a dependent answer; the engine holds such answers for other forms (eic.claimable_as_dependent, student_loan.claimed_as_dependent).
- Effect: An adult child who can be claimed by a parent, on the family HDHP, states self-only coverage for 12 months and $2,000 contributed. Engine: line 13 $2,000. Texts: no deduction. The deduction is $2,000 too high.
- Who meets this: Rare: a dependent who files a return and has an HSA.
- Code: `engine/src/federal/8889/bindings.ts:45`

**8889-F6** (high confidence). A 'no' to 'all distributions were qualified' taxes every dollar; a part cannot be stated.

- Text, `irs-8889-inst-2025::sec::line-15::b01`: "that were used to pay you for qualified medical expenses not reimbursed by insurance or other coverage and that you incurred after the HSA was established."
- Text, `irs-8889-inst-2025::sec::distributions-from-an-hsa::b01`: "Any part of a distribution not used to pay qualified medical expenses is includible in gross income"
- Text, `irs-8889-face-2025::sec::face-part-ii::b01`: "16 Taxable HSA distributions. Subtract line 15 from line 14c. If zero or less, enter -0-."
- Engine: Line 15 equals line 14c only when hsa.distributions_all_qualified is true. When the answer is false, line 15 is blank, the answer is no longer a missing input, and line 16 is all of line 14c, which Schedule 1 line 8f takes.
- Effect: Form 1099-SA box 1 $5,000, of which $4,000 paid qualified medical expenses. Engine: line 15 blank, line 16 $5,000. Texts: line 15 $4,000, line 16 $1,000. Income is $4,000 too high. (The record notes that section 223(f)(1) says 'used exclusively' and has no words for a part; the instructions tax only the part not used.)
- Who meets this: Uncommon: any HSA owner with one nonqualified withdrawal in the year.
- Code: `engine/src/federal/8889/bindings.ts:71`

**8889-F7** (high confidence). Own contributions above the limit lead to no Form 5329 and no 6% tax.

- Text, `irs-8889-inst-2025::sec::line-13::b01`: "if the amount on line 2 is more than the amount on line 13, you, your employer, or someone else contributed more to your HSA than is allowable and you may have to pay an additional tax on the excess contributions."
- Text, `irs-8889-inst-2025::sec::excess-contributions-you-make::b01`: "subtract your deductible contributions (line 13) from your actual contributions (line 2)."
- Text, `irs-8889-inst-2025::sec::deemed-distributions-from-hsas::b03`: "Code section 4973 imposes a 6% tax on excess contributions to an HSA."
- Text, `usc-26-2025::sec::s4973::a-cont`: "there is imposed for each taxable year a tax in an amount equal to 6 percent of the amount of the excess contributions"
- Engine: Line 13 caps the deduction at line 12 and nothing else happens. Form 5329 files only for an early distribution or by decision (engine/src/federal/5329/resolveInfo.ts:24), and its Part VII lines are unsupported, so with line 2 above line 13 no form, tax or gap shows.
- Effect: Self-only coverage all year, under 55, $5,000 contributed outside payroll and not withdrawn. Engine: line 13 $4,300, no Form 5329. Texts: excess $700, additional tax 6% = $42 on Form 5329 line 49 and Schedule 2. Tax is $42 too low.
- Who meets this: Uncommon: a contribution above the limit, or any contribution in a year the limit is prorated.
- Code: `engine/src/federal/8889/bindings.ts:45`

**8889-F8** (medium confidence). Employer contributions above the line 8 limit are not added to income or taxed.

- Text, `irs-8889-inst-2025::sec::excess-employer-contributions::b01`: "Excess employer contributions are the excess, if any, of your employer's contributions over your limitation on line 8."
- Text, `irs-8889-inst-2025::sec::excess-employer-contributions::b01`: "If the excess was not included in income on Form W-2, you must report it as "Other income" on your tax return."
- Text, `usc-26-2025::sec::s106::d`: "to the extent such amounts do not exceed the limitation under section 223(b)"
- Engine: Line 12 floors line 8 minus line 11 at 0. The amount by which line 9 is more than line 8 goes nowhere: not to Schedule 1 other income and not to Form 5329.
- Effect: Self-only coverage for 6 months (line 8 $2,150 in the engine), W-2 box 12 code W $3,000, nothing withdrawn. Engine: line 12 $0, nothing else. Texts: excess employer contributions $850 are other income (when box 1 does not hold them) and are excess contributions taxed 6% = $51.
- Who meets this: Uncommon: an employee who leaves the HDHP during the year after the employer funded the HSA.
- Code: `engine/src/federal/8889/bindings.ts:94`

**8889-F9** (medium confidence). Stated own contributions alone do not file Form 8889.

- Text, `irs-8889-inst-2025::sec::who-must-file::b01`: "You must file Form 8889 if any of the following applies."
- Engine: Without the decision, the form files on a stated coverage type, a W-2 code W amount, or an HSA Form 1099-SA. hsa.own_contributions is not a trigger. A form that does not file shows no missing inputs (engine/src/pendingInputs.ts:50), so nothing asks for the coverage type.
- Effect: Only fact: hsa.own_contributions = $4,300 (no W-2 code W, no Form 1099-SA, coverage type not recorded yet). Engine: no Form 8889, Schedule 1 line 13 blank, return can look ready. Texts: the form is required and the deduction is $4,300.
- Who meets this: Uncommon: a self-employed or direct contributor, when Cade records the amount before the coverage type. Cade's only HSA questions sit in the Form 1099-SA skill.
- Code: `engine/src/federal/8889/resolveInfo.ts:27`

**8889-F10** (high confidence). Line 4 is 'unsupported' on every Form 8889 without Form 8853, with a reason that is no longer true.

- Text, `irs-8889-face-2025::sec::face-part-i::b01`: "4 Enter the amount you and your employer contributed to your Archer MSAs for 2025 from Form 8853, lines 1 and 2."
- Text, `irs-8889-face-2025::sec::face-header::b01`: "Before you begin: Complete Form 8853, Archer MSAs and Long-Term Care Insurance Contracts, if required."
- Engine: When Form 8853 does not file, line 4 returns unsupported('No Archer MSA / Form 8853 scenario or ingestion yet.'). The engine has Form 8853 with rules and Archer MSA facts (engine/src/federal/8853/results.ts), so with no Form 8853 the line is blank: nothing applies.
- Effect: No dollars: line 5 reads the unsupported line 4 as 0. Every HSA return lists a gap that does not exist.
- Who meets this: Common: every Form 8889 with no Archer MSA.
- Code: `engine/src/federal/8889/bindings.ts:10`

**8889-F11** (medium confidence). Line 9 takes box 12 code W as printed; the Employer Contribution Worksheet has no input.

- Text, `irs-8889-inst-2025::sec::employer-contribution-worksheet::b01`: "5. Employer contributions for 2025. Add lines 3 and 4. Enter here and on your 2025 Form 8889, line 9"
- Text, `irs-8889-inst-2025::sec::employer-contribution-worksheet::b01`: "3. Subtract line 2 from line 1"
- Text, `irs-8889-inst-2025::sec::line-9::b01`: "If either of the following apply, complete the Employer Contribution Worksheet."
- Engine: Line 9 is the sum of box 12 code W. No input records 2024 employer contributions made in 2025 or 2025 contributions made in 2026.
- Effect: Box 12 code W $3,000, of which $500 was the employer's 2024 contribution paid in February 2025; own contributions $1,800, self-only all year. Engine: line 9 $3,000, line 12 $1,300, line 13 $1,300. Worksheet: line 9 $2,500, line 12 $1,800, line 13 $1,800. The deduction is $500 too low.
- Who meets this: Rare, and only with an input the engine lacks.
- Code: `engine/src/federal/8889/resolveInfo.ts:66`

**8889-F12** (medium confidence). Earnings on a withdrawn excess contribution (Form 1099-SA box 2) never reach other income.

- Text, `irs-8889-inst-2025::sec::excess-contributions-you-make::b01`: "You also withdraw any income earned on the withdrawn contributions and include the earnings in "Other income" on your tax return for the year you withdraw the contributions and earnings."
- Text, `usc-26-2025::sec::s223::f-3`: "Any net income described in clause (ii) shall be included in the gross income of the individual for the taxable year in which it is received."
- Engine: The Form 1099-SA fact holds box 2 (earnings on excess contributions) but no form reads it. The stated line 14b amount takes the excess and its earnings out of line 14c, so the earnings are taxed nowhere.
- Effect: Excess of $700 withdrawn in March 2026 with $30 of earnings; Form 1099-SA box 1 $730, box 2 $30; line 14b stated as $730. Engine: line 16 $0 and no other income. Texts: $30 is other income in the year received.
- Who meets this: Rare: a timely withdrawal of an excess contribution.
- Code: `engine/src/federal/8889/bindings.ts:69`

### Class 3: a text is unclear, in error, or not in the library

**8889-F13** (low confidence). A January 1, 1971 birthday counts as age 55 at the end of 2025 with no text for it.

- Text, `irs-8889-inst-2025::sec::line-3::b02`: "6. If, at the end of 2025, you were age 55 or older and unmarried or married with self-only HDHP coverage for the entire year, you can increase the amount determined in (3) or (4) by $1,000"
- Text, `usc-26-2025::sec::s223::b-3`: "In the case of an individual who has attained age 55 before the close of the taxable year"
- Engine: bornBeforeJan2_1971 (engine/src/birthDate.ts:33) treats a person born on January 1, 1971 as 55 at the end of 2025. The Form 8889 texts say only 'age 55 or older at the end of 2025' and 'attained age 55 before the close of the taxable year'; the day-before-birthday rule is in the Form 1040 instructions for age 65, not in an HSA text.
- Effect: A person born January 1, 1971 with self-only coverage all year: line 3 is $5,300, not $4,300. $1,000 of deduction turns on the reading.
- Who meets this: Rare: one birthday.
- Code: `engine/src/federal/8889/bindings.ts:38`

**8889-F14** (high confidence). The 2025 limits ($4,300 and $8,550) come from a revenue procedure the library does not hold.

- Text, `irs-8889-face-2025::sec::face-part-i::b01`: "enter $4,300 ($8,550 for family coverage)."
- Text, `usc-26-2025::sec::s223::b-2`: "in the case of an eligible individual who has self-only coverage under a high deductible health plan as of the first day of such month, $2,250."
- Text, `usc-26-2025::sec::s223::g-1`: "Each dollar amount in subsections (b)(2), (c)(2)(A), and in the case of taxable years beginning after 2026, (c)(1)(E)(ii)(II) shall be increased by an amount equal to—"
- Engine: Uses 4300 and 8550, the amounts printed on the form face and in the instructions. The statute prints $2,250 and $4,500 with a yearly adjustment; the adjusted amounts cannot be checked against their source.
- Effect: No dollars: the engine matches the form face.
- Who meets this: Every Form 8889; a check of the source only.
- Code: `engine/src/federal/8889/bindings.ts:39`

**8889-F16** (low confidence). Effective date not checkable: the statute's direct primary care rules are not in the 2025 instructions.

- Text, `usc-26-2025::sec::s223::c-1-E-i`: "A direct primary care service arrangement shall not be treated as a health plan for purposes of subparagraph (A)(ii)."
- Text, `usc-26-2025::sec::s223::g-1`: "Each dollar amount in subsections (b)(2), (c)(2)(A), and in the case of taxable years beginning after 2026, (c)(1)(E)(ii)(II) shall be increased by an amount equal to—"
- Text, `irs-8889-inst-2025::sec::what-s-new::b01`: "The amendments apply to plan years beginning after 2024."
- Text, `irs-8889-inst-2025::sec::qualified-medical-expenses::b02`: "You cannot treat insurance premiums as qualified medical expenses unless the premiums are for:"
- Engine: No input for other coverage or for which expenses qualify (both sit inside stated answers), so the engine applies neither text.
- Effect: No dollars in the engine. The library's section 223 text has direct primary care arrangements (section 223(c)(1)(E), and a premium exception the record notes at (d)(2)(C)(v)); the 2025 instructions name only the telehealth change. The statute's notes with the effective dates are not held, so the library cannot say whether these rules apply to 2025.
- Who meets this: A person with a direct primary care arrangement; a check of the source only.
- Code: `engine/src/federal/8889/resolveInfo.ts:32`

### Class 4: a possible loophole

**8889-F15** (low confidence). A stated 'excess withdrawn' amount on line 14b is not tied to line 2 or line 13.

- Text, `irs-8889-inst-2025::sec::excess-contributions-you-make::b01`: "You do not claim a deduction for the amount of the withdrawn contributions; and"
- Text, `irs-8889-inst-2025::sec::excess-contributions-you-make::b01`: "You make the withdrawal by the due date, including extensions, of your 2025 tax return"
- Text, `irs-8889-face-2025::sec::face-part-ii::b01`: "b Distributions included on line 14a that you rolled over to another HSA."
- Engine: hsa.distributions_rolled_over is one number for rollovers and withdrawn excess together. It lowers line 14c. Line 2 and line 13 do not change, and nothing checks that an excess exists (line 2 above line 13) or that the withdrawn amount is not also deducted.
- Effect: Self-only all year, $3,000 contributed, $1,000 taken out and stated as 'excess withdrawn'. Engine: line 13 $3,000 and line 16 $0. The texts treat a withdrawn excess as never contributed only when no deduction is claimed for it: either the deduction is $2,000 or the $1,000 is a distribution that needs qualified expenses. $1,000 of income escapes.
- Who meets this: Rare, and it needs a wrong stated answer.
- Code: `engine/src/federal/8889/bindings.ts:69`

## Form 8959

### Class 1: the texts agree and the engine does something else or less

**8959-F1** (high confidence). Line 19 leaves out the uncollected Medicare tax in Form W-2 box 12 codes B and N.

- Text, `irs-8959-inst-2025::sec::line-19::b01`: "Also include any uncollected Medicare tax on tips from"
- Engine: Adds box 6 of each Form W-2 only. The W-2 fact holds box 12, and no guard reports the gap.
- Effect: A tipped employee with $300 in box 12 code B: line 24 is $300 too low, so the payments on Form 1040 are $300 too low.
- Who meets this: Rare: an employee with uncollected Medicare tax on tips or on group-term life insurance who also files Form 8959.
- Code: `engine/src/federal/8959/bindings.ts:19`

**8959-F2** (high confidence). The form does not file for a railroad employee: the filing test does not read railroad compensation.

- Text, `irs-8959-inst-2025::sec::who-must-file::b01`: "Your RRTA compensation on any single Form W-2"
- Text, `irs-8959-inst-2025::sec::who-must-file::b01`: "Your total RRTA compensation and tips (Form W-2,"
- Engine: The filing test reads Form W-2 box 5, Form 4137, Form 8919 and self-employment income. It does not read box 14, though the W-2 fact holds box 14 entries. When the form does file, the railroad lines 14 to 17 and 23 are reported as unsupported; when it does not file, nothing reports the gap.
- Effect: A railroad employee with $260,000 of compensation and no other wages: 0.9% of $60,000 = $540 of tax is left out, with no gap shown.
- Who meets this: Rare: a railroad employee over the threshold. The same root as the Schedule SE line 8a finding.
- Code: `engine/src/federal/8959/resolveInfo.ts`

### Class 3: a text is unclear, in error, or not in the library

**8959-F3** (high confidence). Section 1401(b)(2)(B) points to the wrong section for the wages that reduce the threshold.

- Text, `usc-26-2025::sec::s1401::b`: "shall be reduced (but not below zero) by the amount of wages taken into account"
- Text, `cfr-26-2025::sec::s1.1401-1::d-2-i`: "is reduced (but not below zero) by the amount of wages (as defined in section 3121(a))"
- Engine: Reduces the threshold by the Medicare wages on line 4, as the form and the regulation say.
- Effect: No dollars. The statute as printed names section 3121(b)(2), which defines an employment exception and imposes no tax; the regulation reads it as section 3101(b)(2).
- Who meets this: Every Form 8959 with self-employment income; an error in the statute's text only.
- Code: `engine/src/federal/8959/bindings.ts:8`

**8959-F4** (medium confidence). The 0.9% tax on railroad compensation is not plainly in the law the library holds.

- Text, `irs-8959-inst-2025::sec::additional-medicare-tax-a-0-9-additional-medicare::b01`: "should be separately compared to the threshold."
- Text, `usc-26-2025::sec::s3201::a`: "a tax equal to the applicable percentage of the compensation received during any calendar year by such employee"
- Engine: Lines 14 to 17 are unsupported, so no amount is computed.
- Effect: No dollars today. Sections 3201 and 3211 point to the rates of section 3101; no passage read states the thresholds for railroad compensation or that it is compared on its own. The employment tax regulations (26 CFR Part 31) are not in the library.
- Who meets this: A check of the source only, until the engine computes Part III.
- Code: `engine/src/federal/8959/bindings.ts:14`

## Form 8960

### Class 1: the texts agree and the engine does something else or less

**8960-F1** (high confidence). Form 8960 does not file for a taxpayer whose only investment income is a rental or a royalty.

- Text, `irs-8960-inst-2025::sec::who-must-file::b01`: "Attach Form 8960 to your return if your modified adjusted"
- Text, `irs-8960-inst-2025::sec::application-to-individuals::b01`: "Individuals who have for"
- Text, `irs-8960-inst-2025::sec::passive-activity::b01`: "A passive activity also includes any rental activity, regardless of whether you materially participate."
- Text, `cfr-26-2025::sec::s1.1411-4::a`: "Gross income from interest, dividends, annuities, royalties, and rents, except to the extent excluded by the ordinary course of a trade or business exception"
- Engine: The fallback files the form only when investmentSignals finds investment income and the MAGI bound is over the threshold. The signals are: an investment_income fact, Form 8814 income, a capital loss carried in, a section 1256 contract, a PFIC, K-1 investment income, a Schedule C or farm without material participation, and Form 4797, 6252 or 8824 sales. A Schedule E Part I property (category 'rental': a rental or a royalty) is not one. Checked by a run: single, a W-2 of $300,000 and a rental with $60,000 rent gives must_file_8960 = false, rule 'no triggering signal'. The comment over investmentSignals says 'any rental', but that is the K-1 test only.
- Effect: Single, wages $300,000, net rental income $50,000, no interest or dividends: Form 8960 does not file, so Schedule 2 line 12 is blank. The texts give 3.8% of the smaller of $50,000 and $150,000 = $1,900. The tax is $1,900 too low.
- Who meets this: Common for the target user: a wage earner over the threshold with a rental property and no 1099-INT, 1099-DIV or 1099-B fact. One interest fact of any amount hides it.
- Code: `engine/src/federal/8960/mustFile.ts:165`
- Note from the check: Confirmed in the code: a rental property fact is not among the signals.

**8960-F2** (high confidence). The MAGI 'upper bound' of the filing test leaves out rents, royalties and the stated Schedule 1 income.

- Text, `irs-8960-inst-2025::sec::who-must-file::b01`: "Attach Form 8960 to your return if your modified adjusted"
- Text, `irs-8960-inst-2025::sec::line-13-modified-adjusted-gross-income-magi::b01`: "your MAGI is your AGI as reported on Form 1040 or 1040-SR."
- Text, `irs-8960-inst-2025::sec::line-4a-income-from-trades-businesses::b01`: "Schedule 1 (Form 1040), line 5."
- Engine: magiUpperBound adds wages, interest, dividends, sale gains, business and farm profit, gambling, unemployment, Form 1099-MISC box 3, retirement and HSA distributions, social security, Form 8814, PFIC and K-1 income. It does not add Schedule E Part I net rents or royalties (Schedule 1 line 5), alimony received (line 2a), canceled debt (line 8c), jury duty pay, prizes, stock options or the stated other income items (lines 8h, 8i, 8k, 8z), though each has a fact and reaches AGI. Its comment says 'Income with no facts (rents, alimony) is not counted' and 'it does not miss one': both are stale. Checked by a run: single, W-2 $190,000, interest $1,000, a rental with $60,000 rent and $10,000 expenses gives a bound of $191,000 and must_file_8960 = false.
- Effect: That taxpayer: AGI $241,000, NII $51,000, excess over $200,000 is $41,000, tax $1,558. The engine files no Form 8960: the tax is $1,558 too low.
- Who meets this: Common: wages a little under the threshold with rental income, or with a large stated item (stock options, a prize). Rents are checked by a run; the other items are from reading the code.
- Code: `engine/src/federal/8960/mustFile.ts:58`

**8960-F3** (high confidence). Line 13 is not adjusted for a PFIC, though the engine figures lines 5b and 6 for it.

- Text, `irs-8960-inst-2025::sec::line-13-modified-adjusted-gross-income-magi::b02`: "Decrease AGI by the amount of any section 951(a), 951A,"
- Text, `cfr-26-2025::sec::s1.1411-10::e-1-iii`: "Decreased by any amount included in gross income for chapter 1 purposes under section 951(a) or section 1293(a) attributable to a CFC or QEF with respect to which no election under paragraph (g) of this section is in effect; and"
- Text, `cfr-26-2025::sec::s1.1411-10::e-1-i`: "Increased by amounts included in net investment income under paragraphs (c)(1)(i), (c)(1)(ii), (c)(2)(i), and (c)(4) of this section that are not otherwise included in gross income for chapter 1 purposes;"
- Text, `irs-8960-inst-2025::sec::line-13-modified-adjusted-gross-income-magi::b01`: "your MAGI is your AGI as reported on Form 1040 or 1040-SR."
- Engine: Line 13 is Form 1040 line 11b plus the Form 2555 add-back. The comment says 'the CFC add-backs are not modeled', and nothing guards it. With a PFIC fund fact the engine takes a QEF's line 7c out of NII on line 5b (no election) and adds a section 1291 fund's excess distributions and gains on line 6, but MAGI stays AGI: it is not decreased by the QEF's section 1293(a) inclusions, and not increased by section 1291 amounts that are in NII but not in gross income.
- Effect: Single, AGI $230,000 that holds $20,000 of QEF inclusions (no section 1.1411-10(g) election), other NII $50,000. Texts: MAGI $210,000, excess $10,000, tax $380. Engine: line 13 $230,000, line 15 $30,000, tax $1,140: $760 too high. For a section 1291 fund the error runs the other way (tax too low).
- Who meets this: Rare: a taxpayer with a PFIC (Form 8621) whose MAGI excess is the smaller amount on line 16.
- Code: `engine/src/federal/8960/bindings.ts:136`

**8960-F4** (medium confidence). A QEF's distributions of earnings taxed before are not added to NII when no election is in effect.

- Text, `irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b04`: "you'll generally include"
- Text, `cfr-26-2025::sec::s1.1411-10::c-1-i-A-1`: "is a dividend for purposes of section 1411(c)(1)(A)(i) and § 1.1411-4(a)(1)(i) if the distribution is attributable to amounts that are or have been included in gross income for chapter 1 purposes under section 951(a) or section 1293(a) in a taxable year beginning after December 31, 2012"
- Text, `cfr-26-2025::sec::s1.1411-10::c-1-i-A-2`: "is not treated as a dividend for purposes of section 1411(c)(1)(A)(i)"
- Engine: Line 6 is Form 8621's netInvestmentIncomeAddition: the section 1296 amounts, a section 1291 fund's excess distributions and gains, and a QEF's line 6c only with the election (8621/results.ts:80). A QEF fact holds its distributions, but without the election none of them reaches line 6 and nothing is unsupported. 8621/QUESTIONS.md question 11 says this is not modeled.
- Effect: A QEF without the election distributes $10,000 of earnings included under section 1293(a) in a year after 2012: the texts add $10,000 to NII (and to MAGI); the engine adds $0. Tax up to $380 too low.
- Who meets this: Rare. The engine also lacks the input that says which part of a distribution comes from earnings included after 2012.
- Code: `engine/src/federal/8621/results.ts:80`

**8960-F5** (high confidence). The early withdrawal penalty on Schedule 1 line 18 is not deducted on line 10.

- Text, `irs-8960-inst-2025::sec::line-7-other-modifications-to-investment-income::b04`: "Note: Early withdrawal penalty (Schedule 1 (Form 1040),"
- Text, `cfr-26-2025::sec::s1.1411-4::f-2-iii`: "Deductions described in section 62(a)(9) are taken into account in determining net investment income."
- Text, `usc-26-2025::sec::s62::a-9`: "as a penalty for premature withdrawal of funds from a time savings account"
- Engine: Schedule 1 line 18 is the sum of Form 1099-INT box 2 (schedule-1/bindings.ts:187). Form 8960 line 10 is only the stated fact investment_income.niit_additional_modifications, which Cade records 'only when the user tells you' and never asks for. The penalty the engine already knows does not reach line 10.
- Effect: A $500 penalty in box 2: line 11 is $500 too low and line 12 $500 too high. When NII is the smaller amount on line 16 the tax is $19 too high.
- Who meets this: Uncommon: a taxpayer over the threshold who broke a certificate of deposit.
- Code: `engine/src/federal/8960/bindings.ts:126`

**8960-F6** (medium confidence). Line 9b has no place for foreign income tax deducted on Schedule A line 6.

- Text, `irs-8960-inst-2025::sec::line-9b-state-local-and-foreign-income-tax::b01`: "Include state, local, and foreign income taxes you paid for"
- Text, `cfr-26-2025::sec::s1.1411-4::f-3-iii`: "State, local, and foreign income, war profits, and excess profit taxes described in section 164(a)(3) that are allocable to net investment income pursuant to paragraph (g)(1) of this section."
- Text, `usc-26-2025::sec::s164::b-6`: "The preceding sentence shall not apply to any foreign taxes described in subsection (a)(3)"
- Engine: Line 9b is the stated allocation capped at Schedule A line 5e (state and local taxes after the cap), and blank with no line 5e amount. Cade asks only for 'the state and local tax they deduct on Schedule A'. Schedule A line 6 (other taxes, one stated total with its type) can hold a foreign income tax taken as a deduction, and it is outside the cap and outside the question.
- Effect: A $2,000 foreign income tax on dividends, deducted on Schedule A line 6, with no state tax on line 5e: the texts allow $2,000 on line 9b; the engine leaves line 9b blank. Tax $76 too high.
- Who meets this: Rare: most taxpayers take the credit, and a credited tax is not deductible.
- Code: `engine/src/federal/8960/bindings.ts:152`

**8960-F8** (medium confidence). With the sales tax election, line 9b can deduct general sales tax.

- Text, `irs-8960-inst-2025::sec::line-9b-state-local-and-foreign-income-tax::b02`: "Sales taxes aren't"
- Text, `cfr-26-2025::sec::s1.1411-4::f-3-iii`: "State, local, and foreign income, war profits, and excess profit taxes described in section 164(a)(3) that are allocable to net investment income pursuant to paragraph (g)(1) of this section."
- Engine: Schedule A line 5a holds general sales taxes when the taxpayer elects them (schedule-a/bindings.ts:138), and line 5e includes them. Line 9b caps the stated allocation at line 5e and does not look at the election, so the stated amount passes although no income tax was deducted.
- Effect: Sales tax election, $8,000 on line 5a, the taxpayer states $3,000 as allocable to investment income: line 9b is $3,000; the texts give $0 of sales tax. Tax up to $114 too low.
- Who meets this: Uncommon: an itemizer in a state with no income tax who answers the allocation question with an amount above 0. It rests on the stated answer.
- Code: `engine/src/federal/8960/bindings.ts:156`

**8960-F9** (medium confidence). A trader in financial instruments is treated as an ordinary nonpassive business and taken out of NII.

- Text, `irs-8960-inst-2025::sec::purpose-of-form::b02`: "In addition, NII includes other gross income derived from a trade or business that's"
- Text, `usc-26-2025::sec::s1411::c-2`: "(B) a trade or business of trading in financial instruments or commodities (as defined in section 475(e)(2))."
- Text, `irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01`: "Net income or loss from a section 162 trade or business"
- Text, `irs-8960-inst-2025::sec::special-rules-for-certain-rental-income::b02`: "the nonpassive trade or business"
- Text, `cfr-26-2025::sec::s1.1411-4::b-2`: "(ii) Derived in a trade or business described in § 1.1411-5(a)(2) is made at the entity level."
- Engine: No fact marks a business, a K-1 entity or a self-rental's lessee as trading in financial instruments or commodities (comments in bindings.ts:64, lines.ts:66 and lines.ts:111 say so). With line G Yes, line 4b takes the Schedule C net out (a loss is added back), line 5b takes out the Form 4797 gain of that business, a K-1 box 1 amount of a materially participating owner comes out, and a recharacterized self-rental comes out. Nothing is unsupported and nothing is asked.
- Effect: A trader with a mark-to-market election records a Schedule C business (line G Yes) and a Form 4797 ordinary gain of $100,000 for it: line 5b is -$100,000, so NII is $100,000 too low and the tax up to $3,800 too low. A trader's Schedule C expenses of $15,000 are added back on line 4b unless the taxpayer also states them for line 10.
- Who meets this: Rare: a trader, or an owner of a trading partnership, who materially participates.
- Code: `engine/src/federal/8960/bindings.ts:69`

**8960-F11** (medium confidence). Line 13 reads a blank or unsupported Form 1040 line 11b as 0, so line 17 prints $0 (the comment on line 15 says it cannot).

- Text, `irs-8960-inst-2025::sec::line-13-modified-adjusted-gross-income-magi::b01`: "your MAGI is your AGI as reported on Form 1040 or 1040-SR."
- Text, `irs-8960-face-2025::sec::face-part-iii::b01`: "15 Subtract line 14 from line 13. If zero or less, enter -0-"
- Engine: Line 13 is sum(form-1040.line.11b, add-back). A cross-form read of a blank or unsupported line is undefined and sum counts it as 0, so line 13 is the number 0. Line 15 waits only while line 13 is not a number, so it is 0, line 16 is 0 and line 17 is $0. The comment 'line 15 waits while line 13 is blank or a gap, so line 17 never shows a $0 it did not figure' is not true for this path. Lines 1, 2 and 5a read their Form 1040 lines the same way. Form 1040 line 11b is blank while line 9 waits or is a gap (1040/adjustmentsAndDeductions.ts:24), for example with a Schedule C business that has line G No, whose line 31 stays blank.
- Effect: Wages $300,000 and a Schedule C profit of $50,000 with line G No: Schedule 1 line 3 and Form 1040 line 11b are blank, Form 8960 files (a passive business is an investment signal) and prints line 13 = 0 and line 17 = $0. The texts give $1,900. The Form 1040 is incomplete in the same case, so this is a $0 shown where a blank belongs.
- Who meets this: Any return where Form 1040 line 11b waits or is a gap while Form 8960 files. Read from the code; not run on a full return.
- Code: `engine/src/federal/8960/bindings.ts:141`

**8960-F13** (medium confidence). Gain from net unrealized appreciation in employer securities stays in NII.

- Text, `irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b03`: "is a distribution within the meaning of section 1411(c)(5)"
- Text, `usc-26-2025::sec::s1411::c-5`: "The term "net investment income" shall not include any distribution from a plan or arrangement described in section 401(a), 403(a), 403(b), 408, 408A, or 457(b)."
- Engine: The Form 1099-R fact has box 6 (net unrealized appreciation), but no part of line 5b reads it and no trade fact says its shares came from a plan. The sale's whole gain is on line 5a and stays in NII; nothing is unsupported, except on a return with a PFIC, where a pension on Form 1040 line 5a makes line 5b a gap (pficLines.ts:47).
- Effect: Employer shares distributed with $80,000 of NUA are sold for a gain of $100,000: the texts take $80,000 out on line 5b; the engine takes out $0. Tax up to $3,040 too high.
- Who meets this: Rare, and the engine lacks the input that ties a sale to the distribution, so it cannot figure the amount today; the gap is silent.
- Code: `engine/src/federal/8960/line5b.ts:130`

### Class 2: two texts disagree and the engine follows one

**8960-F7** (medium confidence). Line 9b lets property taxes through: the instructions allow them, the regulation lists income taxes only.

- Text, `irs-8960-inst-2025::sec::line-9b-state-local-and-foreign-income-tax::b01`: "Include also state, local, and foreign real property taxes paid for the tax year"
- Text, `cfr-26-2025::sec::s1.1411-4::f-3-iii`: "State, local, and foreign income, war profits, and excess profit taxes described in section 164(a)(3)"
- Engine: Follows the instructions. The cap is Schedule A line 5e, the total of income (or sales), real estate and personal property taxes, and the question asks for the part of 'the state and local tax' on Schedule A that belongs to investment income, so a share of property tax can be stated.
- Effect: A $5,000 real estate tax on investment land (not a rental), all allocated to NII: the instructions and the engine deduct $5,000; the regulation's list gives $0. Tax $190 lower with the instructions.
- Who meets this: Uncommon: property tax on a non-rental investment property (a rental's tax is on Schedule E).
- Code: `engine/src/federal/8960/bindings.ts:152`

### Class 3: a text is unclear, in error, or not in the library

**8960-F12** (high confidence). The line 4a instructions say income 'not subject to' self-employment tax goes on line 4b; the statute says the opposite.

- Text, `irs-8960-inst-2025::sec::line-4a-income-from-trades-businesses::b02`: "Additionally, income entered on Schedules C, E, and F (Form"
- Text, `irs-8960-inst-2025::sec::line-4a-income-from-trades-businesses::b02`: "is also entered as a negative on"
- Text, `usc-26-2025::sec::s1411::c-6`: "Net investment income shall not include any item taken into account in determining self-employment income"
- Text, `cfr-26-2025::sec::s1.1411-9::a`: "Except as provided in paragraph (b) of this section, net investment income does not include any item taken into account in determining self-employment income"
- Engine: Follows the statute and the line 4b list: Schedule C and farm income (self-employment income) comes out on line 4b; income not subject to self-employment tax (a passive rental, portfolio income) stays in NII.
- Effect: No dollars if the sentence is a typing error. Read as printed, it would take rental and other income not subject to self-employment tax out of NII: for $50,000 of passive rental income, $1,900 less tax.
- Who meets this: Every return with Schedule C, E or F income; the engine's reading matches the statute.
- Code: `engine/src/federal/8960/bindings.ts:69`

### Class 4: a possible loophole

**8960-F10** (medium confidence). Line 10 takes any stated amount: no kind, no cap, no sign check.

- Text, `irs-8960-inst-2025::sec::part-ii-investment-expenses::b08`: "Unless a deduction is specifically identified as"
- Text, `cfr-26-2025::sec::s1.1411-4::f-6`: "Any other deduction allowed by subtitle A that is identified in published guidance"
- Text, `irs-8960-inst-2025::sec::line-10-additional-modifications::b01`: "You may use line 10 to report properly allocable"
- Engine: Line 10 is the stated fact investment_income.niit_additional_modifications, rounded, when it is not 0. The fact has no description of the deduction, is not compared with any line of the return, and may be negative. Line 12 then floors at 0.
- Effect: A stated $50,000 with NII of $50,000 brings line 12 to $0 and removes $1,900 of tax, with no record of which deduction named in the regulation it is.
- Who meets this: Only a taxpayer who volunteers an amount; Cade does not ask.
- Code: `engine/src/federal/8960/bindings.ts:126`

## Form 8995

### Class 1: the texts agree and the engine does something else or less

**8995-F1** (medium confidence). QBI stays blank, with no reason and no question, when the owner has two businesses or the spouse has one.

- Text, `cfr-26-2025::sec::s1.199a-3::b-1-vi`: "are considered attributable to a trade or business to the extent that the individual's gross income from the trade or business is taken into account in calculating the allowable deduction, on a proportionate basis to the gross income received from the trade or business"
- Text, `irs-8995-inst-2025::sec::determining-your-qualified-business::b01`: "deductible part of self-employment tax,"
- Engine: selfEmploymentDeduction returns undefined (blank, not unsupported) for a spouse's business, and for any business that is not the owner's only one while Schedule SE files. The comment says no rule splits Schedule SE line 13; the regulation gives one (in proportion to gross income). The blank goes to lines 2, 4, 5, 10 and 15, and Form 1040 line 14 then waits (1040/adjustmentsAndDeductions.ts:115). Form 8995's missingInputs (8995/resolveInfo.ts:19) lists nothing for it.
- Effect: No dollars are computed: a taxpayer with two Schedule C businesses and Schedule SE gets a blank Form 8995 line 15 and a blank Form 1040 line 14, and nothing says why. By the regulation, two businesses with gross income of $60,000 and $40,000 and a $7,000 line 13 take $4,200 and $2,800.
- Who meets this: Common: two Schedule C businesses (or a Schedule C and a farm) of one person, or a joint return where the spouse has a business.
- Code: `engine/src/federal/qbi/lines.ts:87`

**8995-F2** (high confidence). Line 3 leaves out last year's loss carryforward once a K-1 gives a carried loss.

- Text, `irs-8995-face-2025::sec::face-page-1::b01`: "3 Qualified business net (loss) carryforward from the prior year"
- Text, `usc-26-2025::sec::s199a::c-2`: "such amount shall be treated as a loss from a qualified trade or business in the succeeding taxable year."
- Text, `irs-8995-inst-2025::sec::line-3::b01`: "Include here the qualified portion of trade or business (loss)"
- Engine: With no K-1 amount, line 3 is unsupported (no fact gives last year's Form 8995 line 16). With one K-1 carried basis loss allowed this year, line 3 is that K-1's part only, as a plain number: the gap for last year's line 16 is gone and nothing asks for it (recorded as a default in federal/passThrough/QUESTIONS.md item 26).
- Effect: Last year's line 16 is $10,000, the K-1's carried qualified loss allowed is $2,000, line 2 is $30,000. Line 4 should be $18,000; the engine prints $28,000. Line 5 is $2,000 too high, so the deduction is up to $2,000 too high.
- Who meets this: Rare: a K-1 owner with a basis loss carried in and allowed this year who also had a net QBI loss last year.
- Code: `engine/src/federal/8995/bindings.ts:86`
- Note from the check: The engine records this as a default in the pass-through QUESTIONS.md, item 26.

**8995-F3** (medium confidence). A carried K-1 loss is split pro rata between QBI and non-QBI; the texts require oldest year first.

- Text, `cfr-26-2025::sec::s1.199a-3::b-1-iv-A`: "These losses are used for purposes of section 199A and this section in order from the oldest to the most recent on a first-in, first-out (FIFO) basis"
- Text, `irs-8995-inst-2025::sec::specific-instructions-2::b02`: "the First-In-First-Out (FIFO) method must be used."
- Text, `irs-8995-inst-2025::sec::specific-instructions-2::b02`: "All prior year suspended losses allowed allocated to pre-2018 years are"
- Engine: priorYearQbiLossOf: allowed carried loss x carriedQualifiedBusinessLoss / the whole carried loss. The holding gives one qualified amount for all years (facts/kinds/k1Holding.ts:146), so the code cannot use the oldest year first.
- Effect: Carried basis loss $10,000: $4,000 from 2017 (not QBI) and $6,000 from 2023 (QBI). $5,000 is allowed in 2025. FIFO: $4,000 of 2017 and $1,000 of 2023, so line 3 is $1,000. The engine: $5,000 x 6,000 / 10,000 = $3,000. Line 4 is $2,000 too low and the deduction $400 too low. With the QBI year older, the error goes the other way.
- Who meets this: Rare: a carried basis loss from more than one year with different QBI shares (a pre-2018 year among them), allowed only in part. A loss from one year, or allowed in full, gives the same result.
- Code: `engine/src/federal/qbi/resolveInfo.ts:149`

### Class 3: a text is unclear, in error, or not in the library

**8995-F4** (medium confidence). Effective date not checkable: the statute text has a $75,000 / $150,000 phase-in range and a $400 minimum deduction; the 2025 instructions and the engine have neither.

- Text, `usc-26-2025::sec::s199a::d-3-A`: "the taxable income of any taxpayer is less than the sum of the threshold amount plus $75,000 ($150,000 in the case of a joint return)"
- Text, `irs-8995-inst-2025::sec::determining-your-qualified-trades-or::b05`: "Exception 2: If your taxable income before the QBI deduction"
- Text, `usc-26-2025::sec::s199a::i-1`: "the deduction allowed under subsection (a) for the taxable year shall be equal to the greater of—"
- Text, `usc-26-2025::sec::s199a::i-2`: "at least $1,000."
- Engine: QBI_LIMITS holds a range of 50000 (100000 joint), as the 2025 instructions do ($197,300 to $247,300; $394,600 to $494,600); Form 8995 does not use the range. Line 15 is the smaller of lines 10 and 14 with no minimum, as the 2025 form face prints it.
- Effect: If the statute text applied to 2025: a taxpayer with $1,000 of QBI from a business in which the taxpayer materially participates gets $200 on line 15 of the form and $400 by the statute text. The range changes only Form 8995-A (a single filer at $222,300 is 50% through a $50,000 range and one third through a $75,000 range). The library holds the current statute text with no notes, so the first year of each change cannot be checked here; the 2025 form and instructions do not have them.
- Who meets this: Only if the amendments apply to 2025. A person must check the effective date in the statutory notes.
- Code: `engine/src/federal/qbi/lines.ts:17`

**8995-F5** (high confidence). Amount not checkable against the law: the 2025 threshold ($197,300 / $394,600) is on the form and in the instructions only.

- Text, `irs-8995-face-2025::sec::face-page-1::b01`: "at or below $197,300 ($394,600 if married filing jointly)"
- Text, `usc-26-2025::sec::s199a::e-2`: "The term "threshold amount" means $157,500 (200 percent of such amount in the case of a joint return)."
- Engine: QBI_LIMITS: 197300 for single, married filing separately, head of household and qualifying surviving spouse; 394600 for married filing jointly. These match the form face.
- Effect: No dollars: the engine matches the form face. The statute holds the 2018 base amount; the year's adjusted amount comes from a revenue procedure the library does not hold.
- Who meets this: Every return with QBI; a check of the source only.
- Code: `engine/src/federal/qbi/lines.ts:17`

### Class 4: a possible loophole

**8995-F6** (medium confidence). An explicit decision to file Form 8995 is not checked against the income limit.

- Text, `irs-8995-face-2025::sec::face-page-1::b01`: "at or below $197,300 ($394,600 if married filing jointly)"
- Text, `irs-8995-inst-2025::sec::who-can-take-the-deduction::b01`: "Otherwise, use Form 8995-A, Qualified Business Income"
- Engine: qbiMustFile passes decisions.scope.must_file_8995 to resolveMustFile as the explicit key, and a boolean there wins before any fallback (resolverInputs.ts:131). The same decision set to true also takes Form 8995-A off the return (whichForm.ts:110). Form 8995 then computes with no income test, no wage or property limit and no specified-service reduction.
- Effect: A single consultant (a specified service business) with $250,000 of QBI and $300,000 of taxable income before the deduction, and the decision set to true: Form 8995 line 15 is $50,000 (the smaller of $50,000 and $60,000). Above the phase-in range Form 8995-A allows $0 for a specified service business.
- Who meets this: Only when the decision decisions.scope.must_file_8995 is recorded as true for a return above the threshold. The fallback rule alone never does this.
- Code: `engine/src/federal/qbi/whichForm.ts:123`

**8995-F7** (low confidence). Form 1099-DIV box 5 goes to line 6 with no check of the 45-day holding period.

- Text, `cfr-26-2025::sec::s1.199a-3::c-2`: "That is held by the shareholder for 45 days or less"
- Text, `irs-8995-inst-2025::sec::determining-your-qualified-reit::b01`: "Qualified REIT dividends include any dividends you received"
- Engine: form1099ReitDividends adds box 5 of every Form 1099-DIV, and line 6 prints the total with the K-1 section 199A dividends. No input gives the holding period or an obligation to make related payments.
- Effect: A holder who bought REIT shares 10 days before the ex-dividend date and sold them 20 days after it, with $1,000 in box 5: line 6 is $1,000 too high, line 9 is $200 too high, so the deduction is up to $200 too high.
- Who meets this: Rare: a short holding of REIT or fund shares around the dividend date.
- Code: `engine/src/federal/qbi/resolveInfo.ts:30`

## Schedule 8812

### Class 1: the texts agree and the engine does something else or less

**schedule-8812-F1** (medium confidence). The child tax credit is given without a check of the taxpayer's own SSN.

- Text, `irs-1040s8-inst-2025::sec::taxpayer-identification-number::b01`: "If you, and your spouse if filing jointly, do not have a valid SSN, you can't claim the CTC or ACTC on either your original or an amended 2025 return."
- Text, `irs-1040s8-inst-2025::sec::what-s-new::b01`: "Beginning in tax year 2025, you must have a valid SSN to claim the CTC or ACTC."
- Text, `usc-26-2025::sec::s24::h-7`: "(i) the taxpayer's social security number (or, in the case of a joint return, the social security number of at least 1 spouse), and"
- Text, `usc-26-2025::sec::s24::h-4`: "(C) Certain qualifying children.—In the case of any qualifying child with respect to whom a credit is not allowed under this section by reason of paragraph (7), such child shall be treated as a dependent to whom subparagraph (A) applies."
- Engine: dependentCredit() reads only the dependent's answers. No fact says that the taxpayer (and the spouse) has an ITIN and no SSN, and nothing is unsupported or asked. The code comment names the gap: "a taxpayer with only an ITIN has no fact yet".
- Effect: A single filer with an ITIN, one child under 17 with an SSN, and tax of $3,000: the engine gives $2,200 on line 14. The texts give no child tax credit; by section 24(h)(4)(C) the child gets $500. The credit is $1,700 too high, and any additional child tax credit is given too.
- Who meets this: Rare: a return where no filer has an SSN valid for employment. The engine has no input for it, so the number in the SSN field is taken as an SSN.
- Code: `engine/src/facts/kinds/dependents.ts:305`

**schedule-8812-F2** (medium confidence). Line 21 leaves out tier 1 railroad retirement tax (Form W-2 box 14).

- Text, `irs-1040s8-inst-2025::sec::additional-medicare-tax-and-rrta-tax-worksheet::b02`: "8. Enter the Tier 1 tax (Form(s) W-2, box 14)"
- Text, `irs-1040s8-inst-2025::sec::additional-medicare-tax-and-rrta-tax-worksheet::b03`: "16. Add lines 6, 7, 11, and 15."
- Text, `usc-26-2025::sec::s24::d-2`: "(i) the amount of the taxes imposed by sections 3101 and 3201(a) on amounts received by the taxpayer during the calendar year in which the taxable year begins,"
- Engine: Adds W-2 boxes 4 and 6 and the Form 8959 amounts (lines 1 to 7 of the worksheet). Lines 8 to 15 (tier 1 tax and tier 1 Medicare tax in box 14, Form 8959 line 17, Forms CT-2) are not read. The W-2 fact holds box 14 entries. Only a comment says "Tier 1 RRTA has no fact"; the line is not unsupported. Credit Limit Worksheet B line 7 uses the same function.
- Effect: A railroad employee with 3 children, $4,000 of pay, $306 of tier 1 tax in box 14 and no earned income credit: line 20 is $225, line 25 is $306 by the worksheet and $0 in the engine, so line 27 is $225 where the texts give $306. $81 too low.
- Who meets this: Rare: a railroad employee (or employee representative) with 3 or more qualifying children whose line 20 is less than line 17 and whose earned income credit is less than the taxes.
- Code: `engine/src/federal/schedule-8812/worksheetB.ts:65`

**schedule-8812-F3** (high confidence). Line 2b is an engine gap on every return with no Form 2555, with a reason that is no longer true.

- Text, `irs-1040s8-face-2025::sec::face-part-i::b01`: "b Enter the amounts from lines 45 and 50 of your Form 2555"
- Engine: Without Form 2555 the binding returns unsupported("The foreign earned income and housing exclusions (Form 2555) have no fact kind."). The engine now has Form 2555 (federal/2555) and reads its lines 45 and 50 on this line. A filer with no Form 2555 has nothing to enter: the line is blank, not a gap.
- Effect: No dollars: sum() counts the gap as 0. Every Schedule 8812 with no Form 2555 lists a gap that does not exist (tests/unit/federal/2555/form.test.ts:71 expects it).
- Who meets this: Common: every return that files Schedule 8812 and no Form 2555.
- Code: `engine/src/federal/schedule-8812/bindings.ts:65`

**schedule-8812-F4** (low confidence). A child born and died in 2025 with no SSN gets neither credit.

- Text, `irs-1040s8-inst-2025::sec::taxpayer-identification-number::b02`: "If your qualifying child was born and died in 2025 and you do not have an SSN for the child, attach a copy of the child's birth certificate, death certificate, or hospital records."
- Engine: dependentCredit() gives the child tax credit only with dependent.ssn, and with no SSN and no other TIN the result is "none". The dependent fact takes a date of birth and a date of death in 2025, but no rule uses them for the SSN.
- Effect: A child born and died in 2025, no SSN, parents with tax of $3,000: the engine gives $0 for the child where the instructions let the parent claim the child with the attachment ($2,200).
- Who meets this: Rare.
- Code: `engine/src/facts/kinds/dependents.ts:332`

**schedule-8812-F5** (medium confidence). No rule for an adopted child who is not a U.S. citizen, national or resident alien.

- Text, `irs-1040s8-inst-2025::sec::credits-for-qualifying-children::b03`: "If you are a U.S. citizen or U.S. national and your adopted child lived with you all year as a member of your household in 2025, that child meets condition (3), earlier, to be a qualifying person for the ODC."
- Engine: The citizenship test is the one stated answer usCitizenOrResident. With false the result is "none" for every dependent; the relationship (adopted child), the months in the home and the taxpayer's citizenship are not read for an exception.
- Effect: A U.S. citizen with an adopted child who is a nonresident alien with an ATIN and lived with the citizen all year: the engine gives $0, the instructions give the $500 credit for other dependents.
- Who meets this: Rare. The right result comes only if the answer is recorded as true against the field's name.
- Code: `engine/src/facts/kinds/dependents.ts:335`

### Class 3: a text is unclear, in error, or not in the library

**schedule-8812-F6** (medium confidence). Effective date not checkable: points where the current section 24 text and the 2025 form can differ by an amendment's start date.

- Text, `usc-26-2025::sec::s24::h-2`: "Subsection (a) shall be applied by substituting "$2,200" for "$1,000"."
- Text, `usc-26-2025::sec::s24::h-7`: "(i) the taxpayer's social security number (or, in the case of a joint return, the social security number of at least 1 spouse), and"
- Text, `irs-1040s8-inst-2025::sec::what-s-new::b01`: "Beginning in tax year 2025, you must have a valid SSN to claim the CTC or ACTC."
- Text, `usc-26-2025::sec::s24::h-7`: "(ii) before the due date for such return."
- Text, `irs-1040s8-inst-2025::sec::taxpayer-identification-number::b01`: "Valid SSN. For the CTC and ACTC, a valid SSN is one that is valid for employment and that is issued by the Social Security Administration before the due date of your 2025 return"
- Text, `usc-26-2025::sec::s24::j-1`: "The amount of the credit allowed under this section to any taxpayer for any taxable year shall be reduced (but not below zero) by the aggregate amount of payments made under section 7527A to such taxpayer during such taxable year."
- Text, `usc-26-2025::sec::s24::g`: "no credit shall be allowed under this section for any subsequent taxable year unless the taxpayer provides such information as the Secretary may require to demonstrate eligibility for such credit."
- Text, `irs-1040s8-inst-2025::sec::improper-claims::b01`: "If your CTC, ACTC, or ODC for a year after 2015 was denied or reduced for any reason other than a math or clerical error, you must attach Form 8862 to your tax return to claim the CTC, ACTC, or ODC unless an exception applies."
- Text, `usc-26-2025::sec::s24::i`: "the $1,400 amount in subsection (h)(5) shall be increased by an amount equal to—"
- Engine: Follows the 2025 form: $2,200 for each child, $500 for each other dependent, $400,000 and $200,000 thresholds, $2,500 floor, 15%, and no line for advance payments. It does not check the taxpayer's SSN (F1) or any issue date.
- Effect: No dollars known. The library holds the current code with no notes, so these cannot be checked for 2025: (1) the year the $2,200 starts; (2) the year the taxpayer's SSN rule starts (the instructions say 2025); (3) the instructions add "(including extensions)" to the due date, the statute passage does not; (4) section 24(j) reduces the credit by advance payments and the 2025 form has no line for them (the years 24(j) applies to are in text or notes not held); (5) the instructions limit the Form 8862 rule to a year after 2015, the statute passage has no date; (6) the first year of the inflation adjustment of the $1,400 and of the $2,200.
- Who meets this: Every return with the schedule, if a start date differs from what the form shows.
- Code: `engine/src/federal/schedule-8812/bindings.ts:26`

**schedule-8812-F7** (high confidence). Amount not checkable: the $1,700 for each child (and the $5,100 test) comes from a revenue procedure the library does not hold.

- Text, `irs-1040s8-face-2025::sec::face-part-i::b03`: "b Number of qualifying children under age 17 with the required social security number: x $1,700. Enter the result."
- Text, `usc-26-2025::sec::s24::h-5`: "shall not exceed $1,400"
- Text, `usc-26-2025::sec::s24::i`: "the $1,400 amount in subsection (h)(5) shall be increased by an amount equal to—"
- Engine: Uses $1,700 for each child (ADDITIONAL_CREDIT_PER_CHILD) and $5,100 for the Part II-B test, as the form face prints them.
- Effect: No dollars: the engine and the form agree. Only the step from the statute's $1,400 to $1,700 cannot be checked.
- Who meets this: Every return with Part II-A.
- Code: `engine/src/federal/schedule-8812/worksheetB.ts:31`

**schedule-8812-F8** (low confidence). A child born on January 1, 2009: no Schedule 8812 text says whether the child is under 17 at the end of 2025.

- Text, `irs-1040s8-inst-2025::sec::credits-for-qualifying-children::b01`: "the child must be your dependent, under age 17 at the end of 2025"
- Text, `usc-26-2025::sec::s24::c`: "who has not attained age 17."
- Text, `irs-1040-inst-2025::sec::tax-table-or-tax-computation-work::b02`: "A child born on January 1, 2008, is considered to be age 18 at the end of 2025"
- Engine: Age is 2025 minus the birth year; the month and day are not read. A child born on January 1, 2009 is 16 and gets the child tax credit.
- Effect: If the rule the Form 1040 instructions state for another line (a January 1 birthday counts as the age reached the day before) applies here, the child is 17 at the end of 2025: the engine gives $2,200 where the texts give $500, $1,700 too high.
- Who meets this: Rare: a child born on January 1, 2009.
- Code: `engine/src/facts/kinds/dependents.ts:249`

**schedule-8812-F9** (low confidence). Credit Limit Worksheet A has no floor at zero, and the engine lets lines 13 and 14 go below zero.

- Text, `irs-1040s8-inst-2025::sec::line-21::b03`: "5. Subtract line 4 from line 3. Enter here and on Schedule 8812, line 13."
- Text, `irs-1040s8-face-2025::sec::face-part-i::b02`: "14 Enter the smaller of line 12 or line 13. This is your child tax credit and credit for other dependents"
- Text, `irs-1040s8-inst-2025::sec::limits-on-the-ctc-and-odc::b01`: "If the amount is zero, you cannot take either credit because there is no tax to reduce."
- Engine: Line 13 is Form 1040 line 18 less the Schedule 3 credits less Worksheet B line 15, with no floor. Line 14 is Math.min(line 12, line 13), so a negative line 13 is a negative credit on Form 1040 line 19 (federal/1040/taxAndCredits.ts:137), and line 16a (line 12 less line 14) is more than line 12.
- Effect: If Schedule 3 credits of $1,200 meet tax of $1,000: line 13 is -$200, Form 1040 line 19 is -$200 (tax $200 too high), and line 16a is $200 more than line 12.
- Who meets this: Only if the Schedule 3 credits the worksheet subtracts can exceed Form 1040 line 18 in the engine. Each credit form has its own tax limit, so this may never run.
- Code: `engine/src/federal/schedule-8812/bindings.ts:198`

## Schedule A

### Class 1: the texts agree and the engine does something else or less

**schedule-a-F1** (high confidence). Line 5a leaves out state estimated tax payments: it reads a fact that no question records.

- Text, `irs-1040sa-inst-2025::sec::state-and-local-income-taxes::b01`: "State and local estimated tax payments made during 2025"
- Text, `usc-26-2025::sec::s164::a`: "State and local, and foreign, income, war profits, and excess profits taxes."
- Engine: Line 5a adds the fact state_local_tax.estimated_payments (0 when it is missing). The key is not in the form's missing inputs, the deductions catalog gives the state income tax item no amount key, and nothing in cade/src names the key. Cade records California estimates as ca_payments.estimated_tax and ca_payments.prior_year_overpayment_applied (Form 540 line 72); Schedule A does not read them. A fix cannot copy those facts as they are: a fourth payment made in January 2026 is not paid in 2025.
- Effect: W-2 box 17 of $15,000 and $20,000 of California estimates paid in 2025: line 5a is $15,000, not $35,000. Line 17 is $20,000 too low (the $40,000 limit is not reached); at 35% that is $7,000 of tax.
- Who meets this: Common for the target user: an itemizer with RSU, K-1 or investment income who pays state estimates.
- Code: `engine/src/federal/schedule-a/resolveInfo.ts:260`

**schedule-a-F2** (high confidence). Line 5a leaves out state tax withheld on forms other than Form W-2.

- Text, `irs-1040sa-inst-2025::sec::state-and-local-income-taxes::b01`: "Forms W-2G, 1099-G, 1099-R, 1099-MISC, and 1099-NEC may also show state and local income taxes withheld"
- Text, `irs-1040sa-inst-2025::sec::state-and-local-income-taxes::b01`: "Mandatory contributions you made to the California, New Jersey, or New York Nonoccupational Disability Benefit Fund"
- Engine: Line 5a adds W-2 box 17 only. The engine holds the other boxes and adds them to Form 540 line 71 (engine/src/state/ca/540/withholding.ts: W-2G box 15, 1099-INT box 17, 1099-K box 8, 1099-MISC box 16, 1099-NEC box 5, 1099-R box 14). Two smaller points in the same sum: the SDI amount counts only when the box 14 label matches 'CA SDI' (a label 'SDI' or 'VPDI' is not counted), and the W-2 fact has no box 19, so local income tax has no input.
- Effect: A Form 1099-R with $3,000 in box 14 (California tax withheld): Form 540 line 71 counts it, Schedule A line 5a is $3,000 too low.
- Who meets this: Common: a retirement distribution, a bonus paid on Form 1099, or gambling winnings with state withholding.
- Code: `engine/src/federal/schedule-a/resolveInfo.ts:258`

**schedule-a-F3** (high confidence). Line 5a has no input for prior-year state tax paid in 2025, and its comment names amounts the code does not use.

- Text, `irs-1040sa-inst-2025::sec::state-and-local-income-taxes::b01`: "State and local income taxes paid in 2025 for a prior year, such as taxes paid with your 2024 state or local income tax return."
- Text, `irs-1040sa-inst-2025::sec::state-and-local-income-taxes::b02`: "Refund of or credit for prior year state and local income taxes you actually received in 2025."
- Engine: The field comment (filingInfo.ts:20) says line 5a is W-2 box 17 + CA SDI + state estimates + prior-year balance paid this year − last year's itemized refunds. The code adds only the first three. No fact holds the balance paid with the 2024 state return, so the line leaves it out. The comment's refund subtraction is against the instructions (b02 lists it under 'Don't reduce your deduction by any'); the code is right to leave it out and the comment is stale.
- Effect: A $6,000 balance paid in April 2025 with the 2024 California return: line 5a is $6,000 too low.
- Who meets this: Common: anyone who owed with last year's state return.
- Code: `engine/src/federal/schedule-a/resolveInfo.ts:274`

**schedule-a-F4** (high confidence). A mortgage over the debt limit leaves line 8a blank with no reason and no question.

- Text, `irs-1040sa-inst-2025::sec::line-8a::b01`: "Only enter on line 8a the deductible mortgage interest and points that were reported to you on Form 1098."
- Text, `irs-1040sa-inst-2025::sec::line-8::b04`: "See Pub. 936 to figure your deduction if you have loans taken out after October 13, 1987, that exceed $750,000 ($375,000 if you are married filing separately)."
- Text, `irs-pub-936-2025::sec::home-acquisition-debt::b02`: "Any secured debt you use to refinance home acquisition debt is treated as home acquisition debt."
- Text, `usc-26-2025::sec::s163::h-3-F-i-V`: "who purchases such residence before April 1, 2018, subclause (IV) shall be applied by substituting "April 1, 2018" for "December 15, 2017"."
- Engine: When box 2 is over the limit, mortgageInterestWithinLimit returns interest undefined and limited true. Line 8a is then blank (undefined, not unsupported), lines 8e, 10 and 17 are blank, Form 1040 line 12e is blank, and the form's missing inputs hold nothing for it. The engine's own rule is that a gap is unsupported(reason) and a blank line has a question. The same blank covers two cases the texts treat as the older, $1,000,000 loan: a refinanced loan from before December 16, 2017 (box 3 shows the new date) and the binding-contract exception.
- Effect: No dollars are wrong. A $900,000 loan from 2021: the itemized return never finishes and no line says why.
- Who meets this: Common for the target user: a California home loan above $750,000.
- Code: `engine/src/federal/schedule-a/resolveInfo.ts:90`

**schedule-a-F5** (medium confidence). The debt limit tests one Form 1098 only: interest on line 8b and points on line 8c are outside it.

- Text, `irs-pub-936-2025::sec::part-ii::b01`: "Your home mortgage interest deduction is limited to the interest on the part of your home mortgage debt that isn't more than your qualified loan limit."
- Text, `usc-26-2025::sec::s163::h-3-B`: "The aggregate amount treated as acquisition indebtedness for any period shall not exceed $1,000,000 ($500,000 in the case of a married individual filing a separate return)."
- Engine: The limit compares the one Form 1098's box 2 with $750,000 or $1,000,000. Lines 8b and 8c copy the stated amounts with no limit, and their loan's principal is not added to the test. The limit in the texts is on all home debt together (main and second home).
- Effect: A $700,000 bank loan (Form 1098, $35,000 interest) and a $400,000 seller-financed loan on a second home ($20,000 interest, line 8b), both from 2022: the engine deducts $55,000. Debt is $1,100,000 against a $750,000 limit, so about $37,500 is deductible: $17,500 too much.
- Who meets this: Rare: a second loan with no Form 1098 and total debt over the limit. The case holds only if the stated line 8b amount is the interest paid and not an amount the taxpayer already limited; the fact's comment says 'interest not reported on a Form 1098'.
- Code: `engine/src/federal/schedule-a/bindings.ts:188`

**schedule-a-F6** (medium confidence). Form 1098 interest is deducted in full with no question on how the loan proceeds were used.

- Text, `irs-1040sa-inst-2025::sec::line-8::b02`: "You can only deduct home mortgage interest to the extent that the loan proceeds from your home mortgage are used to buy, build, or substantially improve the home securing the loan"
- Text, `irs-1040sa-inst-2025::sec::line-8::b01`: "Interest paid on home mortgage proceeds used for other purposes isn't deductible on lines 8a or 8b."
- Text, `usc-26-2025::sec::s163::h-3-B`: "is incurred in acquiring, constructing, or substantially improving any qualified residence of the taxpayer"
- Engine: Line 8a is Form 1098 box 1 plus box 6 when box 2 is within the limit. No fact or decision records the use of the proceeds, and Cade's Form 1098 skill does not ask. The line 8 checkbox is in the unsupported list ('no fact or decision key exists'), which reports the box on every return and does not stop the dollars.
- Effect: A $100,000 home equity loan used for a car and tuition, $7,000 of interest on its Form 1098: the engine deducts $7,000; the texts allow $0.
- Who meets this: Not rare: a home equity loan or a cash-out refinance used for something other than the home.
- Code: `engine/src/federal/schedule-a/resolveInfo.ts:88`

**schedule-a-F7** (high confidence). Gifts to charity have no percentage-of-income limit and no guard.

- Text, `irs-1040sa-inst-2025::sec::line-11::b01`: "Only enter on line 11 the deductible value of gifts you made in cash or by check."
- Text, `irs-pub-526-2025::sec::limits-on-deductions::b01`: "The amount you can deduct for charitable contributions is generally limited to no more than 60% of your AGI."
- Text, `usc-26-2025::sec::s170::b-1-G-i`: "60 percent of the taxpayer's contribution base for the taxable year"
- Text, `usc-26-2025::sec::s170::b-1-C-i`: "shall not exceed 30 percent of the taxpayer's contribution base for such year"
- Engine: Line 11 is the stated cash gifts plus the K-1 cash gifts, line 12 the gift deductions, line 13 the stated carryover, line 14 their sum. No line compares anything with Form 1040 line 11b, nothing is unsupported when the total is high, and no carryover to 2026 is figured. The code comments say 'Before the AGI limits'. The instructions' 30% and 20% figures only say when to read Pub. 526; Pub. 526 and the statute agree on the limits, so this is not a disagreement of texts.
- Effect: AGI $400,000 and $200,000 of stock held over a year given to a public charity: the engine deducts $200,000; the limit is 30%, $120,000, and $80,000 carries over. Line 17 is $80,000 too high.
- Who meets this: Uncommon, but it is the target user's case: a large gift of appreciated stock, or cash gifts over 60% of income.
- Code: `engine/src/federal/schedule-a/bindings.ts:231`

### Class 3: a text is unclear, in error, or not in the library

**schedule-a-F8** (low confidence). Effective date not checkable: five places where the statute text in the library differs from the 2025 form.

- Text, `usc-26-2025::sec::s165::d`: "shall be equal to 90 percent of the amount of such losses during such taxable year, and"
- Text, `usc-26-2025::sec::s170::b-1-I`: "shall be allowed only to the extent that the aggregate of such contributions exceeds 0.5 percent of the taxpayer's contribution base for the taxable year."
- Text, `usc-26-2025::sec::s68::a`: "the amount of the itemized deductions otherwise allowable for the taxable year (determined without regard to this section) shall be reduced by 2⁄37 of the lesser of—"
- Text, `usc-26-2025::sec::s67::a`: "the miscellaneous itemized deductions for any taxable year shall be allowed only to the extent that the aggregate of such deductions exceeds 2 percent of adjusted gross income."
- Text, `usc-26-2025::sec::s165::h-5-A`: "shall be allowed as a deduction under subsection (a) only to the extent it is attributable to a Federally declared disaster (as defined in subsection (i)(5)) or a State declared disaster."
- Text, `irs-1040sa-inst-2025::sec::other-itemized-deductions-2::b01`: "but only to the extent of gambling winnings reported on Schedule 1 (Form 1040), line 8b."
- Engine: The engine follows the 2025 form and instructions in each place: (1) gambling losses in full up to winnings, not 90%; (2) no 0.5% floor on gifts; (3) no overall reduction of line 17; (4) line 16 takes only the listed items, with no 2% floor; (5) line 15 is Form 4684 line 18, which the form limits to federally declared disasters. The library holds the current statute and not its notes, so no text here says when each amendment starts. Each difference can be an amendment that starts after 2025.
- Effect: If an amendment applied to 2025, for example $10,000 of gambling winnings and losses: the form gives $10,000 on line 16, the statute text $9,000. The 2025 form and instructions show none of the five.
- Who meets this: Any itemizer for points 2 and 3 if the dates were 2025; the 2025 form and instructions, written for the year, apply none of them.
- Code: `engine/src/federal/schedule-a/bindings.ts:53`

### Class 4: a possible loophole

**schedule-a-F9** (medium confidence). The stated medical total is not tied to amounts the engine already knows were not out of pocket.

- Text, `irs-1040sa-inst-2025::sec::line-1::b01`: "if you claimed the self-employed health insurance deduction on Schedule 1 (Form 1040), line 17, reduce the premiums by the amount on line 17."
- Text, `irs-1040sa-inst-2025::sec::specific-instructions::b01`: "If you received a distribution from a health savings account or a medical savings account in 2025, see Pub. 969 to figure your deduction."
- Text, `irs-1040sa-inst-2025::sec::line-1::b01`: "If advance payments of the premium tax credit were made or you think you may be eligible to claim a premium tax credit, fill out Form 8962 before filling out Schedule A, line 1."
- Engine: Line 1 copies medical.expenses_total. The same return can hold Schedule 1 line 17 (Form 7206), tax-free HSA distributions for the same bills (Form 8889) and the premium tax credit (Form 8962). Nothing compares the stated total with them or asks whether it already leaves them out.
- Effect: AGI $100,000, $18,000 of premiums deducted on Schedule 1 line 17 and also inside a stated medical total of $30,000: line 4 is $22,500; with the premiums left out it is $4,500. $18,000 is deducted twice.
- Who meets this: Uncommon: an itemizer over the 7.5% floor who is self-employed, has an HSA or has Marketplace coverage. It holds only when the stated total includes those amounts; the question Cade asks decides that, and no engine text does.
- Code: `engine/src/federal/schedule-a/bindings.ts:109`

## Schedule S (California)

### Class 1: the texts agree and the engine does something else or less

**schedule-s-F1** (medium confidence). Line 7 is not prorated when the spouses file separate California returns and a joint return in the other state.

- Text, `ca-540-sched-s-inst-2025::sec::b-application-of-the-credit::b01`: "When a joint tax return is filed in the other state and separate California tax returns are filed, the credit is allowed in proportion to the income reported on each California tax return."
- Engine: Takes the stated tax paid as line 7 with no proration and no guard. The fact's comment does not tell the taxpayer to state only a share, and no field holds the spouse's income. QUESTIONS.md item 7 records this as a default.
- Effect: Married filing separately in California, joint New York return with $6,000 of tax, the spouses report 60% and 40% of the income in California. The 60% spouse states $6,000: line 11 can be $6,000 where the rule gives $3,600, so the credit is up to $2,400 too high (when line 6 does not limit it). If each spouse states $6,000 the credit is claimed twice.
- Who meets this: Rare: a married person who files separately in California and jointly in a listed state.
- Code: `engine/src/state/ca/schedule-s/lines.ts:129`

**schedule-s-F2** (low confidence). DC, New Hampshire and Tennessee are allowed for any stated tax; the kind of tax is not asked.

- Text, `ca-540-sched-s-inst-2025::sec::c-california-residents::b01`: "District of Columbia (DC) (unincorporated business tax and income tax, the latter for dual residents only)"
- Text, `ca-540-sched-s-inst-2025::sec::c-california-residents::b01`: "New Hampshire (NH) (business profits tax)"
- Text, `ca-540-sched-s-inst-2025::sec::c-california-residents::b01`: "Tennessee (TN) (excise tax only)"
- Engine: DC, NH and TN are in RESIDENT_CREDIT_STATES with no condition. The fact has no field for the kind of tax, and the dualResident answer is read for Virginia only, not for DC. No guard. QUESTIONS.md item 5 records it.
- Effect: A resident who is not a dual resident states $3,000 of DC income tax: the engine can give a credit of up to $3,000 where the rule gives $0.
- Who meets this: Only when a California resident pays a DC, NH or TN tax of a kind the list leaves out.
- Code: `engine/src/state/ca/schedule-s/lines.ts:26`

**schedule-s-F9** (high confidence). Stale comment: line 2's comment lists three other credits, the code subtracts nine.

- Text, `ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01`: "Residents – Form 540, line 48 (without other state tax credit and PTE elective tax credit)."
- Engine: The comment at returnAmounts.ts:30-33 (and QUESTIONS.md item 4) says the engine's other credits are this credit, the credit for prior year AMT and the PTE credit. The code below also subtracts the passive, prison labor, film, enterprise zone, LAMBRA and TTA credits, as the rule requires. The code is right; the comment is old.
- Effect: no dollars
- Who meets this: Readers of the code only.
- Code: `engine/src/state/ca/schedule-s/returnAmounts.ts:30`

### Class 3: a text is unclear, in error, or not in the library

**schedule-s-F4** (high confidence). Library limit: California regulation 18001-1 (title 18) is not in the library.

- Text, `ca-540-sched-s-inst-2025::sec::general-information::b01`: "See Cal. Code Regs., tit.18 section 18001-1, for more information."
- Text, `ca-rtc-2025::sec::s18001::a`: "net income taxes imposed by and paid to another state"
- Engine: Takes line 7 as stated and follows the instructions. Points that rest on the regulation and cannot be checked: what a net income tax is (R02); the line 7 exclusions for local, federal, foreign and non-net-income taxes (R41); whether another state's PTE elective tax counts (R23); the joint return rules, the proration included (R09, R10); the regulations under Chapter 11 behind the source list (R26).
- Effect: no dollars known: the engine and the instructions agree; the regulation was not read.
- Who meets this: Every Schedule S.
- Code: `engine/src/state/ca/schedule-s/lines.ts:129`

**schedule-s-F5** (low confidence). The state list and the group return exception rest on other states' laws that the library does not hold.

- Text, `ca-rtc-2025::sec::s18001::a-2`: "The credit shall not be allowed if the other state allows residents of this state a credit"
- Text, `ca-540-sched-s-inst-2025::sec::c-california-residents::b02`: "unless any of these states allow a credit for taxes paid to California on the group nonresident tax return"
- Engine: Uses the instruction's list as printed (it matches state by state). A stated group nonresident return allows the credit, AZ, OR and VA included; the 'unless' clause has no code and no guard (QUESTIONS.md item 6).
- Effect: A resident in an Arizona group return with a $2,000 share of tax: the engine can give $2,000; if Arizona allows a credit for California tax on that return the rule gives $0.
- Who meets this: Rare: a group (composite) nonresident return.
- Code: `engine/src/state/ca/schedule-s/lines.ts:47`

**schedule-s-F6** (medium confidence). Line 4: the instructions name no Schedule G-1 line for the lump-sum distribution.

- Text, `ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01`: "Residents – Form 540, line 17, and any lump-sum distribution from Schedule G-1"
- Text, `ca-rtc-2025::sec::s18001::a-3`: "the taxpayer's entire income upon which the "net tax" (as defined by Section 17039) is imposed by this part"
- Engine: Adds Schedule G-1 line 6 (capital gain) and line 10 (total taxable amount) to Form 540 line 17. QUESTIONS.md item 3 records it as the engine's own reading.
- Effect: Only with Schedule G-1. Another reading (the whole distribution before the death benefit exclusion on line 9) makes line 4 larger by that exclusion, at most $5,000 of income in the denominator, a few dollars of credit.
- Who meets this: Rare: a lump-sum distribution return that also has another state's tax.
- Code: `engine/src/state/ca/schedule-s/returnAmounts.ts:109`

**schedule-s-F7** (high confidence). Lines 5 and 10: half-up rounding and the zero or negative cases are rules the engine made with no text.

- Text, `ca-540-sched-s-face-2025::sec::face-part-ii::b01`: "5 Divide line 3 by line 4. Do not enter more than 1.0000."
- Text, `ca-540-sched-s-face-2025::sec::face-part-ii::b01`: "10 Divide line 8 by line 9. Do not enter more than 1.0000"
- Engine: Rounds the ratio half up to four places. A numerator of 0 or less gives 0. A denominator of 0 or less, or not above the numerator, gives 1.0000. QUESTIONS.md items 1 and 2.
- Effect: Line 2 of $50,000 and a true ratio of 0.20645: 0.2065 gives $10,325; dropping the fifth place gives $10,320. $5.
- Who meets this: Every Schedule S, a few dollars at most.
- Code: `engine/src/state/ca/schedule-s/lines.ts:59`

### Class 4: a possible loophole

**schedule-s-F3** (medium confidence). The source rule and the line 7 exclusions are stated answers that nothing checks.

- Text, `ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b01`: "the income that is taxed by the other state must also have a source in the other state"
- Text, `ca-540-sched-s-inst-2025::sec::h-income-from-sources-within-the-other-state::b01`: "California's nonresident sourcing principles apply even though the results may be contrary to the other states' principles."
- Text, `ca-rtc-2025::sec::s18001::c`: "shall be determined by applying the nonresident sourcing rules for determining income from sources within this state"
- Text, `ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b02`: "Taxes paid to any local government, such as a city or county."
- Engine: Part I items and tax paid are taken as stated (resolveInfo.ts:10-29). The rules are comments on the fact kind only (facts/kinds/otherStateTax.ts:13-39). No item carries a kind of income or a place of work, so the engine cannot test the source. No file under cade/src/mastra names the fact, so no question states these rules to the taxpayer today.
- Effect: A resident does all work in California for an employer in a listed state that taxes the $200,000 of wages and $11,000 of tax. Under California's rule the wages have a California source, so the credit is $0. With the item stated, the engine gives up to $11,000 (the smaller of lines 6 and 11).
- Who meets this: Common once the fact is collected: wages taxed by the employer's state for work done in California, and interest or dividends taxed by another state.
- Code: `engine/src/state/ca/schedule-s/bindings.ts:44`

**schedule-s-F8** (low confidence). The same income stated for two states gets a credit from each copy.

- Text, `ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01`: "figure the credit separately by completing a separate Schedule S for each state"
- Text, `ca-rtc-2025::sec::s18001::a-3`: "The credit shall not exceed the proportion of the "net tax""
- Engine: Each copy uses the whole line 2 and its own Part I; the copies' line 12 amounts are added with no test that an income item is in one copy only.
- Effect: California tax $20,000 on $200,000 of AGI; $100,000 of partnership income stated in the copies of two states, each state's tax on it $12,000. Each copy's line 6 is $10,000, total credit $20,000: twice the California tax on that income.
- Who meets this: Rare: one item taxed by two listed states.
- Code: `engine/src/state/ca/schedule-s/returnAmounts.ts:148`

## Schedule SE

### Class 1: the texts agree and the engine does something else or less

**schedule-se-F1** (high confidence). Line 8a leaves out railroad retirement (tier 1) compensation of a railroad W-2 the engine accepts.

- Text, `irs-1040sse-face-2025::sec::face-part-i::b02`: "Total social security wages and tips (total of boxes 3 and 7 on Form(s) W-2) and railroad retirement (tier 1) compensation. If $176,100 or more, skip lines 8b through 10, and go to line 11"
- Text, `usc-26-2025::sec::s1402::b-cont`: "(B) includes compensation which is subject to the tax imposed by section 3201 or 3211"
- Engine: Adds boxes 3 and 7 of the taxpayer's W-2s only. A comment says 'No fact gives railroad retirement (tier 1) compensation', but the W-2 fact holds box 14 entries, and Schedule 3 line 11 already detects a railroad W-2 by its box 14 labels and reports a gap (schedule-3/excessSocialSecurity.ts:36-58). Schedule SE has no such guard: a railroad W-2 with no box 3 gives line 8a = 0.
- Effect: A railroad employee with $180,000 of tier 1 compensation and a Schedule C profit of $20,000: line 6 is $18,470; line 10 must be $0 and the engine gives $2,290, so line 12 is $2,290 too high and line 13 is $1,145 too high.
- Who meets this: Rare: a railroad employee with a side business or farm. Wrong whenever tier 1 compensation plus net earnings pass what is left of $176,100.
- Code: `engine/src/federal/schedule-se/bindings.ts:96-98; engine/src/federal/schedule-se/resolveInfo.ts:172-189`

**schedule-se-F2** (medium confidence). A spouse's business on a joint return: answering the open must-file question drops the spouse's self-employment tax with no gap.

- Text, `irs-1040sse-inst-2025::sec::joint-returns::b01`: "If both spouses have self-employment income, each must"
- Text, `usc-26-2025::sec::s6017::text`: "shall not be computed on the aggregate income but shall be the sum of the taxes computed under such chapter on the separate self-employment income of each spouse"
- Engine: A spouse-owned business or farm on a joint return leaves the Schedule SE must-file answer open (the guard). The only way to close it is the explicit decision decisions.scope.must_file_schedule_se. With true, the form holds the taxpayer's amounts only; with false, no Schedule SE. In both cases Schedule 2 line 4 is the taxpayer's line 12 or blank, never unsupported, while the spouse's Schedule C profit is on the return. Other forms do report this case as a gap (2441/lines.ts:42, 7206/plans.ts:31); Schedule SE and Schedule 2 line 4 do not.
- Effect: Joint return, the spouse's Schedule C line 31 is $50,000, and the decision is recorded: the spouse's tax is 46,175 x 15.3% = $7,065, and Schedule 2 line 4 leaves it out; Schedule 1 line 15 is $3,533 too low.
- Who meets this: Common return (a joint return where the spouse is self-employed), but only after someone records the explicit decision; until then the return is not ready.
- Code: `engine/src/federal/schedule-se/resolveInfo.ts:40,55-63,75-86; engine/src/federal/schedule-2/bindings.ts:201-202`
- Note from the check: The open question is a guard. The gap is that the only way to close it gives a return with no tax for the spouse and no reported gap.

**schedule-se-F3** (medium confidence). Stale comments say no fact gives partnership earnings; the K-1 fact holds box 14 code A, and Schedule SE answers 'does not file' for a partner.

- Text, `irs-1040sse-face-2025::sec::face-part-i::b01`: "Net profit or (loss) from Schedule C, line 31; and Schedule K-1 (Form 1065), box 14, code A (other than farming)"
- Text, `usc-26-2025::sec::s1402::a`: "plus his distributive share (whether or not distributed) of income or loss"
- Engine: Lines 1a and 2 read Schedule F and Schedule C only. The comments 'no fact gives partnership (K-1) earnings' (bindings.ts:87) and 'partnership earnings ... have no facts yet' (resolveInfo.ts:26-28) are stale: the partnership box table reads box 14 code A as self_employment_earnings (passThrough/partnershipBoxes.ts:195). The item has no route, so Schedule E line 41 is unsupported and names it (passThrough/routing.ts:209-215). That is the guard. Schedule SE itself does not show it: with no business or farm its must-file answer is a decided 'no', and with a Schedule C its lines 3 to 13 compute without the K-1 amount.
- Effect: No dollars on a finished return: Schedule E line 41 is a gap, so the return is not complete. On Schedule SE alone, a general partner with $100,000 in box 14 code A and a $10,000 Schedule C shows line 12 of $1,413 where $15,543 is due.
- Who meets this: Common for the target user (a general partner or LLC member with a K-1).
- Code: `engine/src/federal/schedule-se/bindings.ts:87-88; engine/src/federal/schedule-se/resolveInfo.ts:25-31,75-86`
- Note from the check: Guarded on Schedule E line 41; the finding is the stale comment and the must-file answer.

### Class 2: two texts disagree and the engine follows one

**schedule-se-F4** (high confidence). Foreign earned income exclusion: the regulation takes excluded income out of net earnings; the statute and the instructions do not, and the engine follows them.

- Text, `irs-1040sse-inst-2025::sec::u-s-citizens-or-resident-aliens-living-outside::b01`: "Foreign earnings from self-employment can't be reduced by your foreign earned income"
- Text, `usc-26-2025::sec::s1402::a-11`: "the exclusion from gross income provided by section 911(a)(1) shall not apply"
- Text, `cfr-26-2025::sec::s1.1402(a)-2::a-p2`: "Income which is excludable from gross income under any provision of subtitle A of the Internal Revenue Code is not taken into account in determining net earnings from self-employment"
- Engine: Line 2 is Schedule C line 31 with no reduction for Form 2555. This is the statute (section 1402(a)(11)) and the instructions. The regulation is older than the statute.
- Effect: A citizen abroad with $100,000 of Schedule C profit, all excluded on Form 2555: the engine gives line 12 of $14,129 (line 10 $11,451, line 11 $2,678); the regulation as written gives $0.
- Who meets this: Rare: self-employed abroad with Form 2555.
- Code: `engine/src/federal/schedule-se/bindings.ts:87-88`
- Note from the check: The regulation is older than the statute.

**schedule-se-F5** (low confidence). Community income: the regulation gives a business's earnings to the husband; the statute and the instructions give them to the spouse who carries it on, and the engine uses the recorded owner.

- Text, `irs-1040sse-inst-2025::sec::community-income::b01`: "If only one spouse participates in the business, all of the income from"
- Text, `usc-26-2025::sec::s1402::a-5`: "shall be treated as the gross income and deductions of the spouse carrying on such trade or business"
- Text, `cfr-26-2025::sec::s1.1402(a)-8::a`: "all of the gross income, and the deductions attributable to such income, shall be treated as the gross income and deductions of the husband unless the wife exercises substantially all of the management and control"
- Engine: A business or farm belongs to its recorded owner (ownerOf, farmOwnerOf); the engine has no sex or management-and-control input. This matches the statute and the instructions. The regulation is older than the statute's present wording.
- Effect: Community property state, joint return, the wife (the taxpayer) owns a business with $50,000 profit and the husband has W-2 wages above $176,100: the engine gives her line 12 of $7,065; the regulation as written puts the earnings on his Schedule SE, where line 10 is $0 and the tax is $1,339.
- Who meets this: Only by the regulation's reading, which neither the statute nor the instructions follow.
- Code: `engine/src/federal/schedule-se/resolveInfo.ts:39,112`
- Note from the check: The regulation is older than the statute.

### Class 3: a text is unclear, in error, or not in the library

**schedule-se-F6** (high confidence). The 2025 wage base of $176,100 is not checkable against the law in the library.

- Text, `irs-1040sse-face-2025::sec::face-part-i::b02`: "7 $176,100"
- Text, `usc-26-2025::sec::s1402::b-1`: "the contribution and benefit base (as determined under section 230 of the Social Security Act) which is effective for the calendar year"
- Engine: A constant of 176100, used on lines 8a (skip test), 9 and 10. It matches the amount printed on the form face. The statute states no figure: the amount is set each year under section 230 of the Social Security Act, which the library does not hold.
- Effect: No dollars: the engine's amount equals the form's.
- Who meets this: Every Schedule SE with line 4c of $400 or more.
- Code: `engine/src/federal/schedule-se/bindings.ts:12`

### Class 4: a possible loophole

**schedule-se-F7** (low confidence). Line 1b takes a stated CRP amount; nothing checks that the taxpayer received social security benefits.

- Text, `irs-1040sse-face-2025::sec::face-part-i::b01`: "If you received social security retirement or disability benefits, enter the amount of Conservation Reserve Program payments included on Schedule F, line 4b"
- Text, `usc-26-2025::sec::s1402::a-1`: "including payments under section 1233(a)(2) of the Food Security Act of 1985 (16 U.S.C. 3833(a)(2)) to individuals receiving benefits under section 202 or 223"
- Engine: Line 1b is the farm fact's crpPaymentsWhileReceivingSocialSecurity. Schedule F refuses an amount above its program payments (schedule-f/lines.ts:50), but the engine never compares the answer with a Form SSA-1099 or any benefits fact on the return.
- Effect: A farmer with $10,000 of CRP payments and no social security benefits who states the amount: line 3 is $10,000 too low and self-employment tax is about $1,413 too low.
- Who meets this: Rare: a farm with CRP payments. Holds only if a taxpayer can state the amount while the return shows no benefits; no text in the library names a document that proves the condition, so the texts cannot settle whether a check is required.
- Code: `engine/src/federal/schedule-se/bindings.ts:85-86; engine/src/federal/schedule-se/resolveInfo.ts:112-128`

## Candidates the check rejected

- **3514-F4**, FTB 3514: A head of household with a qualifying child skips the separated-spouse questions. Rejected: Same result under both readings: a married person can be head of household only when section 7703(b) treats them as unmarried, which already needs a separate home for the last 6 months.
- **3514-F7**, FTB 3514: A nonresident alien on a joint return: the instructions allow the credit, the statute asks for an election. Rejected: Same result under both readings: a joint return with a nonresident alien spouse exists only with the section 6013(g) or (h) election.
