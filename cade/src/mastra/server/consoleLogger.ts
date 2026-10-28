/*
 * Not PinoLogger: its async-buffered output is truncated when a Vercel function exits,
 * which drops every log line on requests that error. The sync escape hatch needs a type lie.
 * One JSON line per entry via console.*, which `vercel logs --json` parses.
 */

import { LogLevel, MastraLogger } from "@mastra/core/logger";

/* Pino's numeric levels, so records keep the shape log filters expect. */
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
 * IMastraLogger types `(message, ...args)`, but Mastra's internals pass Pino's
 * `(message, metaObject)`. Spread that object flat; anything else stays in `args`.
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
    /* Cycles or non-serializable values: a stripped log beats no log. */
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
