# Private comparison kit

Checks the OpenReturn engine against a tax return you already filed. The full
guide is [docs/testing-with-your-return.md](../../../docs/testing-with-your-return.md).

| File | Role |
| --- | --- |
| `cli.ts` | `--init`, `--check`, compare, `--show-values` |
| `compare.ts` | line-by-line comparison and drift buckets |
| `rootCauses.ts` | groups differences by root cause (uses each field's `reads`) |
| `support.ts` | support check: unknown inputs, out-of-scope answers, forms not modeled |
| `inputShape.ts` | document counts for the report (no names, no keys) |
| `report.ts` | the `.md` and `.json` report |
| `templates.ts` | `--init`: copies the jordan scenario and `AI_PROMPT.md` |
| `AI_PROMPT.md` | instructions for an AI session that fills in the files |
