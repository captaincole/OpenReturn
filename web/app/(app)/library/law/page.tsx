import { fetchLawStatus } from "@/lib/canonServer";
import { formatPublished } from "@/lib/format";
import type { LawStatusDocument } from "@/lib/law";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { LibraryTabs } from "../components/LibraryTabs";
import { GoToSection } from "./components/GoToSection";
import { LawNotInstalled } from "./components/LawNotInstalled";

/* Only the status loads here: no section text until a person opens one. */

const SOURCE_LABEL: Record<LawStatusDocument["source"], string> = {
  statute: "Statute",
  regulations: "Regulations",
};

function Release({ document }: { document: LawStatusDocument }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-medium tracking-wide text-ink-muted uppercase">
        {SOURCE_LABEL[document.source]}
      </div>
      <div className="mt-1 text-[14px] font-medium text-ink-primary">{document.title}</div>
      <div className="mt-0.5 text-[12px] text-ink-muted">
        {document.published ? `Published ${formatPublished(document.published)} · ` : ""}
        {document.sections.toLocaleString()} sections
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
              The law is a separate library: the statute, the Internal Revenue Code, and the
              Treasury regulations under it. Canon reads it only when the instructions do not settle
              a question.
            </p>
          </header>
          <LibraryTabs active="law" />
          {result.kind === "ok" && !result.data.installed && <LawNotInstalled />}
          {result.kind === "ok" && result.data.installed && (
            <div className="space-y-6">
              {result.data.documents.map((document) => (
                <Release key={document.docId} document={document} />
              ))}
              <GoToSection />
            </div>
          )}
          {result.kind === "error" && <p className="text-[14px] text-danger">{result.message}</p>}
          {/* A Canon older than its law routes answers 404. */}
          {result.kind === "not_found" && (
            <p className="text-[14px] text-danger">Canon has no law routes. Restart Canon.</p>
          )}
        </div>
      </main>
    </div>
  );
}
