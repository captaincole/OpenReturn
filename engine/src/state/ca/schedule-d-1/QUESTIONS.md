# Schedule D-1: doubts and defaults

Each item says where the form and its instructions do not settle a rule, the
default the engine applies, and whether the default can change a dollar amount.
Schedule D-1 is federal Form 4797 with California amounts, so the doubts of
`federal/4797/QUESTIONS.md` hold here too (more than one property per part,
Part IV statements, line 11 at 0, abandonments).

1. **Line 30b, farmland held 10 years or longer.** "Enter 100% of line 30a on
   line 30b if your property was held for 10 years or longer"
   (ca-540-sched-d1-inst-2025::sec::irc-section-1252-property::b01). The same
   block: ordinary income on farmland "held more than one year but less than 10
   years". Decided (DECISION in `lines.ts`, `docs/rule-decisions.md`): the
   federal percentage, and no line 30 from the 10th year. Changes dollars: yes.

2. **California amounts default to the federal ones.** A sale or recapture fact
   holds a California field only when the amount differs (as `depreciation.ts`
   does). Default: an absent field is the federal amount. Changes dollars: yes,
   if a difference is not stated.

3. **Line 29a and 29d periods.** California counts additional depreciation after
   1976 and from 1971 through 1976 (irc-section-1250-property::b01); federal after
   1975 and from 1970 through 1975. Default: for property acquired in 1977 or
   later the federal amounts serve; before 1977, or with a different California
   depreciation, the sale must state the California amounts, else the schedule
   is a gap. A California additional depreciation of 0 is straight line: lines
   29a–29e are blank and 29g is 0. Changes dollars: no (a gap).

4. **R&TC 18171 and the section 1250(b) modifications** (irc-section-1250-property::b01).
   Not read: the corpus has no R&TC text. Default: the federal rules with the
   stated California amounts. Changes dollars: possibly, for old property.

5. **Who files.** "Complete and attach this form ... only if your California
   gains or losses ... are different" (a-purpose::b01). Default: a fact states a
   California amount that differs, and line 18b, the section 1231 gain to
   Schedule D, or a Part IV recapture differs from federal Form 4797 (or cannot be
   compared yet). A different basis that changes no gain files nothing. Changes
   dollars: no.

6. **Line 8, California nonrecaptured losses.** Prior California losses can differ.
   Default: the California answer when stated, else the federal answer; when both
   are missing and line 7 is a gain, the schedule asks for the federal answer.
   Changes dollars: yes, if the California amount differs and is not stated.

7. **Lines 3, 4, 5, 14, 15, 16, 18a.** Federal Form 4684 Section B, FTB 3805E and
   federal Form 8824 have no rules. Default: the lines are unsupported; FTB 3805E
   or Form 8824 filing (by decision) makes lines 7–21 a gap. Changes dollars: no.

8. **A passive loss.** "Get form FTB 3801 ... to see how much of the loss is
   allowed before entering it on Schedule D-1" (b-special-rules::b07). FTB 3801
   reads no Schedule D-1 amount. Default: a loss on line 2 or 10 while FTB 3801
   files makes lines 7–21 a gap. A federal summary gap (a K-1 section 1231 item,
   Form 8582 with a loss) is a gap here too, because line 19 copies the federal
   line. Changes dollars: no (a gap).

9. **Line 38 destination.** "Enter on the line for reporting the type of business
   income that resulted in the recapture" (part-iv::b03). Default: a recapture
   that names a Schedule C business on the return goes to Schedule CA line 3; any
   other makes that column's line 38 a gap, and Schedule CA line 3 a gap when its
   amounts differ. A passive business's recapture is not sent through FTB 3801.
   Changes dollars: no for the figured cases.

10. **Schedule D (540) line 1 row.** The form says to enter the gain on line 1 and
    names no columns. Default: one row, "Schedule D-1, net section 1231 gain",
    with the gain in column (e) and columns (b) to (d) blank. With no California
    difference Schedule D-1 does not file, and the row carries the same gain as
    federal Schedule D line 11 when Schedule D (540) files for another reason.
    Changes dollars: no.

11. **Lines 19–21 when a line is blank.** Default: a blank line 19 or 20 counts as
    0 (no ordinary gain or loss). Changes dollars: no.

12. **Form 540NR and Schedule CA (540NR).** The engine's Form 540NR has no rules.
    Default: Schedule D-1 files only on Form 540. Changes dollars: no.

13. **Copies.** "If you have more than 4 transactions to report, use additional
    forms" (part-iii::b01). Lines 2 and 10 have three rows. Default: copy n holds
    rows 3n to 3n + 2 of lines 2 and 10 and columns 4n to 4n + 3 of Part III; the
    totals print on the first copy only. Changes dollars: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Lines 1a–1c | stated rule (federal arithmetic) |
| Lines 2, 6–13, 17, 18b (Parts I and II) | published example with numbers (federal examples, California amounts equal) |
| Lines 19–21b | stated rule |
| Lines 22–28b, 31a–32b (Part III) | published example with numbers (Pub. 544 truck); California amounts own reading |
| Lines 29a–29g | stated rule; California periods own reading (item 3) |
| Lines 30a–30c | published example (Pub. 225 logic) and a decision (item 1) |
| Lines 33–35 | published example with numbers |
| Lines 36–38 | published example with numbers (Pub. 946) |
| Lines 3, 4, 5, 14, 15, 16, 18a | unsupported (Form 4684 Section B, FTB 3805E, Form 8824) |
| Line 29f | stated rule (corporations only: blank) |

## Proposals for a discussion

- **FTB 3801 and Schedule D-1.** A passive activity's Schedule D-1 gain should
  also reach FTB 3801 to free other passive losses (b-special-rules::b07). The
  change would add a Schedule D-1 amount to FTB 3801's worksheets, as Form 8582
  would need for Form 4797. Not made here: it changes how FTB 3801 is evaluated.
