import { behindAccess } from "@/lib/authMode";
import { hasLocalLogin } from "@/lib/localAuth";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  if (behindAccess()) redirect("/");
  if (!(await hasLocalLogin())) redirect("/setup");
  if (await getUserSession()) redirect("/");
  return <>{children}</>;
}
