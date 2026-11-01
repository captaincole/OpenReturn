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

const configured = (model: Omit<EvalModel, "runs">) =>
  model.id.startsWith("ollama/") ? Boolean(model.url) : Boolean(process.env.ANTHROPIC_API_KEY);
const MODELS = ALL_MODELS.filter(configured);

const LITE = new Set([HAIKU, "ollama/gemma4:31b"]);
const isLite = (model: Omit<EvalModel, "runs">) => LITE.has(model.id);

// The stored label keeps the machine tag: it keys merged runs.
const shortLabel = (label: string) => label.replace(/ \(4090\)$/, "");

export function forDisplay<R extends { model: string }>(models: EvalModel[], results: R[]) {
  return {
    models: models.map((model) => ({ ...model, label: shortLabel(model.label) })),
    results: results.map((result) => ({ ...result, model: shortLabel(result.model) })),
  };
}

export const tierFromArgs = (argv: string[]): Tier => (argv.includes("--full") ? "full" : "lite");

const NONE =
  "no eval model is configured: set ANTHROPIC_API_KEY for Haiku, or EVAL_PC_OLLAMA_URL for the 31b on the second machine";

function setupHint(model: Omit<EvalModel, "runs">): string {
  if (configured(model)) return "";
  return model.id.startsWith("ollama/")
    ? "  (set EVAL_PC_OLLAMA_URL)"
    : "  (set ANTHROPIC_API_KEY)";
}

function unknownModelError(ids: string[]): Error {
  const list = ALL_MODELS.map((model) => `  ${model.id}${setupHint(model)}`).join("\n");
  return new Error(`unknown or unconfigured model: ${ids.join(", ")}. Pass an exact id:\n${list}`);
}

export function modelsFromArgs(argv: string[]): EvalModel[] {
  const tier = tierFromArgs(argv);
  const runsOverride = Number(argv.find((arg) => arg.startsWith("--runs="))?.slice(7)) || undefined;
  const ids = argv.filter((arg) => !arg.startsWith("--"));
  const unknown = ids.filter((id) => !MODELS.some((model) => model.id === id));
  if (unknown.length) throw unknownModelError(unknown);
  const picked = ids.length
    ? MODELS.filter((model) => ids.includes(model.id))
    : MODELS.filter((model) => tier === "full" || isLite(model));
  if (!picked.length) throw new Error(NONE);
  return picked.map((model) => ({ ...model, runs: model.url ? (runsOverride ?? RUNS[tier]) : 1 }));
}

/*
 * A cloud model gets an empty URL, not a deleted one: modules imported
 * later run dotenv/config, which would restore a deleted URL from .env.
 */
export function useModel(role: "CADE" | "JUDGE", model: EvalModel): void {
  process.env[`${role}_MODEL`] = model.id;
  process.env[`${role}_MODEL_URL`] = model.url ?? "";
}
