"use client";

import { cn } from "@/lib/cn";
import {
  FIELD_STATES,
  STATE_LABELS,
  type Link as GraphLink,
  type StateCounts,
} from "@/lib/formGraph";
import {
  CARD,
  SECTION_LABELS,
  drawLanes,
  lanesOf,
  linkPath,
  type LaneBox,
} from "@/lib/formGraphLayout";
import Link from "next/link";
import { useMemo, useState } from "react";
import { STATE_FILL, StateDot } from "./StateBar";

export interface GraphForm {
  formId: string;
  displayName: string;
  /* The part of the return that the form belongs to, and its place in that part. */
  section: string;
  rank: number;
  fieldCount: number;
  states: StateCounts;
  reads: number;
  feeds: number;
}

/* A form the engine lacks: drawn with a dashed border, in the lane of its section. */
export interface GraphMissingForm {
  formId: string;
  displayName: string;
  section: string;
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

const BAR = { inset: 8, top: 26, height: 6, gap: 2 };
const NAME_LENGTH = 16;

const shortName = (name: string): string =>
  name.length > NAME_LENGTH ? `${name.slice(0, NAME_LENGTH - 1)}…` : name;

const idOf = (box: Box): string => box.node.form.formId;

/*
 * The main form is at the top, with the box of the other return at its side.
 * Each other form is in the lane of its section; a form the engine lacks comes
 * after the forms the engine has.
 */
function placeForms(
  forms: GraphForm[],
  links: GraphLink[],
  missing: GraphMissingForm[],
  outside: GraphOutside | undefined,
) {
  const nodes: Node[] = [
    ...forms.map((form) => ({ kind: "form" as const, form })),
    ...missing.map((form) => ({ kind: "missing" as const, form })),
    ...(outside ? [{ kind: "outside" as const, form: outside }] : []),
  ];
  const byId = new Map(nodes.map((node) => [node.form.formId, node]));
  const { main, lanes } = lanesOf([...forms, ...missing]);
  const feedsMain = links.some((link) => link.source === outside?.formId);
  const drawing = drawLanes(
    main,
    lanes,
    outside && { formId: outside.formId, side: feedsMain ? "left" : "right" },
  );
  return {
    ...drawing,
    main,
    boxes: drawing.slots.map((slot) => ({ ...slot, node: byId.get(slot.formId) as Node })),
  };
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
  /* Where a selected form goes when it is selected again: the graph with no form selected. */
  clearHref: string;
  onActive: (formId: string | null) => void;
}) {
  const { node, x, y } = props.box;
  const formId = node.form.formId;
  return (
    <Link
      href={props.selected ? props.clearHref : cardHref(node)}
      aria-current={props.selected ? "true" : undefined}
      scroll={false}
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
        Point at a form to see its arrows and its numbers. Select it to list its fields.
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

/* The frame of one part of the return, with its name. */
function LaneFrame({ lane }: { lane: LaneBox }) {
  return (
    <g>
      <rect
        x={lane.x}
        y={lane.y}
        width={lane.width}
        height={lane.height}
        rx={10}
        className="fill-bg-base stroke-border-subtle"
      />
      <text x={lane.x + 8} y={lane.y + 16} className="fill-ink-muted text-[11px]">
        {SECTION_LABELS[lane.section] ?? lane.section}
      </text>
    </g>
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

function LinkLine(props: { link: DrawnLink; source: Box; reader: Box; on: boolean }) {
  return (
    <path
      d={linkPath(props.source, props.reader)}
      fill="none"
      strokeDasharray={props.link.missing ? "4 3" : undefined}
      markerEnd={`url(#form-graph-arrow-${props.on ? "active" : "rest"})`}
      className={cn(
        "pointer-events-none",
        props.on ? "stroke-ink-primary stroke-[1.5]" : "stroke-border-strong",
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
  clearHref: string;
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
  /* At rest the one arrow is between the main form and the other return. The active form shows all of its arrows. */
  const joinsReturns = (link: GraphLink) =>
    [link.source, link.reader].includes(placed.main ?? "") &&
    [link.source, link.reader].includes(props.outside?.formId ?? "");
  const drawn = links.filter((link) => touches(link) || (active === null && joinsReturns(link)));

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
          className="mx-auto block"
          role="group"
          aria-label="Which form reads which form"
        >
          <ArrowHeads />
          {placed.trunk.map((path) => (
            <path key={path} d={path} fill="none" className="stroke-border-strong" />
          ))}
          {placed.lanes.map((lane) => (
            <LaneFrame key={lane.section} lane={lane} />
          ))}
          {placed.boxes.map((box) => (
            <FormCard
              key={idOf(box)}
              box={box}
              selected={idOf(box) === props.selected}
              clearHref={props.clearHref}
              dimmed={active !== null && idOf(box) !== active && !near.has(idOf(box))}
              onActive={setHovered}
            />
          ))}
          {drawn.map((link) => (
            <LinkLine
              key={`${link.source}|${link.reader}`}
              link={link}
              source={boxOf.get(link.source) as Box}
              reader={boxOf.get(link.reader) as Box}
              on={touches(link)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
