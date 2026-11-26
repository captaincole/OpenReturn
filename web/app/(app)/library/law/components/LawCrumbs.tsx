import type { LawSource } from "@/lib/law";
import { lawCrumbs, type LawTocEntry } from "@/lib/lawToc";
import Link from "next/link";
import { Fragment } from "react";

/* The levels above a page, each a link to its level of the table of contents. */
export function LawCrumbs({ source, ancestors }: { source: LawSource; ancestors: LawTocEntry[] }) {
  return (
    <nav aria-label="Contents" className="text-[12px] text-ink-muted">
      {lawCrumbs(source, ancestors).map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && " › "}
          <Link href={crumb.href} className="hover:text-ink-primary">
            {crumb.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
