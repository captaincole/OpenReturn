import { redirect } from "next/navigation";
import { ownerExists } from "@/lib/localAuth";

/*
 * Before an owner exists there is nothing to log in to. Send first-run
 * visitors to /setup instead.
 */
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await ownerExists())) redirect("/setup");
  return <>{children}</>;
}
