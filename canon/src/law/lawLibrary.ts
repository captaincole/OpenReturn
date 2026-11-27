import { lawLibrary, type LawLibrary } from "../db/libsql";
import { jurisdictionOfLawId, jurisdictionOfLawSource } from "../jurisdiction";
import type { LawSource } from "./citation";

/*
 * Which law file holds a source or an id. Each jurisdiction has its own
 * file (JURISDICTION_TABLE in jurisdiction.ts says which sources it owns),
 * so a reader opens the file of the document it reads.
 */

export const lawLibraryOfSource = (source: LawSource): LawLibrary =>
  lawLibrary(jurisdictionOfLawSource(source));

/** The file of a law document, section or block id. A corpus id is an error. */
export function lawLibraryOfId(id: string): LawLibrary {
  const jurisdiction = jurisdictionOfLawId(id);
  if (jurisdiction === null) throw new Error(`"${id}" is not an id of the law library`);
  return lawLibrary(jurisdiction);
}
