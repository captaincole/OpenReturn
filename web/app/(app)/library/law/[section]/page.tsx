import { fetchLawSection } from "@/lib/canonServer";
import { blockAnchor } from "@/lib/law";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { HomeTopBar } from "../../../HomeTopBar";
import { LawNotInstalled } from "../components/LawNotInstalled";
import { LawAnchor } from "./components/LawAnchor";
import { LawBlocks } from "./components/LawBlocks";
import { LawSectionHeader } from "./components/LawSectionHeader";

/*
 * One whole section of the Code, of the regulations ("1.469-5T") or of
 * California's code ("CA-17041"), fetched on the server when the page opens. The text arrives with the
 * HTML, so the browser jumps to #g-1 by itself;
 * LawAnchor handles a deep link to a subdivision with no block of its own.
 */

function decodedSection(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function SectionBody({ section }: { section: string }) {
  const result = await fetchLawSection(section);
  if (result.kind === "not_found") notFound();
  if (result.kind === "error") return <p className="text-[14px] text-danger">{result.message}</p>;
  if (!result.data.installed) return <LawNotInstalled />;
  const page = result.data;
  return (
    <>
      <LawSectionHeader page={page} />
      <LawBlocks blocks={page.blocks} versions={page.versions} />
      <LawAnchor ids={page.blocks.map((block) => blockAnchor(block.blockId))} />
    </>
  );
}

export default async function LawSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <SectionBody section={decodedSection(section)} />
        </div>
      </main>
    </div>
  );
}
