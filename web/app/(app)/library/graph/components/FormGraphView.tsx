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

const CARD = { width: 104, height: 40 };
const PITCH = { x: 122, y: 54 };
const PAD = 10;
const BAR = { inset: 8, top: 26, height: 6, gap: 2 };
const NAME_LENGTH = 16;

interface Box {
  form: GraphForm;
  x: number;
  y: number;
}

const shortName = (name: string): string =>
  name.length > NAME_LENGTH ? `${name.slice(0, NAME_LENGTH - 1)}…` : name;

/* Each column is centered on the tallest one. The forms with no reads make the last row. */
function placeForms(forms: GraphForm[], links: GraphLink[]) {
  const layout = layoutForms(
    forms.map((form) => form.formId),
    links,
  );
  const byId = new Map(forms.map((form) => [form.formId, form]));
  const sizeOf = (column: number) => layout.placed.filter((at) => at.column === column).length;
  const boxes: Box[] = layout.placed.map((at) => ({
    form: byId.get(at.formId) as GraphForm,
    x: PAD + at.column * PITCH.x,
    y: PAD + (at.row + (layout.rows - sizeOf(at.column)) / 2) * PITCH.y,
  }));
  const aloneTop = PAD + layout.rows * PITCH.y + 26;
  const alone: Box[] = layout.alone.map((formId, index) => ({
    form: byId.get(formId) as GraphForm,
    x: PAD + index * PITCH.x,
    y: aloneTop,
  }));
  return {
    boxes: [...boxes, ...alone],
    aloneTop: alone.length > 0 ? aloneTop : undefined,
    width: PAD * 2 + Math.max(layout.columns, layout.alone.length) * PITCH.x - 18,
    height: (alone.length > 0 ? aloneTop + CARD.height : PAD + layout.rows * PITCH.y) + PAD,
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

function FormCard(props: {
  box: Box;
  selected: boolean;
  dimmed: boolean;
  onActive: (formId: string | null) => void;
}) {
  const { form, x, y } = props.box;
  return (
    <Link
      href={`/library/graph?form=${encodeURIComponent(form.formId)}`}
      scroll={false}
      aria-label={`${form.displayName}: ${form.states.verified} of ${form.fieldCount} fields verified`}
      onMouseEnter={() => props.onActive(form.formId)}
      onMouseLeave={() => props.onActive(null)}
      onFocus={() => props.onActive(form.formId)}
      onBlur={() => props.onActive(null)}
      className={cn("transition-opacity outline-none", props.dimmed && "opacity-30")}
    >
      <g transform={`translate(${x} ${y})`}>
        <rect
          width={CARD.width}
          height={CARD.height}
          rx={8}
          className={cn(
            "fill-bg-panel",
            props.selected ? "stroke-accent stroke-2" : "stroke-border",
          )}
        />
        <text x={BAR.inset} y={17} className="fill-ink-primary text-[11px] font-medium">
          {shortName(form.displayName)}
        </text>
        <StateSegments states={form.states} total={form.fieldCount} />
      </g>
    </Link>
  );
}

function Readout({ form }: { form: GraphForm | undefined }) {
  if (!form) {
    return (
      <p className="text-[13px] text-ink-muted">
        Point at a form to see its numbers. Select it to list its fields.
      </p>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-secondary">
      <span className="font-medium text-ink-primary">{form.displayName}</span>
      {FIELD_STATES.map((state) => (
        <span key={state} className="flex items-center gap-1.5">
          <StateDot state={state} />
          {form.states[state]} {STATE_LABELS[state].toLowerCase()}
        </span>
      ))}
      <span>
        reads {form.reads} forms · feeds {form.feeds} forms
      </span>
    </p>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-secondary">
      {FIELD_STATES.map((state) => (
        <li key={state} className="flex items-center gap-1.5">
          <StateDot state={state} />
          {STATE_LABELS[state]}
        </li>
      ))}
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

export function FormGraphView(props: {
  forms: GraphForm[];
  links: GraphLink[];
  selected?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const placed = useMemo(() => placeForms(props.forms, props.links), [props.forms, props.links]);
  const boxOf = useMemo(() => new Map(placed.boxes.map((box) => [box.form.formId, box])), [placed]);
  const active = hovered ?? props.selected ?? null;
  const touches = (link: GraphLink) => link.source === active || link.reader === active;
  const near = new Set(props.links.filter(touches).flatMap((link) => [link.source, link.reader]));
  const drawn = props.links.filter((link) => boxOf.has(link.source) && boxOf.has(link.reader));
  /* The active form's lines are drawn last, over the others. */
  const ordered = [...drawn.filter((link) => !touches(link)), ...drawn.filter(touches)];

  return (
    <div className="space-y-3">
      <Legend />
      <div className="min-h-10">
        <Readout form={active ? boxOf.get(active)?.form : undefined} />
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
          {ordered.map((link) => {
            const on = touches(link);
            return (
              <path
                key={`${link.source}|${link.reader}`}
                d={linkPath(boxOf.get(link.source) as Box, boxOf.get(link.reader) as Box)}
                fill="none"
                markerEnd={`url(#form-graph-arrow-${on ? "active" : "rest"})`}
                className={cn(
                  "transition-opacity",
                  on ? "stroke-ink-primary" : "stroke-border-strong",
                  on ? "stroke-[1.5]" : active ? "opacity-15" : "opacity-60",
                )}
              />
            );
          })}
          {placed.aloneTop !== undefined && (
            <text x={PAD} y={placed.aloneTop - 9} className="fill-ink-muted text-[11px]">
              No field read to or from another form
            </text>
          )}
          {placed.boxes.map((box) => (
            <FormCard
              key={box.form.formId}
              box={box}
              selected={box.form.formId === props.selected}
              dimmed={active !== null && box.form.formId !== active && !near.has(box.form.formId)}
              onActive={setHovered}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
