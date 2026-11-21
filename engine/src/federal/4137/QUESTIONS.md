# Form 4137 (2025): open questions

Each item is a place where the form and its instructions do not settle a rule. The engine applies the default shown. A person decides whether to keep it.

## 1. Rounding of line 1 rows

- Source: line 2 says "Add the amounts from line 1, column (c)" (irs-4137-form-2025::sec::omb-no-1545-0074::b01). The 1040 instructions say to keep cents while adding and round only the total.
- Default: each row prints in whole dollars, and line 2 adds the printed rows (as Form 6781 does).
- Changes dollars: yes, by $1 at most per row, and only when a tip record has cents.

## 2. Column (d) when only W-2 box 8 is known

- Source: "include any allocated tips … shown on your Form(s) W-2, box 8, unless you can prove that your unreported tips are less" (irs-4137-form-2025::sec::line-1::b02). Box 7 shows "the tips that the employee reported" (irs-w2w3-inst-2025::sec::specific-instructions-for-form-w-2::b17).
- Default: with no tip record for that employer, column (c) is box 7 + box 8 and column (d) is box 7. Line 4 is box 8.
- Changes dollars: no for lines 4 through 13. Columns (c) and (d) print low by the same amount when box 7 was capped (boxes 3 and 7 together may not pass $176,100).

## 3. A tip record that does not add up

- Source: column (c) holds every tip, so line 3 and line 5 cannot be more than it (line-1::b02, line-5::b01). The form gives no rule for a wrong record.
- Default: lines 4 and 6 do not go below 0.
- Changes dollars: only for a record that is wrong.

## 4. Railroad retirement (RRTA) compensation on line 8

- Source: line 8 adds RRTA compensation subject to the 6.2% rate, up to $176,100 (irs-4137-form-2025::sec::line-8::b01).
- Default: the engine has no RRTA facts, so line 8 is W-2 boxes 3 and 7 only (as Schedule SE line 8a does). Tips from RRTA work do not go on this form at all (what-s-new::b04).
- Changes dollars: yes, for a filer with RRTA compensation. That filer is not modeled.

## 5. The "1.45% tips" note next to line 10

- Source: "Enter '1.45% tips' and the amount you subtracted on the dotted line next to line 10" (irs-4137-form-2025::sec::line-10::b01).
- Default: the amount comes off the comparison, but the note is not printed: the catalog has no widget for the dotted line.
- Changes dollars: no.

## 6. Line 1c when every tip was reported

- Source: line 1c is the tip income "not reported on Form 1040, line 1a" (irs-1040-inst-2025::sec::line-1c::b01).
- Default: blank (not 0) when a tip record shows nothing unreported and no noncash tips.
- Changes dollars: no.

## 7. Tips in months under $20 with no Form 4137

- Source: Who must file names tips of $20 or more in a month not reported, and allocated tips (irs-4137-form-2025::sec::what-s-new::b02). Pub. 531's Blue Ocean example adds $18 of such tips to wages with no Form 4137 (irs-pub-531-2025::sec::reporting-tips-on-your::b03, b04).
- Default: the form files only when some person's line 6 is more than 0. Line 1c takes the under-$20 tips either way.
- Changes dollars: no (line 6 of 0 owes no tax).

## 8. The qualified tips deduction (Schedule 1-A Part II)

- Source: Schedule 1-A line 4b takes tips from Form 4137 for the 2025 deduction for qualified tips.
- Default: not changed here. Schedule 1-A Part II stays unsupported: no fact says which tips are qualified (a listed tipped occupation). A tipped filer who qualifies gets no deduction from the engine.
- Changes dollars: yes, for a filer in a listed occupation. Follow-up work.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN of the person) | stated rule (form header: a separate form for each spouse) |
| Line 1, columns (a)–(d) | stated rule (line-1::b01, b02); column (d) default from box 7 is own reading |
| Lines 2–4 | published example with numbers (Pub. 531 Blue Ocean) for line 4; stated rule for the sums |
| Line 5 | published example with numbers (Pub. 531 Blue Ocean) |
| Line 6 | published example with numbers (Pub. 531 Blue Ocean: 0) |
| Lines 7–9 | stated rule |
| Line 10 | stated rule (line-10::b01) |
| Lines 11–13 | stated rule |
| 1040 line 1c | published example with numbers (Pub. 531 Blue Ocean) |
| Schedule 2 line 5, 8959 line 2, Schedule SE line 8b | stated rule |
