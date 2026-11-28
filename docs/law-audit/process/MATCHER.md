# Matcher: does the engine follow the form's record?

Two records exist for one tax form (tax year 2025). `claims.json` says what the engine's code does, one claim each. `requirements.json` is the form's record from the official texts (form face, instructions, regulation, statute), written by a reader who never saw the code; a script checked every quote. You match them in both directions and write the candidate findings. A lead checks each finding after you, so be exact and give the evidence.

The goal is a list of findings. Nobody changes the engine now: do NOT edit any file outside your output folder.

## Rules

- Run every command from the worktree root. Never `cd` to another checkout. Write only inside your output folder.
- You may read the engine code (`engine/src/...`) to confirm what a claim says, to look for a guard, and to follow a value to another form. You may read a law or instruction passage again: `npm run corpus --silent -- law read "469(i)(3)"`, `npm run corpus --silent -- read <docId> <section>`, `npm run corpus --silent -- law search "<words>" --source statute|regulations|california`.
- Never settle a point from memory of tax law. A point no text in the library settles is class 3.

## Step 1: match

For every requirement, find the claim or claims that implement it. For every claim, find its requirement.

Requirement status:
- `met`: the code does what the texts require, on every part (each number, filing status, condition, order, edge).
- `guarded`: the code does not do it, and reports that openly: `unsupported(...)`, the form's `unsupported` list, or a missing input the form asks for. Not a finding.
- `mismatch`: the code does something else or less, with no guard. Check the code itself before you use this.
- `no code`: nothing in the code or its guards covers it. Decide: can a taxpayer the engine accepts reach this case? If yes, it is a finding. If the case needs an input the engine does not take at all (and so cannot silently be wrong), say `out of scope`.
- `printing only`: differs only in how the paper is printed (zeros, blanks, attachments), no dollars.
- `other record`: the rule belongs to another form's record (for example whole-dollar rounding is Form 1040's rule).

A claim with no requirement: say why (`other record`, engine plumbing, or a rule the engine made with no text: that is a finding, class 3).

## Step 2: candidate findings

Classes:
1. The texts agree with each other and the engine does something else or less, unguarded. Includes a `no code` requirement that a supported taxpayer can reach, and a stale comment that names a gap which no longer exists.
2. Two texts disagree (form face, instructions, a publication, regulation, statute: `layers: "disagree"`, or you see it) and the engine follows one. Say which, and what the other gives in dollars. Instructions of two forms that disagree count too.
3. A text is unclear, silent, in error (wrong cross-reference), or the library does not hold the passage (amounts adjusted each year by revenue procedure, statutory notes, 26 CFR parts other than 1 and 301, California Budget Act). Say what the engine does.
4. A possible loophole: the rule as written, or a stated answer that nothing checks, gives a result the rule's purpose seems not to intend.

Do NOT report: a guarded gap; two readings that give the same result; rounding or printing; a rule that works as written; a path that cannot run today; a statute base amount beside the year's inflation-adjusted amount when the instructions give the year's amount (note it once as class 3 "amount not checkable" only when the engine's number has no source in the library at all).

For each candidate, open the code at the claim's `codeRef` and confirm it. Quote texts word for word with block ids from the records.

## Output

`match.json`:
```json
{ "requirements": [{ "id": "8959-R07", "status": "met", "claimIds": ["8959-C03"], "note": "" }],
  "claimsWithNoRequirement": [{ "claimId": "8959-C31", "why": "other record: rounding is a Form 1040 rule" }] }
```

`findings.json`:
```json
[{
  "id": "8959-F1",
  "class": 1,
  "title": "Line 19 leaves out Form W-2 box 12 codes B and N",
  "line": "line 19",
  "texts": [{ "blockId": "…", "quote": "…" }],
  "engine": "Adds box 6 of each Form W-2 only.",
  "codeRef": "engine/src/federal/8959/bindings.ts:19",
  "effect": "A tipped employee with $300 in box 12 code B: line 24 is $300 too low, so the refund is $300 too low.",
  "reach": "Who meets this: common, rare, or only with an input the engine lacks.",
  "confidence": "high|medium|low",
  "requirementIds": ["8959-R41"],
  "claimIds": ["8959-C27"]
}]
```
`effect` has dollars for one example when dollars change; else say "no dollars".

Also list in `examples.json` each worked example of the instructions that the record holds, as `[{ "requirementId", "summary" }]` (they can become test cases). Empty array when none.

## Final message

Under 100 words: counts per requirement status, the count of findings per class, and each finding's id with its title.
