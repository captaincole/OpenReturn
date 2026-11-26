# Form 4136: doubts and defaults

Form 4136 refunds the federal excise tax paid on fuel used for a nontaxable purpose (a farm, off-highway business use, export, a bus, the home). Each row multiplies gallons by a rate. Line 17 adds the credits and goes to Schedule 3 line 12, a refundable credit. Four decisions with conflicting texts are in `docs/rule-decisions.md` (rows A58 to A61). The doubts below have no conflicting text.

## Doubts

1. **Gallon equivalents are rounded to the whole unit.** "10,000 gallons of LPG ÷ 1.353 = 7,391 GGE x $0.109 = $805.62 claim amount" (`irs-4136-inst-2025::sec::line-11::b02`). No rule says to round; the example does. Default: round the equivalents to the whole GGE or DGE, then multiply. Dollars: a few cents at most.

2. **The conversion applies to every type of use on lines 11a, 11c and 11g.** The GGE and DGE footnotes sit under the type of use 5 rates (same block). The column heading says "Gallons, or gasoline or diesel gallon equivalents (CNG, LPG, and LNG only)" (`irs-4136-inst-2025::sec::part-ii-credits::b01`). Default: a claim stated in gallons, pounds or cubic feet converts for every use; a claim with no measure is already in equivalents. Dollars: none when the taxpayer states equivalents.

3. **Column (b) and the "Bus" note have no widget.** Type of use 5: "Write 'Bus' in the space to the left of column (a). Enter the correct claim rate in column (b)" (`::line-11::b02`, `::line-14::b01`). Line 13c: "Write 'Taxed at $.244' ... Enter $.243 in column (b)" (`::line-13::b02`). The blank PDF prints the rates and has no field for them. Default: the credit uses the right rate; the printed rate stays the form's. A preparer writes the note by hand. Dollars: none.

4. **Statements the engine does not write.** Line 6a and 7a ask for a statement of each government buyer; line 15 asks for the blender's certificate; a dye exception asks for an explanation (`::line-6a::b01`, `::lines-7a-and-7b::b02`, `::line-15::b01`, the form face). Default: the amounts and the boxes print; the statements are the preparer's. Dollars: none.

5. **More than one type of use on a row.** "If you need more space for any line (for example, for more types of use), prepare a separate statement" and "Include amounts from any separate statement" (`::part-ii-credits::b01`). Default: columns (a) and (c) of that row are unsupported; (d), (e) and line 17 include every claim. Dollars: none.

6. **Fractional gallons.** A numeric column (c) prints whole gallons (the renderer rounds); the credit uses the gallons as stated. Default: kept. Dollars: none on line 17.

7. **A vendor line with no registration number.** "You can't make a claim on lines 6 through 8 if you haven't received your IRS-issued Form 637 registration number" (`::information-for-claims-on-lines-6-8::b01`). Default: the rows print, line 17 waits, and Cade asks for `fuel_tax.registration_numbers`. Dollars: none once answered.

8. **Who may claim.** Each line names its claimant (the ultimate purchaser, a registered ultimate vendor, a registered credit card issuer, the blender). The engine takes the claims as stated and checks only the line's types of use. Personal use, commuting and ride sharing do not qualify (`::specific-instructions::b02`); Cade asks. Dollars: none in the engine.

9. **Schedule 3 line 15 counts its other lines as 0.** Lines 9, 10, 11 and 13a to 14 are engine gaps. Default: line 15 is line 12 plus any of them that holds a number, as Form 1040 line 32 already counts line 31. Form 1040 line 31 takes Form 4136's amount from its slots, not Schedule 3's field: a Schedule 3 read from Form 1040 tripled the evaluation time of every return with a Schedule 3. When another Part II line gets rules, line 31 must add it too. A return with a net premium tax credit or excess social security tax and a fuel credit understates line 15. Dollars: yes, for that return only.

10. **An accrual-method business.** Pub. 225: "If you use an accrual method, include the amount of credit or refund in gross income for the tax year in which you used the fuels" (`irs-pub-225-2025::sec::including-the-credit-or::b02`). Default (decision A59): the engine adds nothing to this year's income; the business's stated other income must hold it. Dollars: yes, when the stated amount leaves it out.

## Proposals for a discussion

- **Schedule A (Form 4136).** Each business activity past the first needs its own Schedule A. The engine has no Schedule A catalog, so line B is unsupported with two or more activities. Proposal: catalog Schedule A and print one copy per activity from the same activity facts.
- **The credit in the business's income.** For an accrual-method business, Schedule C line 6 or Schedule F line 8 could take this year's credit of the activity that names the business (`businessKey`). That changes two other forms' lines; it waits for a discussion.

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
