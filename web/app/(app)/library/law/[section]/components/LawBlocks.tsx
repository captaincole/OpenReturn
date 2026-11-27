import { blockAnchor, versionAnchor, type LawBlock, type LawSectionVersion } from "@/lib/law";
import { lawLines, lawParts, type LawLine, type LawPart } from "@/lib/lawLines";

/*
 * The section's text, one element per block, id = the block's anchor
 * ("g-1"). Text is verbatim; each line is indented by its level, and the
 * leading numbers are set in bold. A California number with several
 * versions shows each one under its own heading (id "v2").
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

function VersionHeading({ version }: { version: LawSectionVersion }) {
  return (
    <h2 id={versionAnchor(version.version)} className="mt-8 font-serif text-lg text-ink-primary">
      {version.heading}
    </h2>
  );
}

export function LawBlocks({
  blocks,
  versions = [],
}: {
  blocks: LawBlock[];
  versions?: LawSectionVersion[];
}) {
  const startsVersion = new Map(versions.map((version) => [version.firstBlockId, version]));
  return (
    <article className="ref-doc law-text">
      {blocks.map((block) => {
        const version = startsVersion.get(block.blockId);
        return (
          <div key={block.blockId}>
            {version && <VersionHeading version={version} />}
            <Block block={block} />
          </div>
        );
      })}
    </article>
  );
}
