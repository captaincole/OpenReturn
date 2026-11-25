# Rule decisions

This page lists each tax rule that a person decided, because the official texts did not settle it. It is the place to start a discussion with a tax professional, and the list to check again when the tax law itself is in the reference library.

A person decides a rule in three cases (see `CLAUDE.md`, "When two official texts conflict, the code records the decision"):

- two official texts point different ways;
- the guidance allows a choice of method or source;
- an input has no official form, so someone must decide what the real document looks like.

Each decision below also sits in the code, in a comment that starts with `DECISION (<date>):` above the rule that applies it. `grep -rn "DECISION (" engine/src` lists them. When you add a decision, add the comment and one row here in the same pull request.

## Principles that came out of the decisions

- **A form's own instructions decide how that form is filled.** When the instructions of form A describe a line of form B in another way, form B's instructions win.
- **A guide written for one group applies to that group.** Publication 225 is the farmer's tax guide. It governs a farm's forms. On every other form, the form's own instructions decide.
- **The form's arithmetic wins over a sentence that breaks it.** When a sentence in the instructions gives an amount that the form's own lines cannot produce, the engine follows the lines.
- **A person does not pick the better number item by item.** Where the IRS accepts more than one method, the engine applies one rule the same way every time.

## Decided

| # | Date | Form | Question | Text A | Text B | Decision | Dollars | Where | Check when the law is in the library |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-24 | Schedule E | A passive partnership is sold in full. Which column takes the released loss? | Schedule E instructions: a separate line in the passive loss column (g). | Form 8582 instructions, the example: the nonpassive column (i). | Text A. | None: the totals are the same. | `federal/schedule-e/partII.ts` | Section 469(g) and its regulations: is the released loss nonpassive? |
| 2 | 2026-11-24 | Form 461 | Does a business's capital loss count as a business loss? | Publication 225: business gains and losses on Form 8949 count. | Form 461 instructions: losses from capital assets do not count. | Text B. Publication 225 is for farmers. | Yes, for a business with a capital loss. | `federal/461/lines.ts` | Section 461(l)(3) as amended by the CARES Act. |
| 3 | 2026-11-24 | Form 461 | A business gain next to an investment loss. | Add every capital loss back on line 11. | A business gain counts only up to the net capital gain. | Text B, the cap. | Yes: $20,000 in the example in the code. | `federal/461/lines.ts` | Section 461(l)(3)(B). |
| 4 | 2026-11-24 | Form 6198 | Does last year's deducted loss lower this year's amount at risk? | Last year's line 21 reduces the amount at risk at the start of this year. | Line 18 takes only decreases since the end of last year. | Text A. | Yes, when last year's deducted loss was above 0. | `facts/kinds/atRisk.ts` | Section 465(b)(5). |
| 5 | 2026-11-24 | FTB 3461 | How much of a carried California loss is used against business income? | "Up to the business income amount". | The form's lines: business income plus the threshold. | Text B, the form's arithmetic. | Yes: $313,000 in the example in the code. | `state/ca/3461/lines.ts` | California Revenue and Taxation Code section 17560.5. |
| 6 | 2026-11-24 | Form 2210 | Does withholding count in the penalty worksheet? | Withholding counts as paid in four parts, one on each due date. | Worksheet line 1b: do not enter withholding. | Text A. | Yes: the penalty is lower. | `federal/2210/penaltyWorksheet.ts` (pull request #241) | Section 6654(g). |
| 7 | 2026-11-24 | Form 2210 | A person had no tax last year and did not file. Penalty or exception? | The exception: no penalty when last year's tax was zero. | Line 8: with no return last year, use 90% of this year's tax. | The exception applies when last year's tax is recorded as 0; Cade asks for it. | Yes: the whole penalty. | `federal/2210/outcome.ts` (pull request #241) | Section 6654(e)(2). |
| 8 | 2026-11-24 | Form 8621 | The interest rate for April 1 to 15, 2026. | Form 2210 instructions: 7% through April 15. | The IRS rate release for the quarter: 6%. | 6%. The 7% is a special rule for the estimated tax penalty. | About $1 in the example. | `data/underpaymentRates.ts` (pull request #237) | Section 6621(b)(2)(B). |
| 9 | 2026-11-24 | Foreign currency | Where do daily exchange rates come from, and which currencies are supported? | The IRS accepts "any posted exchange rate that is used consistently" and names no source. | — | The Federal Reserve's H.10 release, and only the 20 currencies that have both an H.10 daily rate and an IRS yearly average, so that every amount converts whether it has a date or not. The Malaysian ringgit, the Sri Lankan rupee and the Venezuelan bolivar have no IRS average and are not supported. | Small. | `currency/rates.ts` (pull request #240) | Section 988 and its regulations; Regulations section 1.988-1(d). |
| 10 | 2026-11-24 | Foreign currency | Which rate converts foreign income? | The IRS: in general, the rate of the day the item is received. | The IRS publishes yearly average rates and accepts a posted rate used consistently. | An amount with a known date takes that day's rate. An amount with no date takes the IRS yearly average. | Small: $2 to $50 on $1,200 of interest. | `incomeInDollars.ts` (pull request #240) | Sections 985 to 989; no court case was found on the choice of method (web search only, 2026-11-24). |
| 11 | 2026-11-24 | Foreign currency | Which yearly average: the IRS table or the Federal Reserve's? | The IRS yearly average table. | The Federal Reserve's annual averages. | The IRS table. | $2 on 1,180 euros of interest. | `currency/` (pull request #240) | — |
| 12 | 2026-11-24 | Form 8801 | Is line 23, the limit on the credit, the tentative minimum tax before or after the minimum tax foreign tax credit? | Form 8801 line 23 is Form 6251 line 9, and line 9 is line 7 less line 8. | Form 6251 instructions: when line 10 is at least line 7, leave line 8 blank. | After: line 7 less the credit line 8 would hold, also when Form 6251 leaves line 8 blank. Leaving line 8 blank is a shortcut for a person who owes no minimum tax, and it must not shrink this credit. With Form 1116, line 23 is unsupported. | Yes: $250 more credit in the made-up taxpayer `logain`. | `federal/8801/credit.ts` | Sections 53(c) and 55(b). Marked for research: the reading rests on memory of the law. |

A row that names a pull request is in the code of that branch until it merges.

## Decided by the author, waiting for a person's review

| # | Date | Form | Question | Text A | Text B | Decision | Dollars | Where | Check when the law is in the library |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | 2026-11-24 | Form 8824 | An exchange of one property for one property plus cash. Are lines 12 to 18 filled? | Multi-asset exchanges: with cash or other property, do not complete lines 12 to 18; attach a statement. | The line 20 example fills line 15 with the cash received. | Text B, for one property given up and one received. The (b) clause sits under the multi-asset heading. | None: lines 19 to 25 are the same. | `federal/8824/lines.ts` | Regulations section 1.1031(j)-1. |
| A2 | 2026-11-24 | Form 8824 | More than one exchange: a summary form or one form each? | "You can file a summary on one Form 8824" with a statement. | "Use Parts I, II, and III of Form 8824 to report each exchange." | The summary form, every time: the engine prints one copy. | None. | `federal/8824/printed.ts` | — |
| A3 | 2026-11-24 | Form 8824 | Line 21, section 1245 real property: what caps the depreciation recaptured? | The line instruction: the depreciation "up to the amount of gain shown on line 19". | The example: "the lesser of the property's depreciable basis ... or the amount realized", the parts' own value. | Text A, the stated rule of the line. The fact does not hold the value of the section 1245 parts. | Only when the parts are worth less than their depreciation: $35,000 (A) against $20,000 (B) for parts worth $20,000. | `federal/8824/lines.ts` | Sections 1245(a)(1) and 1245(b)(4). |
| A4 | 2026-11-24 | FTB 3840 | Schedule A line 3, the consideration for the property given up: gross, or net of what the taxpayer gave with it? | The line 3 instruction: "all money and notes received, plus any mortgages or other debts assumed by the buyer ... plus the fair market value of any other property". | Form 8824 lines 15 and 18: the liabilities the taxpayer assumed, the cash paid and the other property given up offset the liabilities relieved. | Text B, net. Line 7 then equals Side 1 line 14, and line 8 comes from line 7's gain for each property. | Lines 3, 5 and 7 only: $150,000 of liabilities assumed makes line 3 $150,000 lower. Line 8 does not change. | `state/ca/3840/lines.ts` | R&TC sections 18031 and 18032. |

The last column names the section of law to read first. The section numbers are from memory and were not checked against the Code, which the library does not hold yet.

## Open: brought to a person, not decided

| Form | Question | Engine today | Why it is open |
| --- | --- | --- | --- |
| Schedule S | A resident of both California and Virginia: is the credit limited to tax on Virginia-source income? | All income Virginia taxed goes on line 9. | Rare. Both texts are quoted in the form's `QUESTIONS.md`. |

## Settled by the author, for the record

These looked like conflicts and change no dollars, or at most $1. Each is in its form's `QUESTIONS.md`.

- Form 6198: who files with a profit; how an allowed loss is split among items (the engine matches the example in the instructions); cents on five lines.
- FTB 3801: what the form does after line 3 shows income; who files with a federal loss and a California gain.
