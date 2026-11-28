# Form 8874 — open questions

Form 8874 (Rev. November 2021) holds its own instructions (`irs-8874-form-2025`). No published example with numbers is in the 2025 corpus. The IRS Audit Technique Guide for the New Markets Tax Credit (May 2010, page 3) has two examples of the rate table; they are unit tests (`tests/unit/federal/8874/lines.test.ts`).

## Two texts conflict

- **Line 2 rounding (decided, A133).** Each K-1's code AD amount rounds to whole dollars before line 2 adds them. The Form 1040 instructions say to round only the total; Form 3800 Part V lists one amount for each K-1, so line 3 equals Form 3800 line 1i. The `DECISION` comment is above `k1NewMarketsCreditOf` in `resolveInfo.ts`; the row is A133 in `docs/rule-decisions.md`. Changes dollars: at most $1 for each K-1 with cents.

## Should we do this now

1. **Passive or not.** Done: each investment fact states it. The instructions do not say when the credit of a directly held investment is a passive activity credit. Each investment fact states it (`passive`), as a Form 3468 property does. Stock in a corporation is not an activity of the holder; a capital interest in a partnership can be. Default: none; the form waits for the answer. A passive credit goes on Form 8582-CR Worksheet 4 (not rental real estate). Changes dollars: yes, through Form 8582-CR.

2. **Sold on the credit allowance date.** Done, as a default. "You cannot claim the credit for any credit allowance date after the disposition" (`recapture-of-the-credit::b02`). Default: a sale on the date itself keeps that date's credit; a sale the day before loses it. Section 45D(a)(1) gives the credit to the taxpayer "who holds" the investment on the date (`usc-26-2025::sec::s45d::a`). Changes dollars: yes, one year's credit, only for a sale on that exact day.

3. **February 29.** Done, as a default. An investment made on February 29 has no anniversary in most years. Default: February 28. Changes dollars: no; it only moves the date a sale or a recapture event is compared with.

4. **Recapture.** Not now: figuring the amount needs a new input document (see "Pattern change"). A recapture event (Form 8874-B) in 2025 makes that investment's column (f) a gap. The recapture amount goes on Schedule 2 line 17a ("NMCR", `irs-1040-inst-2025::sec::line-17a::b01`), figured under section 45D(g) from the credits of earlier years with interest. The engine does not figure it. An event in an earlier year leaves no row: the investment is no longer a qualified equity investment. The recapture period is "within 7 years from the date of the original issuance" (`recapture-of-the-credit::b01`), one year longer than the credit allowance dates. So an investment issued in 2018 has no 2025 credit, but an event in 2025 before its seventh anniversary still owes the amount. Such an investment gets a row with columns (a) to (d), a blank column (e) and the gap in column (f), only to carry the gap; the row goes away when the engine figures the recapture. Default: an event on the seventh anniversary itself is outside the period. Changes dollars: yes; the return is unsupported until the amount is figured.

5. **More than six investments.** Not now: the engine writes no attached statements for any form. "If you need more space, attach a statement ... On the last row on line 1, write 'See attached' in column (a) and enter the total of the credit amounts from the attached statement in column (f)" (`specific-instructions::b01`). The instructions ask for a statement, not a second Form 8874, so the copies mechanism does not fit. Row 6 prints "See attached" and its column (f) is a gap, as Form 8586 does for its BINs. Changes dollars: no, only the printed form; the return is unsupported.

6. **Column (f) against Form 8874-A box 10.** Done: the form's arithmetic. The CDE prints the allowable credit for each year in boxes 10a to 10g. Column (f) is "(d) × (e)" (`face-page-1::b01`), so the engine follows the form's arithmetic and does not read box 10. Changes dollars: no, when the CDE printed the same amount.

7. **Column (d) with cents.** Done. Column (d) prints whole dollars, and column (f) multiplies the rounded column (d), as lines defined on other lines do (CLAUDE.md, rounding). Changes dollars: at most $1.

8. **Column (a) address.** Done: a stated answer. Form 8874-A prints no CDE address, and column (a) asks for "Name and address". The address is the holder's answer (`cdeAddress`); while it is missing, column (a) prints the name and the form lists the fact.

9. **Investment acquired from an earlier holder.** Done. The credit goes to a holder who bought "from a taxpayer for whom the investment was a qualified equity investment" (`qualified-equity-investment::b01`), on the dates counted from the original issue. The fact's box 7 date is the original issue date in either case. Changes dollars: no.

10. **Partial sale.** Not now: no scenario has one, and it is rare. A sale of part of an investment is not modeled: `disposedOn` ends the whole investment. Changes dollars: yes, for a partial sale before a credit allowance date.

11. **Basis reduction.** Not now: no fact links a sale to an investment (see "Pattern change"). "You must reduce your basis in your qualified equity investment by the amount of the new markets credits allowed (even if part or all of the credit is not allowed for the current year and is carried forward)" (`basis-reduction::b01`; section 45D(h), `usc-26-2025::sec::s45d::h`, says "determined"). The reduction matters only when the investment is sold. A sale goes on Form 8949 from a trade fact (`facts/kinds/trade.ts`): its basis is box 1e, or a taxpayer-reported basis fact when box 1e is blank, with an adjustment in column (g). No fact links a trade to an investment, and no fact holds the credits of earlier years. So the engine does not reduce the basis. Today the taxpayer states the reduced basis on the trade (the taxpayer-reported basis), or Cade records the adjustment.

## Pattern change

- **Recapture on Schedule 2 line 17a.** Before: a 2025 recapture event is a gap in column (f), and the return is unsupported. After: a Form 8874-B fact on the investment (the event date, and the credits claimed in each earlier year) lets the engine figure the section 45D(g) amount and put it on Schedule 2 line 17a with "NMCR"; that adds a family of input documents, so it waits for a person.
- **Basis of a sold investment.** Before: the taxpayer states the reduced basis on the trade. After: a trade fact names its investment fact (`newMarketsInvestmentKey`), and the engine lowers the basis by the credits of the credit allowance dates held (Form 8874-A boxes 10a to 10g) as a Form 8949 column (g) adjustment; that changes how a trade's basis is read, so it waits for a person.

## Second opinions

- **Blind fill (2026-11-27).** A preparer filled 14 cases from the blank form and its instructions only. Every line 1 rate and credit, line 2 and line 3 matches the engine, blank lines included. The preparer's dollar doubts are items 1, 2 and 7 above and decision A133 (line 2 rounding). On item 2 the preparer made the same choice: a sale on the credit allowance date keeps that date's credit.
- **PolicyEngine-US 2.154.2 (commit c1fea42a38).** It does not model the new markets credit. `general_business_credit` is a bare input with no formula, so it has no constant or formula to compare.
- **Other projects.** The repository names no other reference implementation for this form.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | stated rule |
| Line 1 columns (a) to (c) | stated rule |
| Line 1 column (d) | stated rule |
| Line 1 column (e), rate 5 or 6 | published example with numbers (ATG Examples 1 and 2) |
| Line 1 column (f) | published example with numbers (ATG Examples 1 and 2) |
| Row 6 with more than six investments | unsupported (no statement) |
| A recapture event in 2025 | unsupported (Schedule 2 line 17a) |
| Line 2 (K-1 code AD) | stated rule; rounding is decision A133 |
| Line 3 | stated rule |
| Passive answer | own reading (stated by the holder) |
