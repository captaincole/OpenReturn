/*
 * Reference library — every document tax-code Q&A searches, grouped by
 * publisher, each with a link to its source PDF. The parent
 * (app)/layout.tsx gates auth; the list loads on the client from the
 * agent's corpus (components/LibraryList.tsx).
 */

import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../HomeTopBar";
import { LibraryList } from "./components/LibraryList";

export default async function LibraryPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-4xl space-y-10">
          <header>
            <h1 className="font-serif text-4xl text-ink-primary">Reference Library</h1>
            <p className="mt-2.5 max-w-2xl text-[15px] text-ink-secondary">
              Answers to tax-code questions cite only these documents. A question that needs a
              document we do not have yet gets a partial answer, or none.
            </p>
          </header>
          <LibraryList />
        </div>
      </main>
    </div>
  );
}
