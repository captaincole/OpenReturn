import { fetchLawStatus } from "@/lib/canonServer";
import { formatPublished } from "@/lib/format";
import type { LawStatus } from "@/lib/law";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { LibraryTabs } from "../components/LibraryTabs";
import { GoToSection } from "./components/GoToSection";
import { LawNotInstalled } from "./components/LawNotInstalled";

/* Only the status loads here: no section text until a person opens one. */

function Release({ status }: { status: Extract<LawStatus, { installed: true }> }) {
  return (
    <div className="card p-5">
      <div className="text-[14px] font-medium text-ink-primary">{status.title}</div>
      <div className="mt-0.5 text-[12px] text-ink-muted">
        {status.published ? `Published ${formatPublished(status.published)} · ` : ""}
        {status.sections.toLocaleString()} sections
      </div>
    </div>
  );
}

export default async function LawPage() {
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);
  const result = await fetchLawStatus();

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-4xl space-y-10">
          <header>
            <h1 className="font-serif text-4xl text-ink-primary">Reference Library</h1>
            <p className="mt-2.5 max-w-2xl text-[15px] text-ink-secondary">
              The tax statute, the Internal Revenue Code, is a separate library. Canon reads it only
              when the instructions do not settle a question.
            </p>
          </header>
          <LibraryTabs active="law" />
          {result.kind === "ok" && !result.data.installed && <LawNotInstalled />}
          {result.kind === "ok" && result.data.installed && (
            <div className="space-y-6">
              <Release status={result.data} />
              <GoToSection />
            </div>
          )}
          {result.kind === "error" && <p className="text-[14px] text-danger">{result.message}</p>}
          {/* A Canon older than its statute routes answers 404. */}
          {result.kind === "not_found" && (
            <p className="text-[14px] text-danger">Canon has no statute routes. Restart Canon.</p>
          )}
        </div>
      </main>
    </div>
  );
}
