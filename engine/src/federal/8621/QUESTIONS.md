# Form 8621: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides. The instructions publish no example with numbers, and no IRS publication has one.

## 1. Which Schedule D line takes line 7c

- Source: "This amount is a net long-term capital gain. Enter this amount in Part II of the Schedule D used for your income tax return." (the form, line 7c) "Portions of the net capital gain may have to be reported on different lines of Schedule D, depending upon the information provided by the QEF concerning the section 1(h) categories" (irs-8621-inst-2025::sec::line-7c::b01).
- Default: Schedule D line 11, the line for a fund's undistributed long-term gain (Form 2439, irs-1040sd-inst-2025::sec::undistributed-capital::b01). The whole amount is plain long-term gain: the fact holds no 28% rate gain or unrecaptured section 1250 gain.
- Changes dollars: no for the line choice (lines 11 to 13 all add into line 15). Yes when the QEF reports 28% rate gain or unrecaptured section 1250 gain (Schedule D lines 18 and 19).

## 2. How an excess distribution splits among the year's distributions

- Source: "If you received more than one distribution during the tax year with respect to the applicable stock, the excess distribution is apportioned among all actual distributions. Each apportioned amount is treated as a separate excess distribution." (irs-8621-inst-2025::sec::line-15c::b01)
- Default: in proportion to each distribution's amount. Each part converts at its distribution's spot rate and is allocated over a holding period that ends on its date. The foreign tax on each distribution splits in the same proportion (::line-16d::b01).
- Changes dollars: yes (line 15e(2) when rates differ, lines 16b to 16f, the dividend on line 3b).

## 3. Line 15e(1) when line 15a is not more than line 15d

- Source: "Subtract line 15d from line 15a. This amount, if more than zero, is the excess distribution" (the form, line 15e(1)).
- Default: the line prints 0, not a negative number.
- Changes dollars: no.

## 4. The first day of the holding period

- Source: "Divide the amount on line 15e(2) or 15f ... by the number of days in your holding period. The holding period of the stock is treated as ending on the date of the distribution or disposition." (irs-8621-inst-2025::sec::lines-16a-and-16b::b01) The start is not stated.
- Default: the day after the acquisition date (the general holding period rule), through the event date. "The holding period began in the current tax year" (::line-15a::b01) uses the same first day.
- Changes dollars: yes, by one day's share.

## 5. The nonexcess distribution as a dividend

- Source: "This amount is taxed according to the rules of section 301. To the extent that section 301(c)(1) is applicable, include the amount as a dividend ... on Form 1040, line 3b" (irs-8621-inst-2025::sec::line-15c::b01, ::line-15a::b01).
- Default: the whole nonexcess distribution is an ordinary dividend (a fund's earnings and profits are not known). It is not a qualified dividend: a PFIC's dividend is never one (irs-pub-550-2025::sec::qualified-dividends::b05). The fund fact holds the distributions; they are never also a Form 1099-DIV fact.
- Changes dollars: yes, when part of a distribution is a return of basis.

## 6. Interest: the due date and the day count

- Source: interest runs "beginning on the due date (without regard to extensions) of your income tax return for the tax year to which an increase in tax is attributable and ending with the due date ... for the tax year of the excess distribution", "using the rates and methods under section 6621" (irs-8621-inst-2025::sec::line-16f::b01; ::line-24::b01).
- Default: April 15 of the next year for every year, with no weekend or holiday shift. Interest compounds daily from the day after the start through the end date, at the quarter's underpayment rate over 365 days (366 in a leap year). The rates are Rev. Rul. 2024-18 and the 2025–2026 releases (data/underpaymentRates.ts).
- Alternative (the blind fill): the shifted due dates (2022-04-18 for 2021, 2023-04-18 for 2022). The blind fill also took 7% for April 1–15, 2026 from the Form 2210 worksheet ("Rate Period 4: January 1, 2026–April 15, 2026 ... × 0.07", irs-2210-inst-2025::sec::tax-year-2025::b04–b05). The engine keeps 6% for that quarter: Rev. Rul. 2026-5 sets "an underpayment rate of 6 percent" for the quarter that begins April 1, 2026. Form 2210 keeps the first quarter's rate through April 15 only because of a rule for the estimated tax penalty (section 6621(b)(2)(B)); line 16f is not that penalty.
- Changes dollars: yes, by a few days' interest. The rate and the shift together moved line 16f by $1 in two blind cases (252 against 253, 392 against 393).

## 7. Line 20: interest up to the filing date

- Source: "This is the interest accrued from the due date (not including extensions) of the return for the year for which the section 1294 election was made until the date the current year's return is filed." (irs-8621-inst-2025::sec::line-20::b01)
- Default: unsupported. The engine does not know the filing date. Line 26 (line 20 − line 24) is unsupported with it.
- Changes dollars: no (an informational line).

## 8. Election B: lines 9a to 9c and Form 1040 line 24

- Source: line 9b is the total tax "as if your total taxable income did not include your share of the undistributed earnings of the QEF" (irs-8621-inst-2025::sec::line-9b::b01); line 9c goes in brackets next to Form 1040 line 24 and reduces it (::line-9c::b01).
- Default: lines 9a to 9c are unsupported: the engine figures the return once. Form 1040 line 24 is not reduced, so the return pays the deferred tax now.
- Changes dollars: yes (Form 1040 line 24 with Election B).

## 9. Line 23: a full or a partial termination

- Source: "The deferred tax entered on line 19 is due if the election was completely terminated. If the election was only partially terminated, a proportionate amount ... line 19 by a fraction, of which the numerator is the amount entered on line 22 and the denominator is the amount entered on line 18." (irs-8621-inst-2025::sec::line-23::b01)
- Default: a termination is full when line 22 is at least line 18. A disposition or a change of status (::line-22::b01, "will terminate all elections") is stated with line 22 equal to line 18.
- Changes dollars: yes, when an event ends the election in full with less than line 18 distributed.

## 10. Line 16d on a disposition

- Source: "When you dispose of PFIC stock, the above foreign tax credit rules apply only to the part of the gain that, without regard to section 1291, would be treated under section 1248 as a dividend." (irs-8621-inst-2025::sec::line-16d::b02)
- Default: a gain carries no foreign tax, so line 16d is 0 for it. Section 1248 applies to a 10% shareholder of a controlled foreign corporation, not to a fund investor.
- Changes dollars: no for the funds this fact covers.

## 11. Form 8960: which PFIC amounts are net investment income

- Source: "you'll include in NII any 'excess distributions that are dividends for NIIT purposes as well as any gains that are treated as excess distributions'"; section 1296 inclusions and deductions; a QEF's inclusions with a section 1.1411-10(g) election (irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b02–b03); without it, "Use line 5b to deduct inclusions under section 1293(a)(1)(B) that are allowed on line 5a" (::b05).
- Default: line 6 adds every excess distribution (line 15e(2)) and gain (line 15f), the section 1296 amounts (lines 10c or 12, 13c or 14b), and line 6c with the (g) election. Line 5b subtracts line 7c without it. A QEF's distribution of earnings taxed before (NII without the election, ::b04) is not modeled.
- Changes dollars: yes (Form 8960, Schedule 2 line 12).

## 12. Line 14c: the loss under the general rules

- Source: "This amount is subject to the rules generally applicable to losses provided elsewhere in the Code" (irs-8621-inst-2025::sec::line-14c::b01).
- Default: the line is figured, and Schedule D line 11 is unsupported while a fund has one: the loss belongs on Form 8949, which the engine fills only from sale facts.
- Changes dollars: no (a gap, not a guess).

## 13. A holding period before 1987

- Source: the line 16c rate table starts in 1987 (irs-8621-inst-2025::sec::tax-rates::b01). The instructions say nothing of earlier years.
- Default: unsupported when a PFIC year of the holding period is before 1987.
- Changes dollars: no.

## 14. More than one block of shares

- Source: "complete lines 15a through 15e separately for each block of shares that has the same holding period" (irs-8621-inst-2025::sec::part-v::b01).
- Default: one fund fact is one block with one acquisition date. A fund bought in lots is two or more facts, each its own Form 8621; the instructions want one form with a Part V for each block.
- Changes dollars: no for one block; the form count differs for several.

## 15. Distributions from a QEF

- Source: line 8 (irs-8621-inst-2025::sec::line-8::b01–b02): a distribution beyond the year's inclusion is out of earnings taxed before, or else "subject to tax according to the rules of section 301(c)".
- Default: a QEF's distributions reach the return only on line 8b with Election B. A distribution beyond the earnings taxed before is not taxed by the engine.
- Changes dollars: yes, for that case.

## 16. The $25,000 exception

- Source: a shareholder "is not required to complete Part I with respect to a specific section 1291 fund if the shareholder meets the $25,000 exception ... and the shareholder does not receive an excess distribution from, or recognize gain on the sale" (irs-8621-inst-2025::sec::exceptions-to-filing-part-i::b02–b03).
- Default: such a fund files no Form 8621 at all (no other part needs it). Its nonexcess distributions still go to line 3b. The aggregate is the year-end value of every fund fact.
- Changes dollars: no.

## 17. The foreign tax credit for the general-rules taxes

- Source: excess distribution taxes allocated to pre-PFIC years and the current year "are taken into account for the current tax year under the general rules of the foreign tax credit" (irs-8621-inst-2025::sec::line-16d::b01).
- Default: the tax on the nonexcess distributions and those parts go to Form 1116 as a passive category source in the fund's country. Its income is the nonexcess distributions plus the parts of the excess distributions allocated to 2025 and pre-PFIC years. No payee statement shows it, so Form 1116 files.
- Changes dollars: yes (Form 1116, Schedule 3 line 1).

## 18. Line 15e(1) from a rounded line 15d

- Source: "Subtract line 15d from line 15a" (the form, line 15e(1)). Line 15d is 125% of line 15c, and the instructions say nothing of cents on it.
- Default: line 15d rounds to whole dollars, and line 15e(1) subtracts the rounded value (the engine's rule for a line that is arithmetic on other lines). 450 × 1.25 = 562.50 → 563, so line 15e(1) is 3,000 − 563 = 2,437.
- Alternative: keep the cents of line 15d and round line 15e(1) once: 2,437.50 → 2,438.
- Changes dollars: yes, by $1 on line 15e(1) when line 15d ends in 50 cents.

## 19. Line 24 on a partial termination

- Source: "Enter the interest accrued on the deferred tax" (irs-8621-inst-2025::sec::line-24::b01). It does not say whether that is the tax that becomes due or all of line 19.
- Default: interest on the line 23 amount only, from the due date of the election year's return to the due date of the 2025 return. Interest on the rest of the deferred tax stays deferred with it.
- Changes dollars: yes (line 24 and Schedule 2), when an election ends only in part.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (shareholder, fund, tax years) | stated rule |
| Excepted foreign assets box | stated rule; unsupported when Form 8938 files |
| Qualifying insurance corporation box | stated rule |
| Part I lines 1–4 | stated rule |
| Part I line 5 boxes and amounts | stated rule |
| Part II election boxes | stated rule (the fund fact states each election) |
| Part III lines 6a–8e | stated rule |
| Part III lines 9a–9c | unsupported (a second pass of the return) |
| Part IV lines 10a–14c | stated rule |
| Part V lines 15a–15f | stated rule; own reading for the split (question 2) and the first day (question 4) |
| Part V line 16b–16e | stated rule; own reading for the split and the first day |
| Part V line 16f | stated rule; own reading for the due date and day count (question 6) |
| Part V lines 16b–16f, Elections E, G, H | unsupported (special holding periods) |
| Part VI lines 17–19, 21–25 | stated rule; own reading for a full termination (question 9) |
| Part VI lines 20 and 26 | unsupported (the filing date) |
| Schedule 1 line 8z, Form 1040 lines 3b and 16 (box 3), Schedule 2 lines 17p, 17q, 17z | stated rule |
| Schedule B line 5 | stated rule |
| Schedule D line 11 | own reading (question 1) |
| Form 8960 lines 5b, 6 and the (g) box | stated rule; own reading for the amounts (question 11) |
| Form 1116 source | own reading (question 17) |

## Second opinions

- PolicyEngine-US 2.153.8 (commit b3edc04, 2026-11-23): it does not model Form 8621. It has no section 1291, 1293 or 1296 variable and no section 6621 rate table; its Form 8960 MAGI says "The CFC and PFIC adjustments of Treas. Reg. 1.1411-10(e) are not modeled." The one shared constant is the top section 1 rate (0.396 for 2015–2017, 0.37 from 2018), which matches line 16c's table. No disagreement.
- IRS Direct File (issue #140): no checkout is reachable, and Direct File does not cover a PFIC. Not compared.
- Blind fill (15 cases, 66 lines): every line matches but line 16f in two cases, $1 each (question 6).
