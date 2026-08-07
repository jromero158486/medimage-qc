/// <reference lib="webworker" />

import { analyzePixelBuffer } from "@/lib/image-processing/analyze";
import type { AnalysisSettings, PixelBuffer } from "@/types/analysis";

interface WorkerRequest {
  pixelBuffer: PixelBuffer;
  fileName: string;
  settings: AnalysisSettings;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const result = analyzePixelBuffer(event.data.pixelBuffer, event.data.fileName, event.data.settings);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : "Analysis failed." });
  }
};

export {};
