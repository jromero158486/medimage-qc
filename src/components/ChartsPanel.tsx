"use client";

import { FrequencyChart, HistogramChart, MetricBars } from "@/components/Charts";
import type { AnalysisResult } from "@/types/analysis";

export function ChartsPanel({ result }: { result: AnalysisResult }) {
  return (
    <aside className="charts-column">
      <article className="panel chart-card">
        <div className="chart-title"><div><span className="eyebrow">Intensity distribution</span><h3>Grayscale histogram</h3></div><span>P5–P95: {result.metrics.find((metric) => metric.id === "dynamic-range")?.value}</span></div>
        <HistogramChart histogram={result.histogram} />
      </article>
      <article className="panel chart-card">
        <div className="chart-title"><div><span className="eyebrow">Frequency domain</span><h3>Radial energy profile</h3></div><span>HF ratio: {(result.frequency.highFrequencyRatio * 100).toFixed(1)}%</span></div>
        <FrequencyChart values={result.frequency.radialProfile} />
      </article>
      <article className="panel chart-card">
        <div className="chart-title"><div><span className="eyebrow">Quality vector</span><h3>Normalized metric scores</h3></div><span>{statusLabel(result.category)}</span></div>
        <MetricBars metrics={result.metrics} />
      </article>
      <article className="panel metadata-card">
        <span className="eyebrow">Image metadata</span>
        <dl>
          <div><dt>Dimensions</dt><dd>{result.metadata.width} × {result.metadata.height}</dd></div>
          <div><dt>Aspect ratio</dt><dd>{result.metadata.aspectRatio}</dd></div>
          <div><dt>Color mode</dt><dd>{result.metadata.colorMode}</dd></div>
          <div><dt>Analyzed pixels</dt><dd>{result.metadata.analyzedPixels.toLocaleString()}</dd></div>
          <div><dt>Processing</dt><dd>Local browser worker</dd></div>
        </dl>
      </article>
    </aside>
  );
}

function statusLabel(value: string): string {
  return value === "needs-review" ? "Needs review" : value.charAt(0).toUpperCase() + value.slice(1);
}
