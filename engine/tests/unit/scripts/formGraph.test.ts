import { describe, expect, it } from "vitest";
import { buildFormGraph, type GraphInput } from "../../../scripts/formGraph/graph.js";
import { renderFormGraph } from "../../../scripts/formGraph/render.js";

const field = (fieldId: string, kind: "binding" | "unsupported" | undefined = "binding") => ({
  fieldId,
  label: `Label of ${fieldId}`,
  kind,
});

const ran = (fieldId: string, reads: string[] = [], hasValue = true) => ({
  fieldId,
  hasValue,
  reads,
});

/* form-a line 3 reads line 2, which reads line 1 and schedule-b line 9 (unsupported). */
const INPUT: GraphInput = {
  forms: [
    {
      formId: "form-a",
      displayName: "Form A",
      jurisdiction: "Federal 2025",
      fields: [field("form-a.line.1"), field("form-a.line.2"), field("form-a.line.3")],
    },
    {
      formId: "schedule-b",
      displayName: "Schedule B",
      jurisdiction: "Federal 2025",
      fields: [
        field("schedule-b.line.8"),
        field("schedule-b.line.9", "unsupported"),
        { ...field("schedule-b.line.10"), kind: undefined },
      ],
    },
  ],
  runs: [
    {
      name: "keyed",
      hasAnswerKey: true,
      formIds: ["form-a"],
      fields: [
        ran("form-a.line.1"),
        ran("form-a.line.2", ["form-a.line.1", "schedule-b.line.9"]),
        ran("form-a.line.3", ["form-a.line.2"], false),
      ],
    },
    {
      name: "locked",
      hasAnswerKey: false,
      formIds: ["form-a", "schedule-b"],
      fields: [
        ran("form-a.line.3", ["form-a.line.2"]),
        {
          fieldId: "schedule-b.line.9",
          hasValue: false,
          reads: [],
          unsupportedReason: "No scenario has it yet.",
        },
      ],
    },
  ],
  codeReads: [{ readerFormId: "form-a", fieldId: "schedule-b.line.8" }],
};

describe("buildFormGraph", () => {
  const graph = buildFormGraph(INPUT);
  const fieldOf = (fieldId: string) => graph.fields.find((node) => node.fieldId === fieldId);

  it("gives each field one state", () => {
    expect(fieldOf("form-a.line.1")?.state).toBe("verified");
    expect(fieldOf("form-a.line.3")?.state).toBe("locked");
    expect(fieldOf("schedule-b.line.8")?.state).toBe("not_run");
    expect(fieldOf("schedule-b.line.9")).toMatchObject({
      state: "unsupported",
      reason: "No scenario has it yet.",
    });
    expect(fieldOf("schedule-b.line.10")?.state).toBe("unsupported");
    expect(graph.forms[0].states).toEqual({ verified: 2, locked: 1, not_run: 0, unsupported: 0 });
  });

  it("counts the fields that a field feeds, through other fields", () => {
    expect(fieldOf("form-a.line.1")?.feeds).toBe(2);
    expect(fieldOf("schedule-b.line.9")?.feeds).toBe(2);
    expect(fieldOf("form-a.line.3")?.feeds).toBe(0);
  });

  it("makes one edge for each pair of forms, from the runs and the code", () => {
    expect(graph.edges).toEqual([
      {
        reader: "form-a",
        source: "schedule-b",
        fields: [
          { fieldId: "schedule-b.line.8", readBy: [], inCode: true },
          { fieldId: "schedule-b.line.9", readBy: ["form-a.line.2"], inCode: false },
        ],
      },
    ]);
    expect(graph.forms[0].reads).toEqual(["schedule-b"]);
    expect(graph.forms[1].feeds).toEqual(["form-a"]);
    expect(fieldOf("schedule-b.line.8")?.feedsForms).toEqual(["form-a"]);
  });

  it("names the scenarios that file each form", () => {
    expect(graph.forms[0].scenarios).toEqual(["keyed", "locked"]);
    expect(graph.forms[1].scenarios).toEqual(["locked"]);
  });

  it("finds a loop inside one run, and none across two runs", () => {
    expect(graph.loops).toEqual([]);
    const loopRun = {
      name: "loop",
      hasAnswerKey: true,
      formIds: ["form-a"],
      fields: [ran("form-a.line.1", ["form-a.line.2"]), ran("form-a.line.2", ["form-a.line.1"])],
    };
    expect(buildFormGraph({ ...INPUT, runs: [loopRun] }).loops).toEqual([
      ["form-a.line.1", "form-a.line.2"],
    ]);
    const half = (reader: string, read: string) => ({
      ...loopRun,
      name: reader,
      fields: [ran(reader, [read])],
    });
    const twoRuns = [
      half("form-a.line.1", "form-a.line.2"),
      half("form-a.line.2", "form-a.line.1"),
    ];
    expect(buildFormGraph({ ...INPUT, runs: twoRuns }).loops).toEqual([]);
  });
});

describe("renderFormGraph", () => {
  it("lists a form's open fields that other fields read, most fed first", () => {
    const text = renderFormGraph(buildFormGraph(INPUT));
    expect(text).toContain("| Schedule B | Federal 2025 | 1 | 3 | 0 | 0 | 1 | 2 | 0 | 1 |");
    expect(text).toContain("| `line.9` | Label of schedule-b.line.9 | unsupported | 2 | Form A |");
    expect(text).toContain("- Reads: Schedule B");
  });
});
