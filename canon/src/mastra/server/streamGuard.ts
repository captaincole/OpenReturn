import type { IMastraLogger } from "@mastra/core/logger";

/*
 * A long tool call (ground on a local model) can outlive its client: the
 * MCP client gives up at its timeout and closes the streamable-HTTP
 * response. When Canon then finishes and writes the result, Mastra's
 * transport enqueues into a closed stream and Node raises
 * ERR_INVALID_STATE as an uncaught exception, which kills the process:
 * one slow review would take Canon down for everyone. The client already
 * treats its timeout as "unreached" and retries, so the right response
 * here is a warning, not an exit. Every other uncaught exception still
 * ends the process, as Node does by default.
 */
export function keepServingAfterClientLeft(logger: IMastraLogger): void {
  process.on("uncaughtException", (err) => {
    if ((err as { code?: string }).code === "ERR_INVALID_STATE") {
      logger.warn("a client closed its stream before the response was ready; still serving", {
        err: err.message,
      });
      return;
    }
    logger.error("uncaught exception", { err });
    process.exit(1);
  });
}
