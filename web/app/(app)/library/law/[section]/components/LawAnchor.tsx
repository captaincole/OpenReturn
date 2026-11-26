"use client";

import { findLawAnchor, hashAnchor } from "@/lib/lawAnchor";
import { useEffect } from "react";

/*
 * Resolves the hash to a block. The browser jumps to an id it finds by
 * itself; a subdivision packed into its parent's block has no id, so this
 * finds the block that holds it, scrolls there and marks it for a moment.
 */

const FLASH_MS = 1600;

export function LawAnchor({ ids }: { ids: string[] }) {
  useEffect(() => {
    let timer: number | undefined;
    const go = () => {
      const target = findLawAnchor(hashAnchor(window.location.hash), ids);
      const el = target ? document.getElementById(target) : null;
      if (!el) return;
      el.scrollIntoView({ block: "start" });
      el.setAttribute("data-flash", "");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.removeAttribute("data-flash"), FLASH_MS);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => {
      window.removeEventListener("hashchange", go);
      window.clearTimeout(timer);
    };
  }, [ids]);
  return null;
}
