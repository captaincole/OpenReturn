"use client";

import { cn } from "@/lib/cn";
import {
  FIELD_STATES,
  STATE_LABELS,
  layoutForms,
  type Link as GraphLink,
  type StateCounts,
} from "@/lib/formGraph";
import Link from "next/link";
import { useMemo, useState } from "react";
import { STATE_FILL, StateDot } from "./StateBar";

export interface GraphForm {
  formId: string;
  displayName: string;
  fieldCount: number;
  states: StateCounts;
  reads: number;
  feeds: number;
}

/* A form the engine lacks: drawn with a dashed border, in its own column at the left. */
export interface GraphMissingForm {
  formId: string;
  displayName: string;
  about: string;
  waitingCount: number;
  feeds: number;
  /* The forms with a field that waits for it. */
  waitingForms: string[];
}

/* The one box for the forms of the other returns. It opens their graph. */
export interface GraphOutside {
  formId: string;
  displayName: string;
  jurisdiction: string;
  formCount: number;
  href: string;
}

type Node =
  | { kind: "form"; form: GraphForm }
  | { kind: "missing"; form: GraphMissingForm }
  | { kind: "outside"; form: GraphOutside };

interface Box {
  node: Node;
  x: number;
  y: number;
}

interface DrawnLink extends GraphLink {
  missing: boolean;
}

const CARD = { width: 104, height: 40 };
const PITCH = { x: 122, y: 54 };
const PAD = 10;
const HEADING = 22;
const BAR = { inset: 8, top: 26, height: 6, gap: 2 };
const NAME_LENGTH = 16;

const shortName = (name: string): string =>
  name.length > NAME_LENGTH ? `${name.slice(0, NAME_LENGTH - 1)}…` : name;

const idOf = (box: Box): string => box.node.form.formId;

/*
 * The forms the engine lacks make the first column. Each other column is centered
 * on the tallest one. The forms with no reads make the last row.
 */
function placeForms(
  forms: GraphForm[],
  links: GraphLink[],
  missing: GraphMissingForm[],
  outside: GraphOutside | undefined,
) {
  const layout = layoutForms(
    [...forms.map((form) => form.formId), ...(outside ? [outside.formId] : [])],
    links,
  );
  const byId = new Map<string, Node>(forms.map((form) => [form.formId, { kind: "form", form }]));
  if (outside) byId.set(outside.formId, { kind: "outside", form: outside });
  const rows = Math.max(layout.rows, missing.length);
  const start = PAD + (missing.length > 0 ? PITCH.x + 14 : 0);
  const top = PAD + HEADING;
  const centered = (row: number, size: number): number => top + (row + (rows - size) / 2) * PITCH.y;
  const sizeOf = (column: number) => layout.placed.filter((at) => at.column === column).length;
  const formBox = (formId: string, left: number, upper: number): Box => ({
    node: byId.get(formId) as Node,
    x: left,
    y: upper,
  });
  const aloneTop = top + rows * PITCH.y + 26;
  const boxes: Box[] = [
    ...missing.map((form, row) => ({
      node: { kind: "missing" as const, form },
      x: PAD,
      y: centered(row, missing.length),
    })),
    ...layout.placed.map((at) =>
      formBox(at.formId, start + at.column * PITCH.x, centered(at.row, sizeOf(at.column))),
    ),
    ...layout.alone.map((formId, index) => formBox(formId, start + index * PITCH.x, aloneTop)),
  ];
  const hasAlone = layout.alone.length > 0;
  return {
    boxes,
    left: start,
    aloneTop: hasAlone ? aloneTop : undefined,
    width: start + Math.max(layout.columns, layout.alone.length) * PITCH.x - 18 + PAD,
    height: (hasAlone ? aloneTop + CARD.height : top + rows * PITCH.y) + PAD,
  };
}

/* From the source's right side to the reader's left side; a read that goes back leaves from the left. */
function linkPath(source: Box, reader: Box): string {
  const middle = CARD.height / 2;
  const forward = reader.x > source.x;
  const sameColumn = reader.x === source.x;
  const startX = forward || sameColumn ? source.x + CARD.width : source.x;
  const endX = forward ? reader.x : reader.x + CARD.width;
  const [startY, endY] = [source.y + middle, reader.y + middle];
  const bend = sameColumn ? 34 : Math.max(Math.abs(endX - startX) / 2, 18);
  const startPull = forward || sameColumn ? startX + bend : startX - bend;
  const endPull = forward ? endX - bend : endX + bend;
  return `M ${startX} ${startY} C ${startPull} ${startY}, ${endPull} ${endY}, ${endX} ${endY}`;
}

function StateSegments({ states, total }: { states: StateCounts; total: number }) {
  const shown = FIELD_STATES.filter((state) => states[state] > 0);
  const room = CARD.width - BAR.inset * 2 - BAR.gap * (shown.length - 1);
  const widths = shown.map((state) => Math.max((states[state] / total) * room, 2));
  const leftOf = (index: number): number =>
    widths.slice(0, index).reduce((left, width) => left + width + BAR.gap, BAR.inset);
  return shown.map((state, index) => (
    <rect
      key={state}
      x={leftOf(index)}
      y={BAR.top}
      width={widths[index]}
      height={BAR.height}
      rx={2}
      className={STATE_FILL[state]}
    />
  ));
}

const formCount = (count: number): string => `${count} ${count === 1 ? "form" : "forms"}`;

function cardLabel(node: Node): string {
  const name = node.form.displayName;
  if (node.kind === "form")
    return `${name}: ${node.form.states.verified} of ${node.form.fieldCount} fields verified`;
  if (node.kind === "missing")
    return `${name}, a form the engine lacks: ${node.form.waitingCount} fields wait for it`;
  return `${name}: the ${formCount(node.form.formCount)} of ${node.form.jurisdiction}`;
}

const cardHref = (node: Node): string =>
  node.kind === "outside"
    ? node.form.href
    : `/library/graph?form=${encodeURIComponent(node.form.formId)}`;

/* The box of another return has round ends, so its text starts further in. */
const textLeft = (node: Node): number => (node.kind === "outside" ? 16 : BAR.inset);

function CardLine({ node }: { node: Node }) {
  if (node.kind === "form")
    return <StateSegments states={node.form.states} total={node.form.fieldCount} />;
  return (
    <text x={textLeft(node)} y={32} className="fill-ink-muted text-[10px]">
      {node.kind === "outside"
        ? formCount(node.form.formCount)
        : `${node.form.waitingCount} ${node.form.waitingCount === 1 ? "field waits" : "fields wait"}`}
    </text>
  );
}

function FormCard(props: {
  box: Box;
  selected: boolean;
  dimmed: boolean;
  onActive: (formId: string | null) => void;
}) {
  const { node, x, y } = props.box;
  const formId = node.form.formId;
  return (
    <Link
      href={cardHref(node)}
      scroll={node.kind === "outside"}
      aria-label={cardLabel(node)}
      onMouseEnter={() => props.onActive(formId)}
      onMouseLeave={() => props.onActive(null)}
      onFocus={() => props.onActive(formId)}
      onBlur={() => props.onActive(null)}
      className={cn("transition-opacity outline-none", props.dimmed && "opacity-30")}
    >
      <g transform={`translate(${x} ${y})`}>
        <rect
          width={CARD.width}
          height={CARD.height}
          rx={node.kind === "outside" ? CARD.height / 2 : 8}
          strokeDasharray={node.kind === "missing" ? "4 3" : undefined}
          className={cn(
            node.kind === "missing" ? "fill-bg-base" : "fill-bg-panel",
            props.selected ? "stroke-accent stroke-2" : "stroke-border-strong",
            node.kind === "form" && !props.selected && "stroke-border",
          )}
        />
        <text x={textLeft(node)} y={17} className="fill-ink-primary text-[11px] font-medium">
          {shortName(node.form.displayName)}
        </text>
        <CardLine node={node} />
      </g>
    </Link>
  );
}

function Readout({ node }: { node: Node | undefined }) {
  if (!node) {
    return (
      <p className="text-[13px] text-ink-muted">
        Point at a form to see its numbers. Select it to list its fields.
      </p>
    );
  }
  if (node.kind === "outside") {
    return (
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-secondary">
        <span className="font-medium text-ink-primary">{node.form.displayName}</span>
        <span>
          stands for the {formCount(node.form.formCount)} of {node.form.jurisdiction} · select it to
          go to their graph
        </span>
      </p>
    );
  }
  if (node.kind === "missing") {
    return (
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-secondary">
        <span className="font-medium text-ink-primary">{node.form.displayName}</span>
        <span>{node.form.about}</span>
        <span>
          the engine lacks it · {node.form.waitingCount} fields wait · they feed {node.form.feeds}{" "}
          fields
        </span>
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-secondary">
      <span className="font-medium text-ink-primary">{node.form.displayName}</span>
      {FIELD_STATES.map((state) => (
        <span key={state} className="flex items-center gap-1.5">
          <StateDot state={state} />
          {node.form.states[state]} {STATE_LABELS[state].toLowerCase()}
        </span>
      ))}
      <span>
        reads {node.form.reads} forms · feeds {node.form.feeds} forms
      </span>
    </p>
  );
}

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink-secondary">
      {FIELD_STATES.map((state) => (
        <li key={state} className="flex items-center gap-1.5">
          <StateDot state={state} />
          {STATE_LABELS[state]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-[3px] border border-dashed border-border-strong" />
        A form the engine lacks
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-full border border-border-strong" />
        The forms of another return
      </li>
      <li className="text-ink-muted">An arrow goes from a form to a form that reads it.</li>
    </ul>
  );
}

function ArrowHeads() {
  return (
    <defs>
      {(["rest", "active"] as const).map((kind) => (
        <marker
          key={kind}
          id={`form-graph-arrow-${kind}`}
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path
            d="M 0 0 L 8 4 L 0 8 z"
            className={kind === "active" ? "fill-ink-primary" : "fill-border-strong"}
          />
        </marker>
      ))}
    </defs>
  );
}

function LinkLine(props: {
  link: DrawnLink;
  source: Box;
  reader: Box;
  on: boolean;
  rest: boolean;
}) {
  return (
    <path
      d={linkPath(props.source, props.reader)}
      fill="none"
      strokeDasharray={props.link.missing ? "4 3" : undefined}
      markerEnd={`url(#form-graph-arrow-${props.on ? "active" : "rest"})`}
      className={cn(
        "transition-opacity",
        props.on ? "stroke-ink-primary" : "stroke-border-strong",
        props.on ? "stroke-[1.5]" : props.rest ? "opacity-60" : "opacity-15",
      )}
    />
  );
}

export function FormGraphView(props: {
  forms: GraphForm[];
  links: GraphLink[];
  missing: GraphMissingForm[];
  outside?: GraphOutside;
  selected?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const placed = useMemo(
    () => placeForms(props.forms, props.links, props.missing, props.outside),
    [props.forms, props.links, props.missing, props.outside],
  );
  const boxOf = useMemo(() => new Map(placed.boxes.map((box) => [idOf(box), box])), [placed]);
  const links: DrawnLink[] = useMemo(
    () =>
      [
        ...props.links.map((link) => ({ ...link, missing: false })),
        ...props.missing.flatMap((form) =>
          form.waitingForms.map((reader) => ({ source: form.formId, reader, missing: true })),
        ),
      ].filter((link) => boxOf.has(link.source) && boxOf.has(link.reader)),
    [props.links, props.missing, boxOf],
  );
  const active = hovered ?? (props.selected && boxOf.has(props.selected) ? props.selected : null);
  const touches = (link: GraphLink) => link.source === active || link.reader === active;
  const near = new Set(links.filter(touches).flatMap((link) => [link.source, link.reader]));
  /* At rest the dashed lines stay faint. The active form's lines are drawn last, over the others. */
  const ordered = [...links.filter((link) => !touches(link)), ...links.filter(touches)];

  return (
    <div className="space-y-3">
      <div className="min-h-10">
        <Readout node={active ? boxOf.get(active)?.node : undefined} />
      </div>
      <div className="card overflow-x-auto p-2">
        <svg
          width={placed.width}
          height={placed.height}
          viewBox={`0 0 ${placed.width} ${placed.height}`}
          role="group"
          aria-label="Which form reads which form"
        >
          <ArrowHeads />
          {props.missing.length > 0 && (
            <text x={PAD} y={PAD + 10} className="fill-ink-muted text-[11px]">
              Not in the engine
            </text>
          )}
          <text x={placed.left} y={PAD + 10} className="fill-ink-muted text-[11px]">
            In the engine
          </text>
          {ordered.map((link) => (
            <LinkLine
              key={`${link.source}|${link.reader}`}
              link={link}
              source={boxOf.get(link.source) as Box}
              reader={boxOf.get(link.reader) as Box}
              on={touches(link)}
              rest={active === null && !link.missing}
            />
          ))}
          {placed.aloneTop !== undefined && (
            <text x={placed.left} y={placed.aloneTop - 9} className="fill-ink-muted text-[11px]">
              No field read to or from another form
            </text>
          )}
          {placed.boxes.map((box) => (
            <FormCard
              key={idOf(box)}
              box={box}
              selected={idOf(box) === props.selected}
              dimmed={active !== null && idOf(box) !== active && !near.has(idOf(box))}
              onActive={setHovered}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
