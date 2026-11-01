export interface UserProfile {
  displayName: string;
  firstName: string;
  initials: string;
  email: string | null;
}

function deriveFromEmail(email: string | null): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  if (!local) return "there";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function deriveProfile(
  owner: { email: string | null; displayName?: string | null } | null,
): UserProfile {
  const email = owner?.email ?? null;
  const explicitName = owner?.displayName;
  const displayName =
    explicitName && explicitName.trim().length > 0 ? explicitName.trim() : deriveFromEmail(email);
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const initialsSource = displayName.split(/\s+/).filter(Boolean);
  const initials =
    initialsSource.length >= 2
      ? `${initialsSource[0][0]}${initialsSource[1][0]}`.toUpperCase()
      : (initialsSource[0]?.slice(0, 2) ?? "??").toUpperCase();
  return { displayName, firstName, initials, email };
}
