"use client";

import { useEffect, useRef } from "react";
import type { QualityMetric } from "@/types/analysis";

function setup(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, rect.width, rect.height);
  return context;
}

export function HistogramChart({ histogram }: { histogram: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = setup(canvas);
    if (!context) return;
    const { width, height } = canvas.getBoundingClientRect();
    const max = Math.max(1, ...histogram);
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#7e8bff");
    gradient.addColorStop(0.55, "#55e2df");
    gradient.addColorStop(1, "#f1f4f7");
    context.fillStyle = gradient;
    histogram.forEach((value, index) => {
      const barWidth = width / histogram.length;
      const barHeight = (value / max) * (height - 24);
      context.fillRect(index * barWidth, height - barHeight - 16, Math.max(1, barWidth), barHeight);
    });
    context.strokeStyle = "rgba(255,255,255,.25)";
    context.beginPath();
    context.moveTo(0, height - 15.5);
    context.lineTo(width, height - 15.5);
    context.stroke();
  }, [histogram]);
  return <canvas ref={ref} className="chart-canvas" aria-label="Intensity histogram" />;
}

export function FrequencyChart({ values }: { values: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = setup(canvas);
    if (!context) return;
    const { width, height } = canvas.getBoundingClientRect();
    const max = Math.max(1e-8, ...values);
    context.strokeStyle = "#55e2df";
    context.lineWidth = 2;
    context.beginPath();
    values.forEach((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - 18 - (value / max) * (height - 34);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    context.fillStyle = "rgba(85,226,223,.12)";
    context.lineTo(width, height - 18);
    context.lineTo(0, height - 18);
    context.closePath();
    context.fill();
  }, [values]);
  return <canvas ref={ref} className="chart-canvas" aria-label="Radial frequency profile" />;
}

export function MetricBars({ metrics }: { metrics: QualityMetric[] }) {
  return (
    <div className="metric-bars" aria-label="Metric score comparison">
      {metrics.map((metric) => (
        <div className="bar-row" key={metric.id}>
          <span>{metric.name}</span>
          <div className="bar-track"><i style={{ width: `${metric.score}%` }} /></div>
          <strong>{metric.score}</strong>
        </div>
      ))}
    </div>
  );
}
