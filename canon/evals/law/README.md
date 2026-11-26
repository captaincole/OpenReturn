# Law search eval

Checks that a search of the Internal Revenue Code (Title 26) finds the section that holds a rule.

A case in `cases.json` has a plain-words `question`, 1 to 3 `queries` that an agent writes after it read the IRS instructions (the statute's terms, never a section number), and `expect`: the sections where the rule is. A hit in any of them counts. `expectPath` names the exact subdivision when one holds the rule. `source` says where the case came from: a row of `docs/rule-decisions.md`, a topic of the target user's return, or a "hard direction" case whose question uses words far from the statute's.

Each label was checked against the statute text (the USLM XML of Title 26 from uscode.house.gov): the subdivision in `expectPath` was printed and read, and it states the rule the question asks about. No label is from memory.

**Status:** Not reviewed by a person yet: agents wrote and checked these cases. use the scores for development only.

## Run

From the repo root, with law.db installed (`npm run corpus -- law sync`) and Ollama running:

```bash
npm run evals:law
```

It runs every case in hybrid, fts and vector modes (no model call) and writes `docs/evals/law.md`.
