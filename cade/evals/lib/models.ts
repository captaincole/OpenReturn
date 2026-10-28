export interface EvalModel {
  label: string;
  id: string;
  url?: string;
  runs: number;
}

/* full takes about 8 hours on a laptop, so its local models run on a second Ollama machine. */
export type Tier = "quick" | "full";

const RUNS: Record<Tier, number> = { quick: 2, full: 5 };

const MAC = "http://localhost:11434/v1";
/* MLX-only tags (-mlx, -nvfp4) do not run on a CUDA machine: use the GGUF tags there. */
const PC = process.env.EVAL_PC_OLLAMA_URL;

const MODELS: Omit<EvalModel, "runs">[] = [
  { label: "Haiku 5.5", id: "anthropic/claude-haiku-5-5" },
  /* On the Mac, gemma4:26b resolves to the NVFP4 build. */
  { label: "Gemma 4 26b", id: "ollama/gemma4:26b", url: MAC },
  { label: "Gemma 4 26b MLX", id: "ollama/gemma4:26b-mlx", url: MAC },
  { label: "Gemma 4 31b MLX", id: "ollama/gemma4:31b-mlx", url: MAC },
  { label: "Gemma 4 e4b", id: "ollama/gemma4:e4b-mlx", url: MAC },
  { label: "Gemma 4 e2b", id: "ollama/gemma4:e2b-mlx", url: MAC },
  /* On a CUDA machine, the plain tags resolve to Q4_K_M. */
  { label: "Gemma 4 26b QAT (4090)", id: "ollama/gemma4:26b-a4b-it-qat", url: PC },
  { label: "Gemma 4 26b Q4_K_M (4090)", id: "ollama/gemma4:26b", url: PC },
  { label: "Gemma 4 26b MTP (4090)", id: "ollama/gemma4:26b-a4b-it-mtp-q4_K_M", url: PC },
  { label: "Gemma 4 31b Q4_K_M (4090)", id: "ollama/gemma4:31b", url: PC },
  { label: "Gemma 4 31b QAT (4090)", id: "ollama/gemma4:31b-it-qat", url: PC },
  { label: "Gemma 4 e4b (4090)", id: "ollama/gemma4:e4b", url: PC },
  { label: "Gemma 4 e2b (4090)", id: "ollama/gemma4:e2b", url: PC },
].filter((m) => !m.id.startsWith("ollama/") || m.url);

/* The stored label keeps the machine tag: it keys merged runs. */
const shortLabel = (label: string) => label.replace(/ \(4090\)$/, "");

export function forDisplay<R extends { model: string }>(models: EvalModel[], results: R[]) {
  return {
    models: models.map((m) => ({ ...m, label: shortLabel(m.label) })),
    results: results.map((r) => ({ ...r, model: shortLabel(r.model) })),
  };
}

export const tierFromArgs = (argv: string[]): Tier => (argv.includes("--full") ? "full" : "quick");

/* An exact tag ("gemma4:26b") picks only that model; other filters match substrings. */
export function modelsFromArgs(argv: string[]): EvalModel[] {
  const tier = tierFromArgs(argv);
  const override = Number(argv.find((a) => a.startsWith("--runs="))?.slice(7)) || undefined;
  const filters = argv.filter((a) => !a.startsWith("--"));
  const exact = (f: string) => MODELS.filter((m) => m.id === f || m.id.endsWith(`/${f}`));
  const loose = (f: string) => MODELS.filter((m) => m.id.includes(f) || m.label.includes(f));
  const picked = filters.length
    ? MODELS.filter((m) => filters.some((f) => (exact(f).length ? exact(f) : loose(f)).includes(m)))
    : MODELS.filter((m) => tier === "quick" || m.url !== MAC);
  const onMac = picked.filter((m) => m.url === MAC);
  if (tier === "full" && onMac.length)
    throw new Error(
      `--full runs local models on the second machine only (set EVAL_PC_OLLAMA_URL). Mac models picked: ${onMac.map((m) => m.label).join(", ")}`,
    );
  return picked.map((m) => ({ ...m, runs: m.url ? (override ?? RUNS[tier]) : 1 }));
}

/*
 * A cloud model gets an empty URL, not a deleted one: modules imported later run
 * dotenv/config, which would restore a deleted URL from .env.
 */
export function useModel(role: "CADE" | "JUDGE", model: EvalModel): void {
  process.env[`${role}_MODEL`] = model.id;
  process.env[`${role}_MODEL_URL`] = model.url ?? "";
}
