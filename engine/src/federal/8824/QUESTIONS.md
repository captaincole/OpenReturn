# Form 8824: open questions

Each place where the form and its instructions do not settle a rule, sorted in three groups. The numbers stay the same as before, so code comments that name a question still point to it.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment in the code and a row in `docs/rule-decisions.md`, and waits for a person's review.

### A1. Cash on lines 12–18 (`lines.ts`; row A3)

The multi-asset heading says not to complete lines 12–18 with cash; the line 20 example fills line 15 with cash. The engine fills them for one property given up and one received.

### A2. The summary form (`printed.ts`; row A4)

More than one exchange prints the summary form every time.

### 1. Line 21, section 1245: line 19 or the part's own gain (`lines.ts`; row A5)

- Text A: "The total adjustments for deductions ... for depreciation or amortization (up to the amount of gain shown on line 19)" (irs-8824-inst-2025::sec::line-21::b01).
- Text B: the example figures the section 1245(a)(1) amount as "the lesser of the property's depreciable basis of $35,000 or the amount realized of $55,000" (line-24::b01).
- Decision: Text A. The fact does not hold the FMV of the section 1245 parts given up.
- Changes dollars: yes, only when the parts given up are worth less than their depreciation.

## Should we do this now

### 2. Line 21 with both section 1245 and section 1250 recapture

- Line 21 gives a rule for each kind of property, each limited by line 20 (line-21::b01). It does not say how they combine.
- Engine: unsupported (lines 21–25c and the amounts they send).
- Not now: no text gives the rule, so the gap stays named.

### 3. Line 21 for section 1252, 1254 and 1255 property

- "The rules for these types of property are similar to those for section 1245 property. See Regulations sections 1.1252-2(d) and 1.1254-2(d) and Temporary Regulations section 16A.1255-2(c)" (line-21::b02).
- Engine: unsupported.
- Not now: the regulations are not in the library.

### 4. Line 15a: the words

- Taylor writes "cash"; Finley writes "liabilities and cash", whose line 15 is net liabilities after the cash Finley paid (summary-of-facts::b01, b02).
- Done: the other property's description, then "cash" for cash received, then "liabilities" for net liabilities ("liabilities and cash" when cash was paid), joined by "; ". No dollars.

### 5. Lines 25a–25c with land received

- "Amounts entered on lines 25a, 25b, and 25c must be proportionate to their FMVs" (lines-25a-25b-and-25c::b01). The example has no land.
- Done: each part's FMV over the FMV of all the like-kind property received (line 16 before rounding), times line 25. Land's share is on no line. No tax this year.

### 6. The 180-day rule and the due date of the return

- The property must be received by the earlier of the 180th day or "the due date (including extensions) of your tax return" (line-6::b01).
- Engine: tests the 45 and 180 days only. A 2025 transfer received after April 15, 2026 is not tested against the due date.
- Not now: no fact says whether the return is extended. Changes dollars for that case (the whole gain becomes a sale).

### 7. Lines 9 and 10: not answered, and the 2-year window

- Lines 9 and 10 ask about a disposition "During this tax year (and before the date that is 2 years after the last transfer of property that was part of the exchange)". Only such a disposition makes line 24 reportable (line-7::b02). The 2-year period stops running while the risk of loss is substantially reduced (line-7::b03).
- Done: the fact's answers are the form's questions, window included (`facts/kinds/likeKindExchange.ts`). A disposition in 2025 on or after the 2-year date is "No". Not answered, the form asks for the exchange again (missingInputs); until then Schedule D and Form 4797 get the amounts with no disposition.
- The engine does not test the window itself: the fact holds no disposition date. Cade must ask the form's question as printed.

### 8. A related party disposition: recapture and losses

- "Report the deferred gain or (loss) from line 24 on this year's tax return as if the exchange had been a sale" (line-7::b02). A loss from a sale between related parties is not deductible (irs-1040sd-inst-2025::sec::certain-nondeductible-losses::b01).
- Engine: unsupported when line 24 is a loss, or when the property given up states any recapture. Otherwise line 24 goes where line 22 goes.
- Not now: the instructions do not say how a sale's recapture applies to line 24.

### 9. Schedule D line 19 for a section 1231 gain from depreciated real property

- The Unrecaptured Section 1250 Gain Worksheet takes Part III properties of Form 4797 (line 1) and dispositions with no entry in Part I (line 12) (irs-1040sd-inst-2025::sec::unrecaptured-section-1250-gain-worksheet-line-19::b01, b03). A Form 8824 gain goes on Form 4797 line 5, in Part I.
- Engine: Schedule D line 19 is unsupported when the property given up had section 1250 depreciation and Form 4797 line 5 gets a gain.
- Not now: it changes the worksheet of another form (Schedule D). Changes dollars, possibly (the 25% rate).

### 10. Part IV and a Form 1099-B for the same sale

- Line 36's capital gain goes on Schedule D (line-36::b01). A broker reports the sale on Form 1099-B too.
- Engine: the Part IV fact carries the sale. A 1099-B fact for the same sale would put it on Form 8949 as well.
- Not now: the engine cannot see that the two are one sale; Cade's rules for the 1099-B must say so when Part IV is used.

### 11. Line 35 for business property

- "Use Part III of Form 4797 as a worksheet" (line-35::b01).
- Engine: 0 for a capital asset (no depreciation). Business property makes lines 35–38 unsupported.
- Not now: Form 4797 Part III as a worksheet for a Part IV fact is a new path into another form.

### 12. Other property given up that was used in a business

- Line 14 is reported "in the same manner as if the exchange had been a sale" (the form; line-14::b01).
- Engine: investment property goes to Schedule D line 4 or 11 by its holding period. Business property makes Form 4797 lines 5 and 16 a gap.
- Not now: its recapture would need Form 4797 Part III from an exchange fact.

### 13. Line 1 and line 2 descriptions

- "Enter the address and type of property" (lines-1-and-2::b01).
- Done: the fact's description, as stated, over two entry lines (a split at a space after 100 characters). No dollars.

### 14. California

- Not now: California conforms to section 1031 for real property; its basis can differ, and FTB 3840 (property outside California) is another branch's work. The engine changes no California line.

### 15. A building received with no split stated (lines 21 and 25a)

- "If you received section 1250 property ... you must complete lines 25a, 25b, and/or 25c" (lines-25a-25b-and-25c::b01). In the example the taxpayer "determines the apartment building received from Finley contains only like-kind section 1250 property" (lines-25a-25b-and-25c::b02).
- Done: the split is the taxpayer's statement (`received.section1250Value`, `section1245Value`, `intangibleValue`). When the property given up has section 1250 recapture and no section 1250 value received is stated, the form asks for the exchange again (`exchange.ts` `waitsForSection1250Value`): the section 1250 rule of line 21 reads that value. A stated 0 (land received) answers it.
- Still open: with no recapture, a part not stated is 0, so line 25a is blank for a building with no split. That is basis only, no tax this year. The blind fill read a building with no split as all section 1250 property (25a = line 25, as in the Taylor example); with that value stated the engine agrees in all five cases.

### 16. Line 24 with a section 121 exclusion

- The home steps change only lines 19, 20 and 25 ("Fill out Form 8824 according to its instructions, with the following exceptions", property-used-as-home::b01). Line 24 stays "Subtract line 23 from line 19".
- Done: the form's arithmetic. Example: gain $285,000, exclusion $250,000, nothing recognized: line 24 = $285,000; the gain truly deferred is $35,000, which line 25 reflects. No tax: line 24 sends nothing in the year of an exchange with an unrelated party.

### 17. Lines 25a–25c that do not add to line 25 after rounding

- "Amounts entered on lines 25a, 25b, and 25c must be proportionate to their FMVs" (lines-25a-25b-and-25c::b01).
- Done: each line rounds to the nearest dollar on its own, as computed rows do (CLAUDE.md rounding). Example: $72,312.50 and $16,687.50 → $72,313 + $16,688 = $89,001 against line 25 $89,000. $1 of basis.

### 18. More than one Part IV sale

- Part IV holds one sale; the instructions give no summary for Part IV.
- Engine: two or more sale facts make Part IV unsupported (`printed.ts`, `ONE_PART_IV`).
- Not now: no scenario has two sales, and copies of the whole form for Part IV would print Parts I–III twice.

## Pattern change

### Schedule D and Form 4797 take Form 8824 amounts

- Before: Schedule D lines 4 and 11 listed Form 8824 among the forms with no amount, so the line was unsupported while Form 8824 filed.
- After: each line reads a receipt from `8824/receivers.ts` (an amount, a gap, or none), as Form 4797 lines 5 and 16 do; the line is a gap only for the forms that still send no amount.

### Form 8960's income bound reads the exchange's own amounts

- Before: Form 8824 added its whole realized gain (line 19) to the upper bound on MAGI, so a large deferred gain filed a Form 8960 that owed $0.
- After: it adds the gains the exchange sends this year (`upperBound.ts`), and line 19 only while the amounts are not settled (a gap, or an answer missing).

## Proposals for a discussion

- **Multi-asset exchanges.** The fact holds one property given up and one received. More than one property needs the exchange groups of Regulations section 1.1031(j)-1 and a statement in place of lines 12–18 (multi-asset-exchanges::b01). Proposal: a list of properties per side, and a statement layout.
- **A home used partly for business.** Two worksheet Forms 8824 split every amount (property-used-as-home::b02). Proposal: the fact states the home share; the engine fills two worksheets and adds lines 15–25. Today such a fact is a gap.
- **Installment sales.** Form 6252 has rules, but an installment exchange's line 22 and line 21 do not flow through it yet: the exchange fact and the installment sale fact are not linked, so Form 8824 makes such an exchange a gap (exchange.ts). Proposal: the exchange fact names its installment sale, and Form 6252 takes lines 21 and 22.
- **A disposition date for lines 9 and 10.** The fact holds the answers, not the date. A date of the first disposition would let the engine test the 2-year window (question 7), but tolling (line-7::b03) can move the window, so the answer would still be the taxpayer's.

## Second opinions

- **Blind fill** (14 cases, lines 14–25c and 30–38, from the blank form and the instructions only). Every line agrees in dollars once the building split is stated (question 15). Line 35 of a stock sale is 0 in the engine and blank in the blind fill (Form 4797 Part III as a worksheet gives 0).
- **PolicyEngine-US** 2.153.8 (commit b3edc04): no variable for a like-kind exchange, Form 8824, section 1031 or section 1043. Capital gains and unrecaptured section 1250 gain are inputs there. Nothing to compare.
- **IRS Direct File** (IRS-Public/direct-file, commit e365f9f): its fact dictionary (`backend/src/main/resources/tax`) has no Form 8824 or like-kind exchange. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (page 1), page 2 header blank | stated rule |
| Lines 1–6 | stated rule (line 5: the 45-day note) |
| Line 7, Part II (lines 8–11c) | stated rule; lines 9 and 10 are the taxpayer's answers (question 7) |
| Lines 12–14 | published example with numbers (Pub. 544, stock given up) |
| Lines 15–20 | published example with numbers (Taylor, Finley; Pub. 544) |
| Line 15a | own reading (question 4) |
| Line 19 entry space, section 121 | published example with numbers (Rev. Proc. 2005-14 Example 1) |
| Line 21 | published example with numbers (Taylor, Finley; Pub. 544); DECISION A3; unsupported for both kinds or sections 1252–1255 |
| Lines 22–25 | published example with numbers |
| Lines 25a–25c | published example with numbers (Finley); own reading for land (question 5) |
| Summary form (lines 1, 23, 25) | stated rule; DECISION A2 |
| Lines 26–34 | stated rule (the form's arithmetic) |
| Lines 35–38 | stated rule; unsupported for business property |
| Schedule D lines 4 and 11 | stated rule (the Schedule D lines) |
| Form 4797 lines 5 and 16 | stated rule (8824 lines 21 and 22) |
| Schedule D line 19 | unsupported with a depreciated building (question 9) |
