# FTB 3840 — open points

Each point says where the form and its instructions do not settle a rule,
the default the engine applies, and whether it changes a dollar amount.
Instructions: `ca-3840-inst-2025`. Side 1 copies Form 8824 (see
`federal/8824/QUESTIONS.md` for its own points).

## Decided with conflicting texts (also in docs/rule-decisions.md)

1. **Schedule A line 3, the consideration.** Line 3 (`part-i-properties-given-up::b01`)
   lists only what was received: "all money and notes received, plus any mortgages
   or other debts assumed by the buyer ... plus the fair market value of any other
   property". Form 8824 lines 15 and 18 net the liabilities the taxpayer assumed,
   the cash paid and the other property given up. Default: line 3 is net of them,
   so line 7 equals Side 1 line 14 when the bases agree (`lines.ts`). Dollars:
   lines 3, 5 and 7 only; line 8 does not change.

## Doubts with no conflicting text

2. **When does FTB 3840 ask for the California answers?** The form files for
   California property traded for property outside California, "regardless of
   residence status" (`b-who-must-file::b01`). The engine cannot know where a
   property is without the California fact. Default: an exchange with no
   California fact files the form while Form 540 or Form 540NR files, and the
   form asks for `ca_like_kind_exchange.<slug>`. A federal-only return (no
   California return) never asks. No dollars on the California return.
3. **Question C is one radio group in the PDF.** The instructions say "check
   both boxes" for real and personal property, and "also check" related party
   (`general-question-a-through-question-c::b03`). The PDF allows one choice.
   Default: "Related party" for a related party exchange (the name and number
   lines refer to it), else "Real property". Personal property is never
   checked: the exchange fact is real property, and personal property qualified
   only before 2025. No dollars.
4. **Initial and Final in the same year.** An exchange of 2025 whose deferred
   gain is also recognized in 2025 fits both boxes of Question B. Default:
   Final, with 2025 as the year of the exchange. No dollars.
5. **A related party disposition.** Form 8824 reports the deferred gain "as if
   the exchange had been a sale" (`irs-8824-inst-2025::sec::line-7::b02`).
   Default: that recognizes the California deferred gain, so Question B is
   Final. No dollars.
6. **Line 8, "adjusted for differences between federal and California law"**
   (`part-i-properties-given-up::b02`). Default: the one difference a fact
   carries is the basis (`californiaAdjustedBasis`; absent means the federal
   basis). Line 8 = Side 1 line 19 + federal basis − California basis, valid
   while the California recognized gain equals the federal one. Otherwise, or
   with recapture and a different basis, line 8 is unsupported. Changes line 8.
   The blind fill (case 12) shows the other reading: federal basis $80,000,
   California basis $104,000, land of $100,000 and $5,000 cash. The simple move
   gives −$4,000; the blind preparer redid Form 8824 lines 19–24 with the
   California basis (realized $1,000, recognized the smaller of line 15 or that
   gain, $1,000) and entered 0. The engine keeps line 8 unsupported: a line 8 of
   0 is right only when the California return also recognizes $1,000, not the
   federal $5,000, and Schedule D (540) does not take California Form 8824
   amounts yet. Changes line 8 by up to the basis difference.
13. **A deferred loss on line 8.** Line 8 is titled "California sourced
    deferred gain", but the instructions "add the deferred gain or loss
    amounts" (`part-i-properties-given-up::b03`). Default: a loss on Side 1
    line 19 prints as a negative amount on lines 8 and 10 column D (blind case
    7 agrees: −$20,000). Changes line 8 when the other reading (0) is right.
14. **Other property given up is not a Schedule A column.** Line 1 says "List
    each property given up" (`part-i-properties-given-up::b01`); line 8 speaks of
    real property in California. Default: column A is the like-kind property
    only; the stock's gain is recognized on Side 1 line 9, and its value comes
    out of line 3 (decision 1). The blind fill agrees (cases 5 and 13). Changes
    lines 3, 5 and 7 when wrong; line 8 does not change.
7. **The California basis, when not stated.** Default: the federal adjusted
   basis (the fact says "absent: the same"). Cade asks when a property was
   depreciated or came from an earlier exchange. Changes lines 6–8 when wrong.
8. **Line 11, the apportionment percentage.** "For taxpayers required to
   apportion income to California using Schedule R" (`part-iii-…::b01`). The
   engine has no Schedule R. Default: the stated percentage from the fact;
   absent means the taxpayer does not apportion, and the line is blank. No
   dollars.
9. **The signature area.** "If form FTB 3840 is attached to a California tax
   return, no signature is needed" (`e-signature::b01`). Default: blank with a
   California return. Filed separately: the taxpayer's phone prints; the dates
   are unsupported (signed by hand), and a joint filer's spouse phone is
   unsupported (no fact). The representative and firm lines stay blank: an
   individual signs for herself. No dollars.
10. **Attachments.** Line 8 ("Attach a statement that shows the adjusted
    deferred gain calculation"), an amended form and a final form each need a
    statement. The engine prints no statement. The Amended box is never
    checked: the engine prepares the year's form, not a correction. No dollars.
11. **Header lines for an entity or a foreign address.** The corporation
    number, FEIN, Secretary of State number, fiscal year, PMB, "Additional
    information" and the foreign address lines stay blank: the engine prepares
    an individual's calendar-year return, and no identity fact holds those
    values. No dollars.
12. **Ownership percentage boxes.** The comb has six cells with the point in
    the fourth. Default: three places, zero-padded ("050.00"). No dollars.

## Second opinions

- **Blind fill** (14 cases, Side 1 lines 9–20 and Schedule A lines 3, 5, 7, 8
  and 10 column D, from the blank form and the instructions only). Every line
  agrees in dollars except case 12 line 8 and line 10 column D: the engine
  leaves them unsupported and the blind fill enters 0 (question 6). The blind
  doubts on Form 8824 itself (lines 12–18 of an exchange with cash, the line 21
  cap) are the federal form's points (`federal/8824/QUESTIONS.md`, the
  multi-asset note and question 1); the engine agrees with the blind fill on
  both.
- **PolicyEngine-US** 2.153.8 (commit b3edc04), California tax code
  (`variables/gov/states/ca`, `parameters/gov/states/ca`): no variable for a
  like-kind exchange, R&TC 18031, FTB 3840 or a California basis difference.
  Nothing to compare.
- **IRS Direct File** prepares no California return, and its fact dictionary
  has no like-kind exchange (`federal/8824/QUESTIONS.md`). Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Side 1 lines 7–20 | published example with numbers (Form 8824 Taylor and Finley, copied line for line) |
| Schedule A line 8, line 10 column D | published example with numbers (FTB Pub. 1100 Example 16) for equal bases; own reading for the basis adjustment |
| Question B and its year | published example (Question B, a 2024 exchange); own reading for Final |
| Schedule A lines 3–7 | own reading (decision 1), checked against Pub. 544's realized gains |
| Part I lines 1–6, Question C names | stated rule (copy Form 8824 lines 1–6 and Part II) |
| Schedule A rows A and D, line 2, line 11 | stated rule, from the California fact |
| Header, Question A | stated rule |
| Rows B, C, E, F and columns B, C, E, F | stated rule: blank, one property each side per fact |
| Signature dates, spouse phone (filed separately) | unsupported |

## Proposals for a discussion

- **Multi-asset exchanges.** Rows B, C, E and F, and the allocation of line 10
  among several properties received, need an exchange fact with more than one
  property on each side. Form 8824 does not take one either (a statement under
  Treas. Reg. 1.1031(j)-1). Proposal: a list of properties given up and
  received in the exchange fact, each with its value and California answers,
  and a line 10 allocation by fair market value.
- **Personal property exchanged before 2025.** California allowed some
  individuals to defer gain on personal property exchanged from 2019 to 2024
  (R&TC 18031.5), which federal law did not. Such an exchange has no Form 8824
  fact. Proposal: a California-only exchange fact for the Annual forms of those
  exchanges.
- **A nonresident's Final form.** The recognized California sourced deferred
  gain is California income of a nonresident (FTB Pub. 1100, Example 16).
  Schedule CA (540NR) has no rules yet; it would read the Final FTB 3840.
