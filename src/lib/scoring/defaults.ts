import type { AnalysisSettings, MetricId, MetricStatus } from "@/types/analysis";

export const DEFAULT_SETTINGS: AnalysisSettings = {
  darkClipThreshold: 5,
  brightClipThreshold: 250,
  tileSize: 48,
  weights: {
    sharpness: 0.25,
    contrast: 0.15,
    noise: 0.15,
    exposure: 0.15,
    "dynamic-range": 0.1,
    illumination: 0.1,
    compression: 0.1,
  },
};

export const METRIC_LABELS: Record<MetricId, string> = {
  sharpness: "Sharpness",
  noise: "Noise",
  contrast: "Contrast",
  exposure: "Exposure",
  "dynamic-range": "Dynamic range",
  illumination: "Illumination",
  compression: "Compression",
};

export function scoreToStatus(score: number): MetricStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "acceptable";
  if (score >= 35) return "needs-review";
  return "poor";
}

export function statusLabel(status: MetricStatus): string {
  return status === "needs-review"
    ? "Needs review"
    : status.charAt(0).toUpperCase() + status.slice(1);
}
