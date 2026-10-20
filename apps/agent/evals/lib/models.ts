/*
 * The models every eval compares. Local models vary run to run, so each
 * case runs several times on them: 2 runs in the quick tier, 5 in the
 * full tier. A cloud model runs once.
 */
export interface EvalModel {
  label: string;
  id: string;
  url?: string;
  runs: number;
}

/*
 * quick: a small dataset and 2 runs, for everyday checks on the Mac.
 * full: the whole dataset and 5 runs. Too slow for the Mac (about 8
 * hours), so local models must run on the PC.
 */
export type Tier = "quick" | "full";

const RUNS: Record<Tier, number> = { quick: 2, full: 5 };

const MAC = "http://localhost:11434/v1";
/*
 * A second machine on the LAN (e.g. a CUDA desktop), as
 * http://<ip>:11434/v1. Its models are skipped when this is unset.
 * MLX-only tags (-mlx, -nvfp4) do not run there; use the GGUF tags.
 */
const PC = process.env.EVAL_PC_OLLAMA_URL;

const MODELS: Omit<EvalModel, "runs">[] = [
  { label: "Haiku 5.5", id: "anthropic/claude-haiku-5-5" },
  /* Mac (Apple M4, 32 GB, MLX engine). gemma4:26b resolves to the NVFP4 build. */
  { label: "Gemma 4 26b", id: "ollama/gemma4:26b", url: MAC },
  { label: "Gemma 4 26b MLX", id: "ollama/gemma4:26b-mlx", url: MAC },
  { label: "Gemma 4 31b MLX", id: "ollama/gemma4:31b-mlx", url: MAC },
  { label: "Gemma 4 e4b", id: "ollama/gemma4:e4b-mlx", url: MAC },
  { label: "Gemma 4 e2b", id: "ollama/gemma4:e2b-mlx", url: MAC },
  /* PC (RTX 4090, 24 GB VRAM, CUDA). There the plain tags (gemma4:26b, gemma4:31b, …) resolve to Q4_K_M GGUFs. */
  { label: "Gemma 4 26b QAT (4090)", id: "ollama/gemma4:26b-a4b-it-qat", url: PC },
  { label: "Gemma 4 26b Q4_K_M (4090)", id: "ollama/gemma4:26b", url: PC },
  { label: "Gemma 4 26b MTP (4090)", id: "ollama/gemma4:26b-a4b-it-mtp-q4_K_M", url: PC },
  { label: "Gemma 4 31b Q4_K_M (4090)", id: "ollama/gemma4:31b", url: PC },
  { label: "Gemma 4 31b QAT (4090)", id: "ollama/gemma4:31b-it-qat", url: PC },
  { label: "Gemma 4 e4b (4090)", id: "ollama/gemma4:e4b", url: PC },
  { label: "Gemma 4 e2b (4090)", id: "ollama/gemma4:e2b", url: PC },
].filter((m) => !m.id.startsWith("ollama/") || m.url);

export const tierFromArgs = (argv: string[]): Tier => (argv.includes("--full") ? "full" : "quick");

/*
 * CLI args: model filters (none = all), --full, and an optional --runs=N
 * override. A filter that names a tag exactly ("gemma4:26b") picks only
 * that model; otherwise it matches any id or label that contains it
 * ("4090", "31b").
 */
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
      `--full runs local models on the PC only (set EVAL_PC_OLLAMA_URL). Mac models picked: ${onMac.map((m) => m.label).join(", ")}`,
    );
  return picked.map((m) => ({ ...m, runs: m.url ? (override ?? RUNS[tier]) : 1 }));
}

/* Point the production model resolver (models.ts) at one model for a role. */
export function useModel(role: "LUCA" | "JUDGE", model: EvalModel): void {
  process.env[`${role}_MODEL`] = model.id;
  if (model.url) process.env[`${role}_MODEL_URL`] = model.url;
  else delete process.env[`${role}_MODEL_URL`];
}
