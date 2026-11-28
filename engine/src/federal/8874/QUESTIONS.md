# Form 8874 — open questions

Form 8874 (Rev. November 2021) holds its own instructions (`irs-8874-form-2025`). No published example with numbers is in the 2025 corpus. The IRS Audit Technique Guide for the New Markets Tax Credit (May 2010, page 3) has two examples of the rate table; they are unit tests (`tests/unit/federal/8874/lines.test.ts`).

## Doubts with no conflicting text

1. **Passive or not.** The instructions do not say when the credit of a directly held investment is a passive activity credit. Each investment fact states it (`passive`), as a Form 3468 property does. Stock in a corporation is not an activity of the holder; a capital interest in a partnership can be. Default: none; the form waits for the answer. A passive credit goes on Form 8582-CR Worksheet 4 (not rental real estate). Changes dollars: yes, through Form 8582-CR.

2. **Sold on the credit allowance date.** "You cannot claim the credit for any credit allowance date after the disposition" (`recapture-of-the-credit::b02`). Default: a sale on the date itself keeps that date's credit; a sale the day before loses it. Section 45D(a)(1) gives the credit to the taxpayer "who holds" the investment on the date (`usc-26-2025::sec::s45d::a`). Changes dollars: yes, one year's credit, only for a sale on that exact day.

3. **February 29.** An investment made on February 29 has no anniversary in most years. Default: February 28. Changes dollars: no; it only moves the date a sale is compared with.

4. **Recapture.** A recapture event (Form 8874-B) in 2025 makes that investment's column (f) a gap. The recapture amount goes on Schedule 2 line 17a ("NMCR", `irs-1040-inst-2025::sec::line-17a::b01`), figured under section 45D(g) from the credits of earlier years with interest. The engine does not figure it. An event in an earlier year leaves no row: the investment is no longer a qualified equity investment. Changes dollars: yes; the return is unsupported until the amount is figured.

5. **More than six investments.** "If you need more space, attach a statement ... On the last row on line 1, write 'See attached' in column (a) and enter the total of the credit amounts from the attached statement in column (f)" (`specific-instructions::b01`). The engine writes no statements, so row 6 prints "See attached" and its column (f) is a gap, as Form 8586 does for its BINs. Changes dollars: no, only the printed form; the return is unsupported.

6. **Column (f) against Form 8874-A box 10.** The CDE prints the allowable credit for each year in boxes 10a to 10g. Column (f) is "(d) × (e)" (`face-page-1::b01`), so the engine follows the form's arithmetic and does not read box 10. Changes dollars: no, when the CDE printed the same amount.

7. **Column (d) with cents.** Column (d) prints whole dollars, and column (f) multiplies the rounded column (d), as lines defined on other lines do (CLAUDE.md, rounding). Changes dollars: at most $1.

8. **Column (a) address.** Form 8874-A prints no CDE address, and column (a) asks for "Name and address". The address is the holder's answer (`cdeAddress`); while it is missing, column (a) prints the name and the form lists the fact.

9. **Investment acquired from an earlier holder.** The credit goes to a holder who bought "from a taxpayer for whom the investment was a qualified equity investment" (`qualified-equity-investment::b01`), on the dates counted from the original issue. The fact's box 7 date is the original issue date in either case. Changes dollars: no.

10. **Partial sale.** A sale of part of an investment is not modeled: `disposedOn` ends the whole investment. Changes dollars: yes, for a partial sale before a credit allowance date (rare).

## Basis reduction: where the engine could hold it

"You must reduce your basis in your qualified equity investment by the amount of the new markets credits allowed (even if part or all of the credit is not allowed for the current year and is carried forward)" (`basis-reduction::b01`; section 45D(h), `usc-26-2025::sec::s45d::h`, says "determined").

The reduction matters only when the investment is sold. A sale goes on Form 8949 from a trade fact (`facts/kinds/trade.ts`): its basis is box 1e, or a taxpayer-reported basis fact when box 1e is blank, with an adjustment in column (g). No fact links a trade to an investment, and no fact holds the credits of earlier years. So the engine does not reduce the basis. Today the taxpayer states the reduced basis on the trade (the taxpayer-reported basis), or Cade records the adjustment. Not a new fact: the task leaves it as a stated answer.

## Proposals for a discussion

- **Recapture on Schedule 2 line 17a.** A Form 8874-B fact on the investment (the event date, and the credits claimed in each earlier year) would let the engine figure the recapture amount of section 45D(g) and put it on Schedule 2 line 17a with "NMCR". That adds a family of input documents (Form 8874-B), so it waits for a person.
- **Basis of a sold investment.** A trade fact could name its investment fact (`newMarketsInvestmentKey`), and the engine would lower the basis by the credits of the credit allowance dates held, from boxes 10a to 10g of Form 8874-A, as Form 8949 column (g). That changes how a trade's basis is read, so it waits for a person.

## Second opinions

- **Blind fill (2026-11-27).** A preparer filled 14 cases from the blank form and its instructions only. Every line 1 rate and credit, line 2 and line 3 matches the engine, blank lines included. The preparer's dollar doubts are items 1, 2 and 7 above and decision A122 (line 2 rounding). On item 2 the preparer made the same choice: a sale on the credit allowance date keeps that date's credit.
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
| Line 2 (K-1 code AD) | stated rule; rounding is decision A122 |
| Line 3 | stated rule |
| Passive answer | own reading (stated by the holder) |
