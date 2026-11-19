import { useEffect, useRef, type RefObject } from "react";

/* How close to the end still counts as "at the end". */
const NEAR_END_PX = 48;

/*
 * Keeps a scroll area at its end when the area itself gets shorter or taller:
 * the phone keyboard opens, the plan line shows in the reply box, the answers
 * to tap show. Without it the reply box covers the last message. A reader who
 * scrolled up stays where they are.
 */
export function useStickToBottom(scrollRef: RefObject<HTMLDivElement | null>): void {
  const atEnd = useRef(true);

  useEffect(() => {
    const area = scrollRef.current;
    if (!area) return;
    const onScroll = () => {
      atEnd.current = area.scrollHeight - area.scrollTop - area.clientHeight < NEAR_END_PX;
    };
    const resized = new ResizeObserver(() => {
      if (atEnd.current) area.scrollTo({ top: area.scrollHeight });
    });
    area.addEventListener("scroll", onScroll, { passive: true });
    resized.observe(area);
    return () => {
      area.removeEventListener("scroll", onScroll);
      resized.disconnect();
    };
  }, [scrollRef]);
}
