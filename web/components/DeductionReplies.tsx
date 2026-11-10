"use client";

/*
 * The answers to tap in the deductions conversation, made from the step
 * /app/state returns. A tap sends the answer as a user message, so Cade reads
 * a tap and a typed answer the same way.
 */

import { useAppShell } from "@/components/AppShell";
import { returnHref } from "@/lib/chatSession";
import { cn } from "@/lib/cn";
import { lifeAnswersMessage, type NextStep } from "@/lib/deductions";
import Link from "next/link";
import { useState } from "react";

type LifeStep = Extract<NextStep, { step: "ask_life_questions" }>;
type OpenDoorStep = Extract<NextStep, { step: "ask_anything_else" }>;

export function DeductionReplies() {
  const { state, messages, cadeBusy, sendChat, activeReturn } = useAppShell();
  const next = state?.deductions.next;
  if (!next || cadeBusy) return null;
  const send = (text: string) => void sendChat({ text });
  const toReturn = (label: string) => (
    <ReplyRow>
      <ReplyLink label={label} href={returnHref(activeReturn.id)} />
    </ReplyRow>
  );

  /* The conversation is done: the next action is on the return. */
  if (next.step === "closed") return toReturn("Back to the return");

  /* Cade has asked nothing yet: the one answer is to start. */
  if (messages.length === 0) {
    return (
      <ReplyRow>
        <ReplyButton label="Let's start" onClick={() => send("Let's start")} />
      </ReplyRow>
    );
  }
  if (next.step === "ask_life_questions") {
    return <LifeQuestionReplies questions={next.questions} send={send} />;
  }
  if (next.step === "ask_anything_else") return <OpenDoorReplies step={next} send={send} />;
  /* The comparison waits for answers that the return's conversation asks for. */
  if (next.step === "wait_for_return") return toReturn("Go to the return");
  return null;
}

/*
 * One open question: a tap sends at once. Several: the taps pick the answers,
 * and one message sends them, each with its question, so a "Yes" cannot land
 * on the wrong one.
 */
function LifeQuestionReplies({
  questions,
  send,
}: {
  questions: LifeStep["questions"];
  send: (text: string) => void;
}) {
  const [answers, setAnswers] = useState<ReadonlyMap<string, boolean>>(new Map());
  const single = questions.length === 1;
  const picked = questions.filter((question) => answers.has(question.id)).length;

  function answer(id: string, value: boolean) {
    const nextAnswers = new Map(answers).set(id, value);
    if (single) send(lifeAnswersMessage(questions, nextAnswers));
    else setAnswers(nextAnswers);
  }

  function sendPicked() {
    send(lifeAnswersMessage(questions, answers));
    setAnswers(new Map());
  }

  return (
    <div className="shrink-0 px-3.5 pb-2">
      <ul className="max-h-[40vh] divide-y divide-border-subtle overflow-y-auto">
        {questions.map((question) => (
          <li key={question.id} className="flex items-center gap-2 py-2.5">
            <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink-secondary">
              {question.ask}
            </span>
            <ReplyButton
              label="Yes"
              picked={answers.get(question.id) === true}
              onClick={() => answer(question.id, true)}
            />
            <ReplyButton
              label="No"
              picked={answers.get(question.id) === false}
              onClick={() => answer(question.id, false)}
            />
          </li>
        ))}
      </ul>
      {!single && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={sendPicked}
            disabled={picked === 0}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-ink-muted"
          >
            {picked === 0
              ? "Pick your answers"
              : `Send ${picked} ${picked === 1 ? "answer" : "answers"}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* The open door: things people often name, and the reply that closes the door. */
function OpenDoorReplies({ step, send }: { step: OpenDoorStep; send: (text: string) => void }) {
  return (
    <ReplyRow>
      {step.suggestions.map((suggestion) => (
        <ReplyButton key={suggestion} label={suggestion} onClick={() => send(suggestion)} />
      ))}
      <ReplyButton label={step.done} strong onClick={() => send(step.done)} />
    </ReplyRow>
  );
}

function ReplyRow({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 flex-wrap gap-1.5 px-3.5 pb-2">{children}</div>;
}

type ReplyTone = "plain" | "strong" | "picked";

const REPLY_TONES: Record<ReplyTone, string> = {
  plain:
    "border-border-subtle bg-bg-panel text-ink-secondary hover:border-border-strong hover:text-ink-primary",
  strong: "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25",
  picked: "border-accent bg-accent text-white",
};

const replyClasses = (tone: ReplyTone): string =>
  cn(
    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    REPLY_TONES[tone],
  );

function ReplyButton({
  label,
  onClick,
  picked = false,
  strong = false,
}: {
  label: string;
  onClick: () => void;
  picked?: boolean;
  /* The reply that ends the step. */
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={replyClasses(picked ? "picked" : strong ? "strong" : "plain")}
    >
      {label}
    </button>
  );
}

/* A reply that goes to another page and sends nothing to Cade. */
function ReplyLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={replyClasses("strong")}>
      {label}
    </Link>
  );
}
