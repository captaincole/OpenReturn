import type { IMastraLogger } from "@mastra/core/logger";

/*
 * When an MCP client times out and closes its stream, Mastra's transport
 * later writes into it and Node throws an uncaught ERR_INVALID_STATE. That
 * must not kill Canon: the client already retries. Every other uncaught
 * exception still exits.
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
