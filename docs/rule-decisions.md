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
| 9 | 2026-11-24 | Foreign currency | Where do daily exchange rates come from, and which currencies are supported? | The IRS accepts "any posted exchange rate that is used consistently" and names no source. | — | The Federal Reserve's H.10 release, and only its 23 currencies. | Small. | `currency/rates.ts` (pull request #240) | Section 988 and its regulations; Regulations section 1.988-1(d). |
| 10 | 2026-11-24 | Foreign currency | Which rate converts foreign income? | The IRS: in general, the rate of the day the item is received. | The IRS publishes yearly average rates and accepts a posted rate used consistently. | An amount with a known date takes that day's rate. An amount with no date takes the IRS yearly average. | Small: $2 to $50 on $1,200 of interest. | `incomeInDollars.ts` (pull request #240) | Sections 985 to 989; no court case was found on the choice of method (web search only, 2026-11-24). |
| 11 | 2026-11-24 | Foreign currency | Which yearly average: the IRS table or the Federal Reserve's? | The IRS yearly average table. | The Federal Reserve's annual averages. | The IRS table. | $2 on 1,180 euros of interest. | `currency/` (pull request #240) | — |

A row that names a pull request is in the code of that branch until it merges.

The last column names the section of law to read first. The section numbers are from memory and were not checked against the Code, which the library does not hold yet.

## Open: brought to a person, not decided

| Form | Question | Engine today | Why it is open |
| --- | --- | --- | --- |
| Form 8801 | Is line 23, the limit on the credit, the tentative minimum tax before or after the minimum tax foreign tax credit? | Before: the form copies Form 6251 line 9, and the Form 6251 instructions leave the credit off that line for most filers. | The law (section 55(b)) is not in the library, so the reading "after" rests on memory. $250 in the made-up taxpayer `logain`, in the person's favor. |
| Schedule S | A resident of both California and Virginia: is the credit limited to tax on Virginia-source income? | All income Virginia taxed goes on line 9. | Rare. Both texts are quoted in the form's `QUESTIONS.md`. |

## Settled by the author, for the record

These looked like conflicts and change no dollars, or at most $1. Each is in its form's `QUESTIONS.md`.

- Form 6198: who files with a profit; how an allowed loss is split among items (the engine matches the example in the instructions); cents on five lines.
- FTB 3801: what the form does after line 3 shows income; who files with a federal loss and a California gain.
