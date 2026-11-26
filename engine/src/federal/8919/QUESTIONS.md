# Form 8919 (2025): open questions

Each item is a place where the form and its instructions do not settle a rule. The engine applies the default shown. A person decides whether to keep it.

## 1. Rounding of the rows and line 6

- Source: line 6 says "Combine lines 1 through 5 in column (f)" (irs-8919-form-2025::sec::face-page-1::b03). The 1040 instructions say "include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
- Default: each row prints in whole dollars. Line 6 keeps the rows' cents and rounds only the total. This is the rule Form 4137 lines 2 and 3 settled (4137 QUESTIONS.md item 1).
- Changes dollars: by $1 at most, only when a firm's pay has cents. egwene shows it: rows 7,500 + 31,200 + 9,800 + 4,350 = 52,850 print, and line 6 is 52,851 (52,850.65).

## 2. Railroad retirement (RRTA) compensation on line 8

- Source: line 8 adds "railroad retirement (RRTA) compensation (subject to the 6.2% rate)", no more than $176,100 (face-page-1::b03, line-8::b01).
- Default: the engine has no RRTA facts, so line 8 is W-2 boxes 3 and 7 plus Form 4137 line 10.
- Changes dollars: yes, for a filer with RRTA compensation. That filer is not modeled.

## 3. Line 8 when the person has no W-2

- Source: line 8 is a total; the form does not say whether a total of nothing is 0 or blank.
- Default: 0 prints. Line 9 is then $176,100.
- Changes dollars: no.

## 4. Column (b) when the firm's number is not known

- Source: "If you are unable to obtain the number, enter 'unknown.'" (lines-1-through-5::b02).
- Default: the fact holds the number or the word "unknown" as stated. A blank number prints "unknown". The engine does not check the EIN or SSN shape.
- Changes dollars: no.

## 5. Column (d) for codes G and H

- Source: "Column (d). Complete only if reason code A or C is entered in column (c)" (lines-1-through-5::b03).
- Default: column (d) prints only for codes A and C, even when the fact holds a date. A code A or C firm with no date waits: column (d) is blank and the firm's fact key is in missingInputs, so Cade asks for the date.
- Changes dollars: no.

## 6. Column (e) when no 1099 came

- Source: "Check if Form 1099-MISC and/or 1099-NEC was received" (the column (e) heading; face-page-1::b02 holds it with the other column headings run together).
- Default: the box is checked when the fact says a 1099 came, and left empty otherwise.
- Changes dollars: no.

## 7. More than five firms

- Source: "attach additional Form(s) 8919 with lines 1 through 5 completed. Complete lines 6 through 13 on only one Form 8919" (lines-1-through-5::b01).
- Default: the rows are unsupported when a person has six or more firms (the engine prints one form per person). Lines 6 to 13 still count every firm. Form 4137 does the same.
- Changes dollars: no.

## 8. The 1099s a firm names

- Source: code H says the 1099 amount "should have been included as wages on Form W-2" (lines-1-through-5::b02). A 1099-NEC or 1099-MISC normally goes to Schedule C or Schedule 1 line 8z.
- Default: a firm fact may name the 1099-NEC and 1099-MISC facts that hold its pay (form1099Keys). Schedule C does not ask which business those 1099-NECs belong to, and Schedule 1 line 8z leaves out those 1099-MISCs. A 1099 the firm does not name is treated as before.
- Changes dollars: yes, when the link is missing: the pay would be counted twice (line 1g and line 8z). Cade must record the link.

## 9. Who files

- Source: four conditions, all must apply (face-page-1::b01, b02).
- Default: a firm fact states all four (Cade records it only when they apply). The form files when the firms' pay is more than 0. The explicit decision decisions.scope.must_file_8919 still wins.
- Changes dollars: no.

## 10. Schedule SE line 8c on a joint return

- Source: line 8c is "Wages subject to social security tax from Form 8919, line 10". Schedule SE is the form of the person with self-employment income.
- Default: the engine models only the taxpayer's Schedule SE, so line 8c takes the taxpayer's Form 8919 line 10. A spouse's Form 8919 does not reach it. Line 8b (Form 4137) does the same.
- Changes dollars: no for the taxpayer. A spouse's Schedule SE is not modeled.

## 11. Rounding of line 8, and of lines 11 to 13 on rounded amounts

- Source: "If you have to add two or more amounts to figure the amount to enter on a line, include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). Line 12 says "Multiply line 6 by 0.0145 (Medicare tax rate)" and line 13 "Add lines 11 and 12" (irs-8919-form-2025::sec::face-page-1::b03). The text does not say whether a line multiplies the rounded line it names or the unrounded sum.
- Default: line 8 adds the W-2 amounts with cents and rounds once. Lines 9 to 13 use the rounded amounts on the lines they name; lines 11 and 12 round their products to the nearest dollar. This is the project rule (CLAUDE.md, whole-dollar rounding). The blind fill made the same choice.
- Changes dollars: by $1 at most. Three firms of $333.33: line 6 = 1,000 (999.99), line 12 = 15 (14.50). With the unrounded sum, line 12 = 14 (14.4999) and line 13 = 76, not 77.

## Second opinions

- No published example with numbers exists for this form (corpus and web search, .scratch/evidence.md).
- Blind fill (14 cases and a joint return, filled by hand from the blank form and instructions only): every line matches the engine. No blank-against-0 difference and no dollar difference. The blind preparer's rounding doubt is item 11.
- PolicyEngine-US 2.152.16 (commit 794e17e6): it models no Form 8919 lines. `unreported_payroll_tax` ("Unreported payroll taxes from Form 4137 or 8919") is a bare input with no formula, so it cannot check lines 6 to 13. Its 2025 constants agree: social security wage base 176,100 (`payroll/social_security/cap.yaml`), employee rates 0.062 and 0.0145 (`payroll/social_security/rate/employee.yaml`, `payroll/medicare/rate/employee.yaml`). It adds the tax to total tax and to the Schedule 8812 Part II-B social security taxes; the engine does the same (Schedule 2 lines 6 and 7; Schedule 8812 line 22 reads Schedule 2 line 6). No disagreement.
- IRS Direct File (issue #140): no checkout in this worktree. Not compared.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN of the person) | stated rule (form header: a separate form for each spouse) |
| Lines 1–5, columns (a)–(c), (f) | stated rule (lines-1-through-5::b01, b02) |
| Lines 1–5, column (d) | stated rule (lines-1-through-5::b03) |
| Lines 1–5, column (e) | stated rule (face-page-1::b02) |
| Line 6 | stated rule; the rounding is own reading (item 1) |
| Lines 8–13 | stated rule (face-page-1::b03); RRTA unsupported by fact (item 2); the rounding is own reading (item 11) |
| 1040 line 1g, Schedule 2 line 6 | stated rule (irs-1040-inst-2025 line-1g::b01, line-6::b01) |
| Form 8959 line 3 and who files | stated rule (irs-8959-inst-2025 line-3::b01, who-must-file::b01) |
| Schedule SE line 8c | stated rule (catalog label); joint return is own reading (item 10) |
| Schedule CA (540) line 1g column A | stated rule (ftb-pub-737-2025::sec::line-1g::b01) |
