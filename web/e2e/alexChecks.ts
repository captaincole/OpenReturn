import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { alexExpected } from "../../engine/tests/scenarios/alex/expected";
import { alex540Expected } from "../../engine/tests/scenarios/alex/expected-540";
import { alexFacts } from "../../engine/tests/scenarios/alex/facts";
import { latestDecisions, latestW2 } from "./appDb";
import { DATA_ENV } from "./run";

const REQUIRED_DECISIONS: Record<string, unknown> = {
  "decisions.scope.filing_status": "single",
  "decisions.scope.must_file_federal": true,
  "decisions.scope.must_file_ca_540": true,
};

const W2_BOXES = [
  "box1",
  "box2",
  "box3",
  "box4",
  "box5",
  "box6",
  "box12",
  "box13",
  "box14",
  "box15",
  "box16",
  "box17",
] as const;

function normalizeBox(box: string, value: unknown): string {
  if (value === undefined || value === null) return "(missing)";
  if (box === "box13") {
    const flags = Object.entries(value as Record<string, unknown>).filter(([, v]) => v === true);
    return (
      flags
        .map(([k]) => k)
        .sort()
        .join(",") || "(none)"
    );
  }
  if (box === "box12" || box === "box14") {
    const rows = (value as Array<Record<string, unknown>>).map(
      (r) =>
        `${String(r.code ?? r.label)
          .replace(/\s+/g, "")
          .toUpperCase()} ${r.amount}`,
    );
    return rows.sort().join(", ") || "(none)";
  }
  return JSON.stringify(value);
}

export function w2Problems(): string[] {
  const stored = latestW2();
  if (!stored) return ["no W-2 fact stored"];
  const want = alexFacts.find((f) => f.category === "wages")!.value as Record<string, unknown>;
  return W2_BOXES.flatMap((box) => {
    const [w, g] = [normalizeBox(box, want[box]), normalizeBox(box, stored[box])];
    return w === g ? [] : [`${box}: want ${w}, got ${g}`];
  });
}

export function decisionProblems(): string[] {
  const got = latestDecisions();
  return Object.entries(REQUIRED_DECISIONS)
    .filter(([key, want]) => got.get(key) !== want)
    .map(
      ([key, want]) => `${key}: want ${JSON.stringify(want)}, got ${JSON.stringify(got.get(key))}`,
    );
}

export function fieldProblems(): string[] {
  const sidecar = latestSidecar();
  if (!sidecar) return ["no forms sidecar"];
  const values = new Map(
    Object.values(sidecar.forms).flatMap((form) =>
      form.fields.map((f) => [f.fieldId, f.result.ok ? f.result.value : undefined] as const),
    ),
  );
  const expected = { ...alexExpected.engineFields, ...alex540Expected.engineFields };
  return Object.entries(expected)
    .filter(([fieldId, want]) => values.get(fieldId) !== want)
    .map(([fieldId, want]) => `${fieldId}: want ${want}, got ${String(values.get(fieldId))}`);
}

/* ULID names sort by time, so oldest first. */
export function findFiles(category: string, name: RegExp): string[] {
  const root = DATA_ENV.DOCUMENTS_PATH;
  const files = readdirSync(root, { recursive: true }) as string[];
  return files
    .filter((f) => f.split("/").at(-2) === category && name.test(f.split("/").pop()!))
    .sort()
    .map((f) => resolve(root, f));
}

interface Sidecar {
  forms: Record<
    string,
    { fields: Array<{ fieldId: string; result: { ok: boolean; value?: unknown } }> }
  >;
}

export function latestSidecar(): Sidecar | undefined {
  const file = findFiles("drafts", /^forms-2025-.*\.json$/).at(-1);
  return file ? (JSON.parse(readFileSync(file, "utf8")) as Sidecar) : undefined;
}
