import { noticeIsDue } from "@/lib/dataNotice";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AcceptNoticeButton } from "./AcceptNoticeButton";

/*
 * The first-visit notice of an instance behind Cloudflare Access: a guest
 * reads where their data goes before the app sends any of it. The app layout
 * sends a person here until they accept (lib/dataNotice.ts).
 */
export default async function NoticePage() {
  const session = await getUserSession();
  if (!session || !(await noticeIsDue(session.userId))) redirect("/");

  return (
    <div className="bg-grid relative flex min-h-screen items-center justify-center bg-bg-base px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 text-[11px] tracking-[0.28em] text-ink-muted uppercase">
            OpenReturn
          </div>
          <h1 className="mb-3 font-serif text-4xl text-ink-primary">Before you start</h1>
          <p className="text-sm text-ink-secondary">
            This is a private test. You are signed in as {session.email}.
          </p>
        </div>

        <ul className="mb-8 space-y-4 text-sm text-ink-secondary">
          <li>
            <span className="text-ink-primary">Your data goes to Anthropic.</span> To answer you,
            the app sends your messages and your documents to Anthropic, the company that makes the
            Claude AI models. That includes tax forms and Social Security numbers.
          </li>
          <li>
            <span className="text-ink-primary">
              Your data is stored on the host&apos;s computer.
            </span>{" "}
            The person who invited you runs this app and can read what you enter.
          </li>
          <li>
            <span className="text-ink-primary">This app does not file a return.</span> Check each
            number with a tax professional before you file.
          </li>
          <li>
            <span className="text-ink-primary">You can use made-up data.</span> You can also delete
            your filing at any time from the menu at the top right.
          </li>
        </ul>

        <AcceptNoticeButton />
      </div>
    </div>
  );
}
