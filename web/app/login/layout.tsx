import { hasUsers } from "@/lib/localAuth";
import { redirect } from "next/navigation";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasUsers())) redirect("/setup");
  return <>{children}</>;
}
