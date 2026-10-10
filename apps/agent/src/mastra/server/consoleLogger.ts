/*
 * Why we do not use @mastra/loggers PinoLogger:
 *   - Pino's default destination is async-buffered. On Vercel serverless
 *     the function freezes the moment a response is sent. That truncates
 *     the buffer and drops every log line on requests that error, which
 *     made production errors invisible (e.g. the 8949 catalog ENOENT
 *     that prompted this rewrite — see CLAUDE.md "Vercel logs
 *     (production debugging)" + project memory).
 *   - PinoLogger's `overrideDefaultTransports` + `pino.destination({ sync })`
 *     escape hatch works at runtime, but it requires a cast of a
 *     SonicBoom Writable to a Transform-typed LoggerTransport. That type
 *     lie says PinoLogger is the wrong tool when Pino's async behavior
 *     is unwanted — so we do not use it.
 *
 * This is the smallest logger that satisfies Mastra's contract: extend
 * MastraLogger, implement the four abstract methods. Output is one line
 * of JSON per log entry via `console.{log,warn,error}`, which Vercel
 * captures reliably (CLAUDE.md flags this as the only logging path that
 * survives serverless function exit). `vercel logs --json` parses each
 * line into its structured fields automatically.
 */

import { LogLevel, MastraLogger } from "@mastra/core/logger";

/*
 * Pino's numeric level convention. Kept so JSON log records look the
 * same as the Pino output `vercel logs --json` already parses. Log
 * filters and downstream consumers can rely on the same
 * `level: 50 = error` mapping.
 */
const LEVEL_NUM: Record<LogLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 100,
};

type LogMethod = Exclude<LogLevel, "silent">;

export class ConsoleLogger extends MastraLogger {
  debug(message: string, ...args: unknown[]): void {
    this.write("debug", message, args);
  }
  info(message: string, ...args: unknown[]): void {
    this.write("info", message, args);
  }
  warn(message: string, ...args: unknown[]): void {
    this.write("warn", message, args);
  }
  error(message: string, ...args: unknown[]): void {
    this.write("error", message, args);
  }

  private write(level: LogMethod, message: string, args: unknown[]): void {
    if (LEVEL_NUM[level] < LEVEL_NUM[this.level]) return;
    const record = {
      time: Date.now(),
      level: LEVEL_NUM[level],
      name: this.name,
      msg: message,
      ...extractMeta(args),
    };
    const line = stringify(record);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else if (level === "debug") console.debug(line);
    else console.log(line);
  }
}

/*
 * IMastraLogger types each method as `(message, ...args)`, but Mastra's
 * internals follow Pino's `(message, metaObject)` convention: the second
 * argument is the structured payload. Spread it inline so log records
 * look flat (`{...msg, foo: "bar"}`) rather than nested under an `args`
 * key. Anything that does not fit that convention falls back to an
 * `args` array, so no caller-provided data is silently dropped.
 */
function extractMeta(args: unknown[]): Record<string, unknown> {
  if (args.length === 0) return {};
  const first = args[0];
  const firstIsPlainObject =
    first !== null &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    !(first instanceof Error);
  if (firstIsPlainObject && args.length === 1) {
    return first as Record<string, unknown>;
  }
  return { args };
}

function stringify(record: Record<string, unknown>): string {
  try {
    return JSON.stringify(record, errorReplacer);
  } catch {
    /*
     * Cycles or non-serializable values fall through to a minimal
     * record so the line still lands. A stripped log beats no log.
     */
    return JSON.stringify({
      time: record.time,
      level: record.level,
      name: record.name,
      msg: typeof record.msg === "string" ? record.msg : String(record.msg),
      _stringifyError: true,
    });
  }
}

function errorReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause !== undefined ? { cause: value.cause } : {}),
    };
  }
  return value;
}
