import { isForm1098TFactKey, type Form1098TFactValue } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { form1098TFact, type Form1098TInput } from "../../../../src/mastra/tools/ingest1098T.js";

/* What Cade reads off the printed form: the boxes, the names, and the slugs he picks. */
const printed = (
  form: Form1098TFactValue,
  institutionSlug: string,
  studentSlug: string,
): Form1098TInput => ({
  year: 2025,
  filer: { name: form.filerName, address: form.filerAddress, ein: form.filerEin },
  student: { name: form.studentName, tin: form.studentTin },
  institutionSlug,
  studentSlug,
  box1: form.box1,
  box4: form.box4,
  box5: form.box5,
  box6: form.box6,
  box7: form.box7,
  box8: form.box8,
  box9: form.box9,
  box10: form.box10,
});

const PERRIN_FORMS: [string, string, string][] = [
  ["rio-grande-valley-state", "perrin", "payer.rio-grande-valley-state.1098t.perrin"],
  ["sunland-park-cc", "perrin", "payer.sunland-park-cc.1098t.perrin"],
  ["franklin-mountains-business", "marisol", "payer.franklin-mountains-business.1098t.marisol"],
];

describe("form1098TFact", () => {
  it.each(PERRIN_FORMS)("records perrin's %s form as the scenario holds it", async (...row) => {
    const [institutionSlug, studentSlug, key] = row;
    const { facts } = await loadScenario("perrin");
    const expected = facts.find((fact) => fact.key === key);
    expect(expected?.category).toBe("education");
    const form = expected?.value as Form1098TFactValue;
    expect(form1098TFact(printed(form, institutionSlug, studentSlug))).toEqual({
      key,
      value: form,
    });
  });

  it("leaves an unchecked box and a blank box out of the fact", () => {
    const { value } = form1098TFact({
      year: 2025,
      filer: {
        name: "Example College",
        address: { line1: "1 Main St", city: "Austin", state: "TX", zip: "78701" },
        ein: "00-0000001",
      },
      student: { name: "Ana Example" },
      box1: 900,
      box8: false,
    });
    expect(Object.keys(value)).not.toContain("box8");
    expect(Object.keys(value)).not.toContain("box5");
  });

  it("keys the form by the slugified institution and the student's first name by default", () => {
    const { key } = form1098TFact({
      year: 2025,
      filer: {
        name: "Example College",
        address: { line1: "1 Main St", city: "Austin", state: "TX", zip: "78701" },
        ein: "00-0000001",
      },
      student: { name: "Ana Example" },
    });
    expect(key).toBe("payer.example-college.1098t.ana");
    expect(isForm1098TFactKey(key)).toBe(true);
  });
});
