# Form 4136: doubts and defaults

Form 4136 refunds the federal excise tax paid on fuel used for a nontaxable purpose (a farm, off-highway business use, export, a bus, the home). Each row multiplies gallons by a rate. Line 17 adds the credits and goes to Schedule 3 line 12, a refundable credit.

## Two texts conflict

Each is decided, with a `DECISION` comment in the code and a row in `docs/rule-decisions.md`.

- **A58, the cents** (`receivers.ts`): Form 4136 keeps its cents boxes; Schedule 3 line 12 takes line 17 to the nearest dollar.
- **A59, the year the credit is income** (`receivers.ts`): a cash-method business reports it next year, as the schedules say; an accrual-method business reports it this year, as Pub. 225 says, and its other-income line is unsupported (doubt 10).
- **A60, home kerosene** (`rows.ts`): line 4a's credit goes in column (e), its cost in column (d).
- **A61, Part I with several activities** (`bindings.ts`): lines C to F describe the activity with the most credit.

## Should we do this now

Each doubt below has no conflicting text. Doubts 1 to 4, 6 to 8 and 11 to 13 are done as their defaults say. Doubts 5 and 9 are named gaps or limits, and the reason is in each one. Doubt 10 is done as an unsupported line, because adding the amount is a pattern change (below).

1. **Gallon equivalents are rounded to the whole unit.** "10,000 gallons of LPG ÷ 1.353 = 7,391 GGE x $0.109 = $805.62 claim amount" (`irs-4136-inst-2025::sec::line-11::b02`). No rule says to round; the example does. Default: round the equivalents to the whole GGE or DGE, then multiply. Dollars: a few cents at most.

2. **The conversion applies to every type of use on lines 11a, 11c and 11g.** The GGE and DGE footnotes sit under the type of use 5 rates (same block). The column heading says "Gallons, or gasoline or diesel gallon equivalents (CNG, LPG, and LNG only)" (`irs-4136-inst-2025::sec::part-ii-credits::b01`). Default: a claim stated in gallons, pounds or cubic feet converts for every use; a claim with no measure is already in equivalents. Dollars: none when the taxpayer states equivalents.

3. **Column (b) and the "Bus" note have no widget.** Type of use 5: "Write 'Bus' in the space to the left of column (a). Enter the correct claim rate in column (b)" (`::line-11::b02`, `::line-14::b01`). Line 13c: "Write 'Taxed at $.244' ... Enter $.243 in column (b)" (`::line-13::b02`). The blank PDF prints the rates and has no field for them. Default: the credit uses the right rate; the printed rate stays the form's. A preparer writes the note by hand. Dollars: none.

4. **Statements the engine does not write.** Line 6a and 7a ask for a statement of each government buyer; line 15 asks for the blender's certificate; a dye exception asks for an explanation (`::line-6a::b01`, `::lines-7a-and-7b::b02`, `::line-15::b01`, the form face). Default: the amounts and the boxes print; the statements are the preparer's. Dollars: none.

5. **More than one type of use on a row.** "If you need more space for any line (for example, for more types of use), prepare a separate statement" and "Include amounts from any separate statement" (`::part-ii-credits::b01`). Default: columns (a) and (c) of that row are unsupported; (d), (e) and line 17 include every claim. Dollars: none.

6. **Fractional gallons.** A numeric column (c) prints whole gallons (the renderer rounds); the credit uses the gallons as stated. Default: kept. Dollars: none on line 17.

7. **A vendor line with no registration number.** "You can't make a claim on lines 6 through 8 if you haven't received your IRS-issued Form 637 registration number" (`::information-for-claims-on-lines-6-8::b01`). Default: the rows print, line 17 waits, and Cade asks for `fuel_tax.registration_numbers`. Dollars: none once answered.

8. **Who may claim.** Each line names its claimant (the ultimate purchaser, a registered ultimate vendor, a registered credit card issuer, the blender). The engine takes the claims as stated and checks only the line's types of use. Personal use, commuting and ride sharing do not qualify (`::specific-instructions::b02`); Cade asks. Dollars: none in the engine.

9. **Schedule 3 line 15 counts its other lines as 0.** Lines 9, 10, 11 and 13a to 14 are engine gaps. Default: line 15 is line 12 plus any of them that holds a number, as Form 1040 line 32 already counts line 31. Form 1040 line 31 takes Form 4136's amount from its slots, not Schedule 3's field: a Schedule 3 read from Form 1040 tripled the evaluation time of every return with a Schedule 3. When another Part II line gets rules, line 31 must add it too. A return with a net premium tax credit or excess social security tax and a fuel credit understates line 15. Dollars: yes, for that return only.

10. **An accrual-method business.** Pub. 225: "If you use an accrual method, include the amount of credit or refund in gross income for the tax year in which you used the fuels" (`irs-pub-225-2025::sec::including-the-credit-or::b02`). Decided in row A59 (it conflicts with the schedules' "2024" credit): this year's credit is this year's income. The engine does not add it, so Schedule C line 6 or Schedule F line 43 of the linked accrual-method business is unsupported.

11. **Half a cent rounds up.** Column (e) has a cents box, and the instructions give no rule for a product such as 405 x $.183 = $74.115. Default: column (e) rounds to the cent, half a cent up, as the whole-dollar rule raises 50 cents (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Dollars: one cent on a row. The blind fill made the same choice (its doubt 4).

12. **Line 17 adds column (e) as entered.** "Add lines 1 through 16, column (e)" (`irs-4136-face-2025::sec::face-part-ii-4::b01`). Default: line 17 adds the rows rounded to the cent, not the exact products (a made-up case: $309.18, against $309.17 from the exact products). Dollars: a cent or two. The blind fill made the same choice (its doubt 5).

13. **A commercial air carrier's kerosene used in foreign trade.** Line 5's claimants: "For lines 5a and 5b, the ultimate purchaser of kerosene used in commercial aviation (other than foreign trade) ... For lines 5c, 5d, and 5e, the ultimate purchaser of kerosene used in noncommercial aviation" (`irs-4136-inst-2025::sec::line-5::b01`). Lines 5c and 5d allow type of use 9 (foreign trade), and line 5e allows only type 9. Read strictly, no line 5 row names a commercial carrier in foreign trade. Default: the engine checks only the type of use (doubt 8), so a claim recorded on line 5c with type 9 prints, as the blind fill also chose (its doubt 6). Cade must confirm that the claimant flies noncommercial aviation, or that the carrier has no other way to get the tax back (a tax-free purchase with its registration). Dollars: yes, the whole 5c and 5e claim ($976 in the blind case of 4,000 gallons).

Doubt 5 is not done now: the engine writes no attached statements on any form. Doubt 9 is not done now: lines 9 to 11 and 13a to 14 of Schedule 3 have no rules yet, and each needs its own form work.

## Pattern change

### Proposals for a discussion

- **Schedule A (Form 4136).** Before: with two or more business activities, line B is unsupported, because the engine has no Schedule A catalog. After: Schedule A is cataloged and prints one copy per activity from the same activity facts, through the copies mechanism.
- **The credit in the business's income.** Before: Schedule C and Schedule F figure a business's income from its own fact alone (`schedule-c/lines.ts`, `schedule-f/income.ts`), so an accrual-method business with a Form 4136 claim has its other-income line unsupported. After: those lines, and Schedule 1, Schedule SE and the QBI forms that read them, add this year's credit of the activity that names the business (`businessKey`); it waits for a discussion.

## Second opinions

- **Blind fill (2026-11-26, 15 cases).** Filled by hand from the blank form and the instructions: lines 1 to 8, 11, 13 to 16 (brackets, bus rates, gallon equivalents, line 13c at $.244, LUST rows, home kerosene), line 17 and Schedule 3 line 12. All 53 compared values match the engine; no blank-against-0 difference. The blind fill's doubts that change cents or dollars are doubts 1, 11, 12 and 13 above, and row A60 changes no dollars.
- **PolicyEngine-US 2.154.1** (commit `0fbed6dd`, 2026-11-26). It does not model Form 4136: no variable or parameter for fuel tax credits, excise rates or Schedule 3 line 12 (a search of `variables/gov/irs` and `parameters/gov/irs` for fuel, kerosene, excise and 4136 finds only the residential clean energy fuel cell credit). Nothing to compare.
- **Other projects.** The repository names no other reference implementation that models Form 4136. IRS Direct File (issue #140) is not checked out here, and its scope did not include business credits or Form 4136.

## Confidence

| Field group | Confidence |
| --- | --- |
| Line 11a with type of use 5 (LPG, GGE) | Published example with numbers |
| Rates, brackets, line 17 | Stated rule (form face, part-ii-credits::b01) |
| Bus rates (11a-11h, 14a), line 13c at $.244 | Stated rule |
| Types of use allowed on each line | Stated rule (each line's instructions) |
| Home kerosene on line 4a | Stated rule; column per decision A60 |
| Cents kept; Schedule 3 line 12 rounded | Own reading (decision A58) |
| Part I lines A to F | Stated rule; which activity per decision A61 |
| Dye boxes, registration numbers | Stated rule |
| Gallon equivalents rounded | Own reading (doubt 1) |
| Line B with more than one activity | Unsupported (Schedule A) |
| Columns (a) and (c) with two types of use on a row | Unsupported (separate statement) |
| Schedule 3 lines 12 and 15, Form 1040 line 31 | Stated rule |
