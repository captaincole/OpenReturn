import type { ProcessInputArgs, Processor } from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";
import type { CadeRequestContext } from "../server/requestContext";
import { closeOpenQuickReplies } from "../tools/quickReplies";
import { requireUserContext } from "../tools/userContext";

/*
 * The taxpayer's message answers the quick replies Cade offered, by a tap or
 * in typed words: resolve the open ones before the turn starts. processInput
 * runs once per request, so the replies Cade offers in this turn stay open.
 */
export class QuickReplyResolver implements Processor {
  readonly id = "quick-reply-resolver";
  readonly description = "Resolves the open quick replies when the taxpayer's next message arrives";

  async processInput({ messages, requestContext }: ProcessInputArgs) {
    const user = await requireUserContext({
      requestContext: requestContext as RequestContext<CadeRequestContext> | undefined,
    });
    await closeOpenQuickReplies(user, "resolved");
    return messages;
  }
}
