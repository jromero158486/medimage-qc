export type MetricStatus =
  | "excellent"
  | "good"
  | "acceptable"
  | "needs-review"
  | "poor";

export type MetricId =
  | "sharpness"
  | "noise"
  | "contrast"
  | "exposure"
  | "dynamic-range"
  | "illumination"
  | "compression";

export interface AnalysisSettings {
  darkClipThreshold: number;
  brightClipThreshold: number;
  tileSize: number;
  weights: Record<MetricId, number>;
}

export interface ImageMetadata {
  fileName: string;
  width: number;
  height: number;
  megapixels: number;
  aspectRatio: number;
  colorMode: "RGB" | "Grayscale-like";
  analyzedPixels: number;
}

export interface HeatmapData {
  rows: number;
  columns: number;
  values: number[];
  min: number;
  max: number;
}

export interface QualityMetric {
  id: MetricId;
  name: string;
  score: number;
  status: MetricStatus;
  value: number;
  unit?: string;
  description: string;
  technicalDetails: Record<string, number | string>;
  recommendations: string[];
}

export interface QualityIssue {
  id: string;
  severity: "low" | "moderate" | "high";
  title: string;
  detail: string;
}

export interface FrequencyAnalysis {
  size: number;
  spectrum: number[];
  radialProfile: number[];
  highFrequencyRatio: number;
}

export interface ColorAnalysis {
  meanR: number;
  meanG: number;
  meanB: number;
  channelImbalance: number;
  histogramR: number[];
  histogramG: number[];
  histogramB: number[];
}

export interface AnalysisResult {
  appVersion: string;
  generatedAt: string;
  overallScore: number;
  category: MetricStatus;
  summary: string;
  reliability: "High" | "Moderate" | "Limited";
  metrics: QualityMetric[];
  issues: QualityIssue[];
  recommendations: string[];
  metadata: ImageMetadata;
  histogram: number[];
  rgba: number[];
  grayscale: number[];
  edgeMap: number[];
  clippingMap: number[];
  heatmaps: {
    sharpness: HeatmapData;
    noise: HeatmapData;
    contrast: HeatmapData;
    illumination: HeatmapData;
  };
  frequency: FrequencyAnalysis;
  color: ColorAnalysis;
  settings: AnalysisSettings;
}

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}
