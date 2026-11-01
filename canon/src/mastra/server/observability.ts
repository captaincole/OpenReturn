import { type AnyExportedSpan, type CustomSpanFormatter } from "@mastra/core/observability";
import { ConsoleExporter, MastraStorageExporter, Observability } from "@mastra/observability";

/*
 * ConsoleExporter dumps every full span, which floods the dev terminal.
 * An allowlist (not a blocklist) also drops keys a future Mastra version
 * adds. MastraStorageExporter still stores the full trace for Studio.
 */
const ALLOW_KEYS = new Set([
  "id",
  "type",
  "name",
  "startTime",
  "endTime",
  "traceId",
  "parentSpanId",
  "isRootSpan",
  "errorInfo",
  "message",
  "stack",
  "details",
  "domain",
  "category",
  "input",
  "output",
  "messages",
  "role",
  "content",
  "text",
  "warnings",
  "reasoning",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function filter(value: unknown): unknown {
  if (Array.isArray(value)) {
    // System messages carry the multi-KB system prompt.
    return value
      .filter(
        (item) =>
          !(item && typeof item === "object" && (item as { role?: unknown }).role === "system"),
      )
      .map(filter);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, fieldValue] of Object.entries(value)) {
      if (!ALLOW_KEYS.has(key)) continue;
      out[key] = filter(fieldValue);
    }
    return out;
  }
  return value;
}

const formatSpan: CustomSpanFormatter = (span) => {
  return filter(span) as AnyExportedSpan;
};

export function createObservability(): Observability {
  const isDev = process.env.MASTRA_DEV === "true";
  return new Observability({
    configs: {
      default: {
        serviceName: "openreturn",
        exporters: isDev
          ? [new ConsoleExporter({ customSpanFormatter: formatSpan }), new MastraStorageExporter()]
          : [new MastraStorageExporter()],
      },
    },
  });
}
