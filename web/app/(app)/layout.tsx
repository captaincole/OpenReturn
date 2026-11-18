import { behindAccess } from "@/lib/authMode";
import { noticeIsDue } from "@/lib/dataNotice";
import { hasLocalLogin } from "@/lib/localAuth";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

/* Cloudflare Access let the request in, but its token failed our check. There is no /login to send it to. */
function SignInNotChecked() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      <p className="max-w-sm text-center text-sm text-ink-secondary">
        OpenReturn could not check your sign-in. Reload the page to sign in again.
      </p>
    </div>
  );
}

/* The real auth gate: proxy.ts only checked that a cookie or a token is present. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session) {
    if (behindAccess()) return <SignInNotChecked />;
    redirect((await hasLocalLogin()) ? "/login" : "/setup");
  }
  if (await noticeIsDue(session.userId)) redirect("/notice");

  return <>{children}</>;
}
