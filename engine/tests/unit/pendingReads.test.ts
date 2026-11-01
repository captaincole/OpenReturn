import { describe, expect, it } from "vitest";
import type { EngineContext } from "../../src/engine.js";
import { isPendingResult, pendingResult, trackPendingReads } from "../../src/pendingReads.js";
import { blocked, type DerivationResult } from "../../src/types.js";

const filed = { ok: true, value: true } as DerivationResult<boolean>;
const notFiled = { ok: true, value: false } as DerivationResult<boolean>;

function ctx(opts: {
  fields?: Record<string, DerivationResult<unknown>>;
  mustFiles?: Record<string, DerivationResult<boolean>>;
  settling?: boolean;
}): EngineContext {
  return {
    fieldResult: (id: string) => opts.fields?.[id],
    formMustFile: (id: string) => opts.mustFiles?.[id],
    settling: opts.settling,
  } as unknown as EngineContext;
}

function readWaits(engineCtx: EngineContext, fieldId: string): boolean {
  const reads = trackPendingReads(engineCtx, "form-8960");
  reads.ctx.fieldResult(fieldId);
  return reads.hadPendingRead();
}

describe("trackPendingReads", () => {
  it("waits on a form that has not been evaluated yet", () => {
    expect(readWaits(ctx({}), "form-1040.line.2b")).toBe(true);
  });

  it("waits on a filed form whose field is still missing", () => {
    expect(readWaits(ctx({ mustFiles: { "form-1040": filed } }), "form-1040.line.2b")).toBe(true);
  });

  it("does not wait on a form that is not filed", () => {
    expect(readWaits(ctx({ mustFiles: { "form-1040": notFiled } }), "form-1040.line.2b")).toBe(
      false,
    );
  });

  it("does not wait on a form whose must-file can never resolve", () => {
    const never = blocked("No must-file binding registered for schedule-1");
    expect(readWaits(ctx({ mustFiles: { "schedule-1": never } }), "schedule-1.0.line.3")).toBe(
      false,
    );
  });

  it("does not wait on a missing field of the same form", () => {
    expect(readWaits(ctx({}), "form-8960.0.line.9a")).toBe(false);
  });

  it("waits on a field that is itself waiting", () => {
    const fields = { "form-8960.0.line.1": pendingResult("form-8960.0.line.1") };
    expect(readWaits(ctx({ fields }), "form-8960.0.line.1")).toBe(true);
  });

  it("stops waiting in the settle pass", () => {
    expect(readWaits(ctx({ settling: true }), "form-1040.line.2b")).toBe(false);
  });

  it("marks only pendingResult() values as pending", () => {
    expect(isPendingResult(pendingResult("x"))).toBe(true);
    expect(isPendingResult(blocked("x"))).toBe(false);
  });
});
