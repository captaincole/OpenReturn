# Form 8824: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides. The two decisions with conflicting texts (cash on lines 12–18; the summary form) are in `docs/rule-decisions.md`, rows A1 and A2.

## 1. Line 21, section 1245: line 19 or the part's own gain

- Source: "The total adjustments for deductions ... for depreciation or amortization (up to the amount of gain shown on line 19)" (irs-8824-inst-2025::sec::line-21::b01). The example figures the section 1245(a)(1) amount as "the lesser of the property's depreciable basis of $35,000 or the amount realized of $55,000" (line-24::b01).
- Default: the depreciation, up to line 19, as the line instruction says. The fact does not hold the FMV of the section 1245 parts given up.
- Changes dollars: yes, only when the parts given up are worth less than their cost.

## 2. Line 21 with both section 1245 and section 1250 recapture

- Source: line 21 gives a rule for each kind of property, each limited by line 20 (irs-8824-inst-2025::sec::line-21::b01). It does not say how they combine.
- Default: unsupported (lines 21–25c and the amounts they send).
- Changes dollars: no (a gap).

## 3. Line 21 for section 1252, 1254 and 1255 property

- Source: "The rules for these types of property are similar to those for section 1245 property. See Regulations sections 1.1252-2(d) and 1.1254-2(d) and Temporary Regulations section 16A.1255-2(c)" (line-21::b02).
- Default: unsupported. The regulations are not in the library.
- Changes dollars: no (a gap).

## 4. Line 15a: the words

- Source: Taylor writes "cash"; Finley writes "liabilities and cash", whose line 15 is net liabilities after the cash Finley paid (irs-8824-inst-2025::sec::summary-of-facts::b01, b02).
- Default: the other property's description, then "cash" for cash received, then "liabilities" for net liabilities ("liabilities and cash" when cash was paid), joined by "; ".
- Changes dollars: no.

## 5. Lines 25a–25c with land received

- Source: "Amounts entered on lines 25a, 25b, and 25c must be proportionate to their FMVs" (lines-25a-25b-and-25c::b01). The example has no land.
- Default: each part's FMV over the FMV of all the like-kind property received (line 16 before rounding), times line 25. Land's share is on no line.
- Changes dollars: no tax this year (the basis of the parts).

## 6. The 180-day rule and the due date of the return

- Source: the property must be received by the earlier of the 180th day or "the due date (including extensions) of your tax return" (irs-8824-inst-2025::sec::line-6::b01).
- Default: the engine tests the 45 and 180 days only. It does not know whether the return is extended, so a 2025 transfer received after April 15, 2026 is not tested against the due date.
- Changes dollars: yes, for that case (the whole gain becomes a sale).

## 7. Lines 9 and 10 not answered

- Source: lines 9 and 10 ask about dispositions in 2025.
- Default: the form asks for the exchange again (missingInputs). Until then, Schedule D and Form 4797 get the amounts with no disposition.
- Changes dollars: no once answered.

## 8. A related party disposition: recapture and losses

- Source: "Report the deferred gain or (loss) from line 24 on this year's tax return as if the exchange had been a sale" (irs-8824-inst-2025::sec::line-7::b02). A loss from a sale between related parties is not deductible (irs-1040sd-inst-2025::sec::certain-nondeductible-losses::b01).
- Default: unsupported when line 24 is a loss, or when the property given up states any recapture. Otherwise line 24 goes where line 22 goes.
- Changes dollars: no (a gap).

## 9. Schedule D line 19 for a section 1231 gain from depreciated real property

- Source: the Unrecaptured Section 1250 Gain Worksheet takes Part III properties of Form 4797 (line 1) and dispositions with no entry in Part I (line 12) (irs-1040sd-inst-2025::sec::unrecaptured-section-1250-gain-worksheet-line-19::b01, b03). A Form 8824 gain goes on Form 4797 line 5, in Part I.
- Default: Schedule D line 19 is unsupported when the property given up had section 1250 depreciation and Form 4797 line 5 gets a gain.
- Changes dollars: yes, possibly (the 25% rate).

## 10. Part IV and a Form 1099-B for the same sale

- Source: line 36's capital gain goes on Schedule D (irs-8824-inst-2025::sec::line-36::b01). A broker reports the sale on Form 1099-B too.
- Default: the Part IV fact carries the sale. A 1099-B fact for the same sale would put it on Form 8949 as well; the engine cannot see that the two are one sale.
- Changes dollars: yes, if both are recorded.

## 11. Line 35 for business property

- Source: "Use Part III of Form 4797 as a worksheet" (irs-8824-inst-2025::sec::line-35::b01).
- Default: 0 for a capital asset (no depreciation). Business property makes lines 35–38 unsupported.
- Changes dollars: no (a gap).

## 12. Other property given up that was used in a business

- Source: line 14 is reported "in the same manner as if the exchange had been a sale" (the form; line-14::b01).
- Default: investment property goes to Schedule D line 4 or 11 by its holding period. Business property makes Form 4797 lines 5 and 16 a gap: its recapture would need Form 4797 Part III.
- Changes dollars: no (a gap).

## 13. Line 1 and line 2 descriptions

- Source: "Enter the address and type of property" (lines-1-and-2::b01).
- Default: the fact's description, as stated, over two entry lines (a split at a space after 100 characters).
- Changes dollars: no.

## 14. California

- The engine changes no California line. California conforms to section 1031 for real property; its basis can differ, and FTB 3840 (property outside California) is another branch's work.

## 15. A building received with no split stated (lines 21 and 25a)

- Source: "If you received section 1250 property ... you must complete lines 25a, 25b, and/or 25c" (lines-25a-25b-and-25c::b01). In the example the taxpayer "determines the apartment building received from Finley contains only like-kind section 1250 property" and puts all of line 25 on line 25a (lines-25a-25b-and-25c::b02).
- Default: the split is the taxpayer's statement (`received.section1250Value`, `section1245Value`, `intangibleValue`). A part not stated is 0: line 25a is blank, and the section 1250 rule of line 21 counts no section 1250 property received, so all of the ordinary income if sold is recognized on line 21.
- The blind fill read a building, house or condo with no split as all section 1250 property (25a = line 25, as in the Taylor example). With that value stated, the engine gives the blind fill's 25a in all five cases.
- Changes dollars: yes. Line 25a is basis only, but line 21 is tax this year when the property given up has section 1250 recapture and no section 1250 value of the property received is stated. Proposal: Cade asks for the split whenever the property received is a building; or the fact makes `section1250Value` required when `recapture.section1250OrdinaryIfSold` is above 0.

## 16. Line 24 with a section 121 exclusion

- Source: the home steps change only lines 19, 20 and 25 ("Fill out Form 8824 according to its instructions, with the following exceptions", property-used-as-home::b01). Line 24 stays "Subtract line 23 from line 19".
- Default: the form's arithmetic. Example: gain $285,000, exclusion $250,000, nothing recognized: line 24 = $285,000. The gain truly deferred is $35,000, which line 25 reflects ($480,000 FMV − $35,000 = $445,000).
- Changes dollars: yes on line 24 ($285,000 against $35,000); no tax this year. Line 24 sends nothing in the year of an exchange with an unrelated party.

## 17. Lines 25a–25c that do not add to line 25 after rounding

- Source: "Amounts entered on lines 25a, 25b, and 25c must be proportionate to their FMVs" (lines-25a-25b-and-25c::b01).
- Default: each line rounds to the nearest dollar on its own. Example: line 25 $89,000 split 130/160 and 30/160 gives $72,312.50 and $16,687.50 → $72,313 + $16,688 = $89,001.
- Changes dollars: $1 of basis. The alternative takes the last part as line 25 less the others.

## Proposals for a discussion

- **Multi-asset exchanges.** The fact holds one property given up and one received. More than one property needs the exchange groups of Regulations section 1.1031(j)-1 and a statement in place of lines 12–18 (multi-asset-exchanges::b01). Proposal: a list of properties per side, and a statement layout.
- **A home used partly for business.** Two worksheet Forms 8824 split every amount (property-used-as-home::b02). Proposal: the fact states the home share; the engine fills two worksheets and adds lines 15–25. Today such a fact is a gap.
- **Installment sales.** Form 6252 has no rules. When it does, line 22 and line 21 of an installment exchange can flow through it.

## Second opinions

- **Blind fill** (14 cases, lines 14–25c and 30–38, from the blank form and the instructions only). Every line agrees in dollars once the building split is stated (question 15). Line 35 of a stock sale is 0 in the engine and blank in the blind fill (Form 4797 Part III as a worksheet gives 0).
- **PolicyEngine-US** 2.153.8 (commit b3edc04): no variable for a like-kind exchange, Form 8824, section 1031 or section 1043. Capital gains and unrecaptured section 1250 gain are inputs there. Nothing to compare.
- **IRS Direct File** (IRS-Public/direct-file, commit e365f9f): its fact dictionary (`backend/src/main/resources/tax`) has no Form 8824 or like-kind exchange. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (page 1), page 2 header blank | stated rule |
| Lines 1–6 | stated rule (line 5: the 45-day note) |
| Line 7, Part II (lines 8–11c) | stated rule |
| Lines 12–14 | published example with numbers (Pub. 544, stock given up) |
| Lines 15–20 | published example with numbers (Taylor, Finley; Pub. 544) |
| Line 15a | own reading (question 4) |
| Line 19 entry space, section 121 | published example with numbers (Rev. Proc. 2005-14 Example 1) |
| Line 21 | published example with numbers (Taylor, Finley; Pub. 544); unsupported for both kinds or sections 1252–1255 |
| Lines 22–25 | published example with numbers |
| Lines 25a–25c | published example with numbers (Finley); own reading for land (question 5) |
| Summary form (lines 1, 23, 25) | stated rule; DECISION A2 |
| Lines 26–34 | stated rule (the form's arithmetic) |
| Lines 35–38 | stated rule; unsupported for business property |
| Schedule D lines 4 and 11 | stated rule (the Schedule D lines) |
| Form 4797 lines 5 and 16 | stated rule (8824 lines 21 and 22) |
| Schedule D line 19 | unsupported with a depreciated building (question 9) |
