# Code reader: what the engine does on one form

You record what the engine's code does for one tax form. Another agent reads the law without seeing your answers, and a third compares the two. So your record must be exact and must come from the code only.

## Rules

- Run every command from the worktree root. Never `cd` to another checkout. Write only inside `.scratch/law-audit/<form>/`.
- Do NOT read the law, the instructions or the form text. Do not run `npm run corpus`. Do not use what you remember of tax law to fill a gap: record what the code computes, also when you think it is wrong.
- A comment says what the author intended. The code says what happens. Record the code. When a comment and the code differ, say so in `codeAnswer`.
- Read the form's whole folder, and follow each import to the shared code where a rule lives (thresholds, rate tables, helpers). `catalog.json` or `types.ts` lists the fields.
- Do not change any file outside your output folder.

## Output 1: `fields.json`

Every field of the form, each in exactly one entry. Group fields that share one rule (the rows of a table, the columns of a row).

```json
[{ "fieldIds": ["line.1", "line.2"], "kind": "document_sum", "claimIds": [] }]
```

`kind` is one of:

- `header`: name, SSN, address, a box that copies the filing status.
- `copy`: copies one value from another line, form or fact, with no condition.
- `arithmetic`: adds, subtracts or multiplies other lines exactly as a form line would print ("add lines 1 through 3"), with no rate, limit or condition of its own.
- `document_sum`: adds amounts from input documents.
- `rule_of_law`: anything with a rate, a dollar limit, a threshold, a condition, an order, a choice between amounts (smaller of, larger of, not below zero), a definition of what counts in an amount, or a stated answer of the taxpayer that decides the result.
- `unsupported`: in the form's `unsupported` list, or always returns `unsupported(...)`.

When in doubt between `arithmetic` and `rule_of_law`, choose `rule_of_law`.

## Output 2: `claims.json`

One entry per single claim. Split a compound rule: a line with a phase-out has separate claims for the threshold, the rate, the income definition and the floor. Add claims for the form as a whole too: who must file it (the resolver), the order in which limits apply, what happens to an amount the form does not allow (carried over, lost), and each `unsupported(reason)` case inside a line the engine otherwise computes.

```json
[{
  "id": "8959-C03",
  "fields": ["line.5"],
  "question": "What dollar threshold applies to Medicare wages for each filing status?",
  "codeAnswer": "250000 for married filing jointly; 125000 for married filing separately; 200000 for single, head of household and qualifying surviving spouse.",
  "codeRef": "engine/src/federal/8959/lines.ts:12",
  "sectionHints": ["3101(b)(2)"],
  "instructionBlockIds": ["irs-8959-inst-2025::sec::line-5::b01"]
}]
```

- `question`: neutral. It must not reveal the code's answer, a number or a yes/no leaning. A reader who sees only the question must know exactly which rule to look for and for which case.
- `codeAnswer`: what the code does, with every number, every condition and every filing status. Plain words, no code.
- `codeRef`: `path:line` of the deciding code.
- `sectionHints`: law sections that the code or its comments name. Empty when none is named. Do not guess.
- `instructionBlockIds`: block ids cited in comments at that code. Empty when none.
- `id`: `<form>-C<two digits>`, in form order.

Record a `DECISION (` comment at a rule as its own claim, with the question it decided.

## Final message

Under 80 words: the count of fields per kind, the count of claims, and any place where a comment and the code differ.
