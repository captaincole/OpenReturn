import { blockAnchor, type LawBlock } from "@/lib/law";
import { lawLines, lawParts, type LawLine, type LawPart } from "@/lib/lawLines";

/*
 * The section's text, one element per block, id = the block's anchor
 * ("g-1"). Text is verbatim; each line is indented by its level, and the
 * leading numbers are set in bold.
 */

const INDENT_REM = 1.5;
const indent = (depth: number) => ({ paddingLeft: `${depth * INDENT_REM}rem` });

function Line({ line }: { line: LawLine }) {
  return (
    <p className="law-line" style={indent(line.depth)}>
      {line.markerEnd > 0 && (
        <span className="law-marker">{line.text.slice(0, line.markerEnd)}</span>
      )}
      {line.text.slice(line.markerEnd)}
    </p>
  );
}

function Table({ part }: { part: Extract<LawPart, { kind: "table" }> }) {
  return (
    <div style={indent(part.depth)}>
      <table>
        <tbody>
          {part.rows.map((cells, row) => (
            <tr key={row}>
              {cells.map((cell, column) => (
                <td key={column}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ block }: { block: LawBlock }) {
  const parts = lawParts(lawLines(block.path, block.text));
  return (
    <div id={blockAnchor(block.blockId)} className="law-block" title={block.citation}>
      {parts.map((part, i) =>
        part.kind === "line" ? <Line key={i} line={part.line} /> : <Table key={i} part={part} />,
      )}
    </div>
  );
}

export function LawBlocks({ blocks }: { blocks: LawBlock[] }) {
  return (
    <article className="ref-doc law-text">
      {blocks.map((block) => (
        <Block key={block.blockId} block={block} />
      ))}
    </article>
  );
}
