import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { RefDocView } from "./components/RefDocView";

export default async function RefDocPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-12">
        <RefDocView key={docId} docId={decodeURIComponent(docId)} />
      </main>
    </div>
  );
}
