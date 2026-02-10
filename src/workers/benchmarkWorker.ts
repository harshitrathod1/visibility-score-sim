import { generateBenchmarks } from "@/lib/benchmark";
import type { SimulationConfig } from "@/types/company";

export type WorkerMessage =
  | { type: "progress"; processed: number; total: number }
  | { type: "done"; benchmark: import("@/types/company").BenchmarkFile }
  | { type: "error"; message: string };

self.onmessage = (e: MessageEvent<{ rows: Record<string, unknown>[]; config: SimulationConfig }>) => {
  const { rows, config } = e.data ?? {};
  if (!Array.isArray(rows) || !config) {
    self.postMessage({ type: "error", message: "Invalid message: rows and config required" } satisfies WorkerMessage);
    return;
  }
  try {
    const benchmark = generateBenchmarks(rows, config, (processed, total) => {
      self.postMessage({ type: "progress", processed, total } satisfies WorkerMessage);
    });
    self.postMessage({ type: "done", benchmark } satisfies WorkerMessage);
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    } satisfies WorkerMessage);
  }
};
