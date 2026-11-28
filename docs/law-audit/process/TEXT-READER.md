# Text reader: the record of one form, from the official texts only

You write the record of one tax form (tax year 2025) in the law's own terms: every requirement that the form and its instructions state, and for each one what the regulation and the statute say. You never see the software that fills the form: do NOT read anything under `engine/`, and do NOT read other folders under `.scratch/law-audit/`. Another step compares your record with the software.

## Rules

- Run every command from the worktree root. Never `cd` to another checkout. Write only inside your output folder.
- Use only text you read in this run. Never fill a gap from memory. When no text speaks, say so.
- Every quote is word for word, one unbroken span from one block, at most 300 characters, copied from the command output. A script checks each quote against the stored block.

## The commands

```bash
npm run corpus --silent -- outline <docId>              # the sections of the instructions or the form face
npm run corpus --silent -- read <docId> <section>       # a whole section with block ids
npm run corpus --silent -- read <docId> <first-section> --through <last-section>
npm run corpus --silent -- law read "3101(b)(2)"        # Internal Revenue Code
npm run corpus --silent -- law read "1.1401-1(d)"       # Treasury regulations (the library holds 26 CFR Parts 1 and 301 only)
npm run corpus --silent -- law read "CA 17052(a)"       # California Revenue and Taxation Code
npm run corpus --silent -- law search "<words>" --source statute|regulations|california
```

Read a section once and use it for every requirement it covers.

## Step 1: read the whole form face and the whole instructions

Go through them in order, from the first section to the last. Do not skip the general sections (who must file, definitions, examples, special cases): they hold requirements that no line states.

## Step 2: write one requirement for each single thing the texts require

A requirement is one thing a preparer must do or decide: which amount goes on a line and from where, whose amounts count, a rate, a dollar amount, a threshold for each filing status, a floor, a choice between amounts, a condition, an order, a special case, an example's result, who must file. Split a compound instruction: a line with a threshold, a rate and a floor is three requirements. Plain arithmetic that the face prints ("add lines 1 through 3") is one short requirement.

## Step 3: for each requirement that rests on law, read the law

Read the statute passage, then the regulation under it. Record what each says on this exact point. A requirement that is only about how to fill the paper (where to copy a number, attachments) has no law: say `layers: "form only"`.

## Output: `requirements.json`

```json
[{
  "id": "8959-R07",
  "line": "line 5",
  "topic": "additional medicare tax: threshold by filing status",
  "requirement": "Enter $250,000 on a joint return, $125,000 for married filing separately, $200,000 for single, head of household or qualifying surviving spouse.",
  "sources": [
    { "kind": "form_face", "blockId": "…", "quote": "…", "says": "the three amounts" },
    { "kind": "instructions", "blockId": "…", "quote": "…", "says": "same, as a chart" }
  ],
  "law": [
    { "kind": "statute", "blockId": "usc-26-2025::sec::s3101::b", "quote": "…", "says": "same amounts; separate return is half of joint" }
  ],
  "layers": "agree",
  "note": ""
}]
```

- `id`: `<form>-R<two digits>`, in the order of the form.
- `line`: the form line, or `form` for a requirement of the whole form.
- `topic`: a short label in the form "<subject>: <point>", lower case, so that the same point on another form gets the same label.
- `sources`: the form face and the instructions (and a publication when the instructions send the reader there). `kind` is `form_face`, `instructions` or `publication`.
- `law`: `kind` is `statute`, `regulation` or `ca_statute`. Empty for `form only`.
- `says`: that one text's own answer on the point, in a few words.
- `layers`: `agree` (every text that speaks says the same), `disagree` (two texts give different answers: name them in `note`, with dollars for one example), `unclear` (a text can be read two ways: give both readings in `note`), `form only` (no law speaks; say in `note` when a law should speak and the library does not hold it), `law missing` (the instructions state a rule of law and you found no passage for it after a `law read` of the named section or a `law search`; never use it for a passage you did not look for).
- A text with an error in it (a wrong cross-reference, a pointer to a section that does not hold the rule, an example that does not follow the rule) is never `agree`: use `unclear` and name the error in `note`.
- `note`: also an error in a text (a wrong cross-reference, an example that does not follow the rule), an amount that the statute adjusts each year, a regulation older than the statute, a missing effective date. Empty when there is nothing to say.

## Final message

Under 80 words: the count of requirements, the count per `layers` value, and the ids that are not `agree` or `form only`.
