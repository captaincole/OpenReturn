/*
 * Which block a statute deep link lands on. The hash is the path inside the
 * section: "#g-1-A" is 469(g)(1)(A). Each block's element id is the end of
 * its block id ("g-1", "k-2-E-cont", "b-1-F-iii-p2", "b-4-dup2"). A
 * subdivision packed into its parent's block has no element, so the link
 * falls back to the nearest block that holds it.
 */

const SEGMENT_JOINT = "-";
const DUP_PREFIX = "dup";

const isDigits = (text: string) =>
  text.length > 0 && [...text].every((char) => char >= "0" && char <= "9");

/* "dup2" is not a level: it tells apart two units with the same number, as in "4-dup2". */
const isDupMark = (token: string) =>
  token.startsWith(DUP_PREFIX) && isDigits(token.slice(DUP_PREFIX.length));

/** "b-4-dup2-A" → ["b", "4-dup2", "A"]: one entry per level. */
export function anchorSegments(anchor: string): string[] {
  const segments: string[] = [];
  for (const token of anchor.split(SEGMENT_JOINT).filter(Boolean)) {
    if (isDupMark(token) && segments.length > 0) segments.push(`${segments.pop()}-${token}`);
    else segments.push(token);
  }
  return segments;
}

/** The ids to try, most specific first: "g-1-A" → ["g-1-A", "g-1", "g"]. */
export function anchorCandidates(anchor: string): string[] {
  const segments = anchorSegments(anchor);
  return segments.map((_, i) => segments.slice(0, segments.length - i).join(SEGMENT_JOINT));
}

/* True when `id` is a block inside `candidate`: "k-2-E-i" is inside "k-2-E", "b-4-dup2" is not inside "b-4". */
function isInside(id: string, candidate: string): boolean {
  const outer = anchorSegments(candidate);
  const inner = anchorSegments(id);
  return inner.length > outer.length && outer.every((segment, i) => inner[i] === segment);
}

/*
 * The element to scroll to, from the ids on the page in statute order. For
 * each candidate: the block itself, else the first block inside it (a unit
 * whose heading runs into its first child's block).
 */
export function findLawAnchor(anchor: string, ids: string[]): string | null {
  for (const candidate of anchorCandidates(anchor)) {
    if (ids.includes(candidate)) return candidate;
    const first = ids.find((id) => isInside(id, candidate));
    if (first) return first;
  }
  return null;
}

/** The hash without "#", decoded; "" when it is not valid percent-encoding. */
export function hashAnchor(hash: string): string {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return "";
  }
}
