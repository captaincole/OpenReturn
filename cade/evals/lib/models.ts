// Local models vary run to run, so the full tier runs them several times; a cloud model runs once.
export interface EvalModel {
  label: string;
  id: string;
  url?: string;
  runs: number;
}

/*
 * lite: one run of Haiku and the 31b on the second machine (whichever is configured);
 *       the check after a change. full: every configured model, five runs each; it takes
 *       hours, so its local models run on a second machine.
 */
export type Tier = "lite" | "full";

const RUNS: Record<Tier, number> = { lite: 1, full: 5 };

// MLX-only tags (-mlx, -nvfp4) do not run on a CUDA machine; use the GGUF tags.
const PC = process.env.EVAL_PC_OLLAMA_URL;
const HAIKU = "anthropic/claude-haiku-5-5";

const ALL_MODELS: Omit<EvalModel, "runs">[] = [
  { label: "Haiku 5.5", id: HAIKU },
  /* On CUDA the plain tags resolve to Q4_K_M. */
  { label: "Gemma 4 26b QAT (4090)", id: "ollama/gemma4:26b-a4b-it-qat", url: PC },
  { label: "Gemma 4 26b Q4_K_M (4090)", id: "ollama/gemma4:26b", url: PC },
  { label: "Gemma 4 26b MTP (4090)", id: "ollama/gemma4:26b-a4b-it-mtp-q4_K_M", url: PC },
  { label: "Gemma 4 31b Q4_K_M (4090)", id: "ollama/gemma4:31b", url: PC },
  { label: "Gemma 4 31b QAT (4090)", id: "ollama/gemma4:31b-it-qat", url: PC },
  { label: "Gemma 4 e4b (4090)", id: "ollama/gemma4:e4b", url: PC },
  { label: "Gemma 4 e2b (4090)", id: "ollama/gemma4:e2b", url: PC },
];

const configured = (m: Omit<EvalModel, "runs">) =>
  m.id.startsWith("ollama/") ? Boolean(m.url) : Boolean(process.env.ANTHROPIC_API_KEY);
const MODELS = ALL_MODELS.filter(configured);

const LITE = new Set([HAIKU, "ollama/gemma4:31b"]);
const isLite = (m: Omit<EvalModel, "runs">) => LITE.has(m.id);

// The stored label keeps the machine tag: it keys merged runs.
const shortLabel = (label: string) => label.replace(/ \(4090\)$/, "");

export function forDisplay<R extends { model: string }>(models: EvalModel[], results: R[]) {
  return {
    models: models.map((m) => ({ ...m, label: shortLabel(m.label) })),
    results: results.map((r) => ({ ...r, model: shortLabel(r.model) })),
  };
}

export const tierFromArgs = (argv: string[]): Tier => (argv.includes("--full") ? "full" : "lite");

const NONE =
  "no eval model is configured: set ANTHROPIC_API_KEY for Haiku, or EVAL_PC_OLLAMA_URL for the 31b on the second machine";

function setupHint(m: Omit<EvalModel, "runs">): string {
  if (configured(m)) return "";
  return m.id.startsWith("ollama/") ? "  (set EVAL_PC_OLLAMA_URL)" : "  (set ANTHROPIC_API_KEY)";
}

function unknownModelError(ids: string[]): Error {
  const list = ALL_MODELS.map((m) => `  ${m.id}${setupHint(m)}`).join("\n");
  return new Error(`unknown or unconfigured model: ${ids.join(", ")}. Pass an exact id:\n${list}`);
}

export function modelsFromArgs(argv: string[]): EvalModel[] {
  const tier = tierFromArgs(argv);
  const runsOverride = Number(argv.find((a) => a.startsWith("--runs="))?.slice(7)) || undefined;
  const ids = argv.filter((a) => !a.startsWith("--"));
  const unknown = ids.filter((id) => !MODELS.some((m) => m.id === id));
  if (unknown.length) throw unknownModelError(unknown);
  const picked = ids.length
    ? MODELS.filter((m) => ids.includes(m.id))
    : MODELS.filter((m) => tier === "full" || isLite(m));
  if (!picked.length) throw new Error(NONE);
  return picked.map((m) => ({ ...m, runs: m.url ? (runsOverride ?? RUNS[tier]) : 1 }));
}

/*
 * A cloud model gets an empty URL, not a deleted one: modules imported
 * later run dotenv/config, which would restore a deleted URL from .env.
 */
export function useModel(role: "CADE" | "JUDGE", model: EvalModel): void {
  process.env[`${role}_MODEL`] = model.id;
  process.env[`${role}_MODEL_URL`] = model.url ?? "";
}
