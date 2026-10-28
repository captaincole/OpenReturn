import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { AskThreadView } from "./components/AskThreadView";

export default async function AskThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Ask Canon - Your Tax Code Expert" />
      {/* No bottom padding: the sticky composer sits flush with the viewport bottom. */}
      <main className="flex flex-1 flex-col px-6 pt-10 lg:px-10 lg:pt-14">
        {/* key: a new thread remounts the view, so no state leaks across threads. */}
        <AskThreadView key={threadId} threadId={threadId} />
      </main>
    </div>
  );
}
