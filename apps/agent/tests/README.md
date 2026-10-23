# tests

Cade's tests: tools, db, and the case-state hand-off. The reference
corpus, retrieval and Ask pipeline are tested in
[`canon/tests/`](../../../canon/tests/); the form engine's tests (unit,
integration, golden, and the scenarios) are in
[`packages/engine/tests/`](../../../packages/engine/tests/README.md).

| Folder | Kind | Command (repo root) |
| --- | --- | --- |
| `unit/` | One module, its own small inputs. The same folders as `src/` and `scripts/`. | `npm run test:unit` |
| `integration/` | Agent code over engine output. | `npm run test:integration` |

No test file goes under `src/` or `scripts/`; `unit/layout.test.ts` fails
on one. Scenario data comes from `@openreturn/engine/scenarios`; do not copy it
here.
