import { isConversationId } from "@/lib/chatSession";
import { getOwnerSession } from "@/lib/localAuth";
import { fetchOpenActions } from "@/lib/serverDb";
import { type NextRequest, NextResponse } from "next/server";

/* The open cards of one conversation: the return's page and the Deductions tab each ask for their own. */
export async function GET(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const yearRaw = Number(request.nextUrl.searchParams.get("year") ?? "");
  if (!Number.isInteger(yearRaw)) {
    return NextResponse.json({ error: "year is required" }, { status: 400 });
  }
  const conversation = request.nextUrl.searchParams.get("conversation");
  if (!isConversationId(conversation)) {
    return NextResponse.json({ error: "conversation is required" }, { status: 400 });
  }

  const actions = await fetchOpenActions(session.userId, yearRaw, conversation);
  return NextResponse.json(actions);
}
