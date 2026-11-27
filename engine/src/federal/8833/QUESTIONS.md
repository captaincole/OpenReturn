# Form 8833: open questions

Form 8833 discloses a treaty-based return position. It has no arithmetic. The engine reads one answer fact per position (`facts/kinds/treatyPosition.ts`) and prints the answers; it never decides whether a treaty applies or what the position is worth. The instructions are `irs-8833-form-2025` (Rev. December 2022, the form and its instructions in one file). Pub. 901 is not in the corpus. The law library is not installed in this worktree.

## Two texts conflict

None. No item here has two official texts that change a printed value, so no `DECISION` comment was needed. Pub. 519's extra waivers (item 1) do not conflict with the form's instructions, which send the reader to Regulations section 301.6114-1(c) "for other waivers". California's add-back of a treaty exemption (item 10) is a state rule next to the federal one, not a conflict.

## Should we do this now

Every item below is a default or an own reading. Items 1 to 9 change no dollar amount; item 10 is done.

### 1. The waivers are a stated answer

- Text: "Generally, a taxpayer who takes a treaty-based return position must disclose that position, unless reporting is specifically waived" (`irs-8833-form-2025::sec::who-must-file::b01`). The waivers are in `who-must-file::b04` to `b06` and "Regulations section 301.6114-1(c) for other waivers".
- Pub. 519 adds waivers that the form's instructions do not list: "The payments or items of income that are otherwise required to be disclosed total no more than $10,000", and a residence claim with more than $100,000 of items that must be filed (`irs-pub-519-2025::sec::reporting-treaty-benefits::b02`, `b03`). Pub. 519 is the guide for aliens.
- Practice differs again: university volunteer tax sites attach Form 8833 for a resident alien student under a saving-clause exception (UConn VITA samples), although the instructions waive "income derived by ... students".
- Default: the fact holds `reportingWaived`, the taxpayer's or the preparer's answer. A waived position files no form. The engine applies no threshold.
- Dollars: no. Only whether the form is attached.

### 2. Whose name prints on a joint return

- Text: the header asks for "Name" and "U.S. taxpayer identifying number", one of each; "The identifying number of an individual is his or her social security number" (`specific-instructions::b01`).
- Default: the person who takes the position, the taxpayer unless the fact says the spouse. A spouse's position counts on a joint return only. Forms 8919 and 4137 print one person in the same way.
- Dollars: no.

### 3. The address in the country of residence of a U.S. resident

- Text: "Enter the information in the following order: city, province or state, and country ... Please do not abbreviate the country name" (`address-in-country-of-residence::b01`). No text speaks to a filer who resides in the United States.
- Default: a Form 1040 filer with a home in a U.S. state resides in the United States. Both address boxes print the home address; the first adds "United States". Form 1116 line h reads the home address the same way (its QUESTIONS.md).
- The engine holds no foreign home address (Form 1040's foreign address lines are unsupported), so a U.S. citizen who lives abroad cannot be printed yet.
- Dollars: no.

### 4. The dual-resident box is a gap

- Text: a dual-resident taxpayer who claims treaty benefits as a resident of the other country "must file Form 1040-NR ... with Form 8833 attached" (`form-8833-rev-12-2022-page-4::b02`, `b03`).
- Default: a position that states the dual-resident box makes that box unsupported. The engine prepares Form 1040 only. The rest of the copy prints.
- Dollars: yes, in the real return (Form 1040-NR taxes differently). The engine does not compute it.

### 5. The U.S. citizen or resident box

- Text: "Check this box if the taxpayer is a U.S. citizen or resident" (`face-page-1::b02`). The Form 1040 instructions send most nonresident aliens to Form 1040-NR (`irs-1040-inst-2025::sec::do-you-have-to-file::b03`).
- Default: checked on every copy, because the engine's return is Form 1040. A nonresident spouse who elects to be treated as a resident is a resident for this purpose.
- Dollars: no.

### 6. An explanation longer than the rows

- Text: "All taxpayers taking a treaty-based return position must provide the requested information on line 6" (`line-6::b01`). The form has 25 rows (`face-page-1::b03`). No text says what to do when the answer is longer.
- Default: `lines.ts` lays the words over the rows: 55 characters on row 1 (it starts after the printed text), 115 on rows 2 to 25, each from the widget's width at the form's 8-point font, with room for capitals. A word that does not fit starts the next row; a word longer than a row is cut. A line break in the text starts a new row; an empty paragraph takes none. Text that needs a 26th row makes every row of line 6 unsupported, with the number of rows it needs. The engine writes no continuation statement (the same rule as Form 8824, row 13 of `docs/rule-decisions.md`).
- Dollars: no.

### 7. Lines 3 and 4 are optional

- Text: line 3 is "if fixed or determinable annual or periodical" (`line-3::b01`); line 4 is "(if any)" (`line-4::b01`).
- Default: each prints the stated text, and is blank when none is stated. The engine does not test whether the income is FDAP income or whether the treaty has a limitation on benefits article, so neither line waits for an answer.
- Dollars: no.

### 8. The reference ID number

- Text: "If the taxpayer is a foreign corporation, enter any reference ID number" (`reference-id-number::b01`).
- Default: always blank. A Form 1040 filer is an individual.
- Dollars: no.

### 9. A return that is filed only for the disclosure

- Text: "If you would not otherwise be required to file a tax return, you must file one" (`when-and-where-to-file::b01`).
- Default: Form 1040's must-file stays the decision `decisions.scope.must_file_federal`. Cade answers it; a treaty position does not set it.
- Dollars: no.

### 10. California adds a treaty exemption back (done)

- Text: "If a tax treaty exemption is claimed on federal Schedule 1 (Form 1040), Additional Income and Adjustments to Income, line 8z, enter that amount on Schedule CA (540), Part I or Schedule CA (540NR), Part II, line 8z, column C as a positive number, unless that amount is specifically exempted for California purposes" (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-12::b04`).
- Before the fix: this branch files Schedule 1 for a line 8z item below 0, so the exemption lowered federal AGI and then California AGI. Schedule CA line 8z column C stayed at its catch-all gap, and Form 540 line 16 read 0. A California resident with $31,400 of wages and a $5,000 exemption got Form 540 line 17 = $26,400.
- Now: `state/ca/schedule-ca/treatyExemption.ts` puts the exempt amount in line 8z column C, and line 9a column C adds the rows. The same return gives line 16 = $5,000, line 17 = $31,400 and line 19 = $25,694 (`tests/unit/state/ca/schedule-ca/treatyExemption.test.ts`).
- Own reading: a treaty exemption is a Schedule 1 line 8z item below 0. Pub. 519 enters exempt income there "in parentheses", and Cade's skill records line 8z items as "other taxable income", so the engine expects no other item below 0. A non-treaty item below 0 would be added back in California too. The fact holds no flag that names the item a treaty exemption.
- Not modeled: the exception for an amount "specifically exempted for California purposes". With another line 8z item next to the exemption, column C is a gap with its own reason. Schedule CA (540NR) has no rules yet, so a part-year or nonresident return does not add the exemption back.

## Pattern change

None. Before: a negative line 8z item did not file Schedule 1 on its own. After: it does; this applies the existing Schedule 1 rule to one more input, and no other form or fact kind changes shape.

## What a treaty position changes on Form 1040 today

Nothing, through this form. No binding reads a treaty position fact. The amount a position changes is recorded where it lands:

- An exempt amount reported on an information return: a Schedule 1 line 8z item below 0 (Pub. 519, `irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02`). Before this branch a negative item alone did not file Schedule 1; it does now (`schedule-1/resolveInfo.ts`). The PDF prints it as "-5,000", the engine's form for every amount below 0, not in parentheses. California adds it back on Schedule CA (540) line 8z column C (item 10).
- Exempt income not on any information return: left off the return (Pub. 519's example, `general-rule-for-resident-aliens::b03`).
- A reduced treaty rate on Form 1040 line 16 ("Tax from attached statement", `general-rule-for-resident-aliens::b02`): no fact kind; not supported.
- A foreign tax credit under a treaty: a stated foreign tax on Form 1116. Income re-sourced by treaty (the `treaty_resourced` category, Form 1116 box f and line 30) is a whole-form gap in Form 1116.

## Second opinions

- **Blind fill (2026-11-26).** A preparer filled 14 cases from the blank form and its instructions only. The engine and the blind fill agree on every key of every case: copies, header, lines 1a to 5, and the rows line 6 uses (including 25 rows that fit, 26 that do not, a 200-character word over 3 rows, and a line break). The only textual difference is case 9 row 1, where the blind fill describes the first 55 characters instead of quoting them. No case has a dollar amount.
- **PolicyEngine-US 2.154.1 (commit 0fbed6ddb1).** It does not model Form 8833, section 6114 or any treaty benefit: no variable or parameter under `gov/irs` names a treaty. Nothing to compare.
- **Other projects.** The repository names no other reference implementation for this form (no IRS Direct File checkout). Not compared.

## Proposals for a discussion

- **A treaty rate statement.** Before: a reduced treaty rate has no place in the engine. After: a statement fact with the treaty country, the article and the income, a computed tax at the treaty rate, and Form 1040 line 16 box 3. This is a new kind of attached statement, so a person decides it.

## Confidence

| Field group | Confidence |
| --- | --- |
| Who files (a position not waived; one copy each) | stated rule |
| Header name and number | stated rule (joint return: own reading, item 2) |
| Reference ID | stated rule |
| Address boxes | own reading (item 3) |
| First header box | stated rule |
| Dual-resident box | unsupported when stated (item 4) |
| U.S. citizen or resident box | own reading (item 5) |
| Lines 1a, 1b, 2, 3, 4 | stated rule |
| Line 5 boxes and subsections | stated rule |
| Line 6 rows | own reading of the layout (item 6); the UConn VITA sample fits |
| Line 6 longer than 25 rows | unsupported (item 6) |
