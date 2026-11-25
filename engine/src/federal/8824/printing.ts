/*
 * Text the form prints over two entry lines, and the two parts of the
 * certificate number on line 26. No money is involved.
 */

/* Characters that fit on a full-width entry line, and on a first line that starts after its label. */
export const FULL_LINE = 100;
export const AFTER_LABEL = 64;

/*
 * A text over two entry lines: the first holds the words that fit, the second
 * the rest (the renderer shrinks a text that is still too wide).
 */
export function twoLines(text: string, firstWidth: number): [string, string | undefined] {
  if (text.length <= firstWidth) return [text, undefined];
  const cut = text.lastIndexOf(" ", firstWidth);
  if (cut <= 0) return [text, undefined];
  return [text.slice(0, cut), text.slice(cut + 1)];
}

/*
 * Line 26 prints the certificate number in two boxes around a printed dash:
 * the part before the first dash, and the rest. A number with no dash fills
 * the first box.
 */
export function certificateParts(number: string): [string, string | undefined] {
  const dash = number.indexOf("-");
  if (dash < 0) return [number, undefined];
  return [number.slice(0, dash), number.slice(dash + 1) || undefined];
}
