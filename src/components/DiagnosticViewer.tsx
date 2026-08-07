"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { AnalysisResult, HeatmapData } from "@/types/analysis";

export type DiagnosticMode =
  | "original"
  | "grayscale"
  | "edges"
  | "sharpness"
  | "noise"
  | "contrast"
  | "clipping"
  | "illumination"
  | "frequency";

const MODE_LABELS: Record<DiagnosticMode, string> = {
  original: "Original",
  grayscale: "Grayscale",
  edges: "Edge map",
  sharpness: "Sharpness map",
  noise: "Noise map",
  contrast: "Contrast map",
  clipping: "Exposure clipping",
  illumination: "Illumination field",
  frequency: "Fourier spectrum",
};

export function DiagnosticViewer({
  result,
  mode,
  onModeChange,
}: {
  source: string;
  result: AnalysisResult;
  mode: DiagnosticMode;
  onModeChange: (mode: DiagnosticMode) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [opacity, setOpacity] = useState(0.72);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [pixel, setPixel] = useState<string>("Move over image for pixel intensity");

  const diagnosticCanvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    return buildDiagnosticCanvas(result, mode, opacity);
  }, [result, mode, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || !diagnosticCanvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = stage.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#080b10";
    context.fillRect(0, 0, rect.width, rect.height);

    const fit = Math.min(rect.width / diagnosticCanvas.width, rect.height / diagnosticCanvas.height) * 0.92;
    const drawWidth = diagnosticCanvas.width * fit * zoom;
    const drawHeight = diagnosticCanvas.height * fit * zoom;
    const x = (rect.width - drawWidth) / 2 + offset.x;
    const y = (rect.height - drawHeight) / 2 + offset.y;
    context.imageSmoothingEnabled = mode !== "frequency";
    context.drawImage(diagnosticCanvas, x, y, drawWidth, drawHeight);
  }, [diagnosticCanvas, mode, offset, zoom]);

  const modes = Object.keys(MODE_LABELS) as DiagnosticMode[];

  function handleMove(event: ReactMouseEvent<HTMLCanvasElement>) {
    if (drag) {
      setOffset({ x: drag.ox + event.clientX - drag.x, y: drag.oy + event.clientY - drag.y });
      return;
    }
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const fit = Math.min(rect.width / result.metadata.width, rect.height / result.metadata.height) * 0.92;
    const drawWidth = result.metadata.width * fit * zoom;
    const drawHeight = result.metadata.height * fit * zoom;
    const left = (rect.width - drawWidth) / 2 + offset.x;
    const top = (rect.height - drawHeight) / 2 + offset.y;
    const x = Math.floor(((event.clientX - rect.left - left) / drawWidth) * result.metadata.width);
    const y = Math.floor(((event.clientY - rect.top - top) / drawHeight) * result.metadata.height);
    if (x >= 0 && y >= 0 && x < result.metadata.width && y < result.metadata.height) {
      const value = result.grayscale[y * result.metadata.width + x];
      setPixel(`x ${x} · y ${y} · intensity ${Math.round(value)}`);
    }
  }

  return (
    <section className="viewer-card">
      <div className="viewer-topbar">
        <div className="mode-tabs" role="tablist" aria-label="Diagnostic visualization">
          {modes.map((item) => (
            <button
              key={item}
              className={item === mode ? "active" : ""}
              onClick={() => onModeChange(item)}
              role="tab"
              aria-selected={item === mode}
            >
              {MODE_LABELS[item]}
            </button>
          ))}
        </div>
      </div>
      <div
        className="viewer-stage"
        ref={stageRef}
        onDoubleClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={(event) => setDrag({ x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y })}
          onMouseMove={handleMove}
          onMouseUp={() => setDrag(null)}
          onMouseLeave={() => setDrag(null)}
          aria-label={`${MODE_LABELS[mode]} image viewer`}
        />
      </div>
      <div className="viewer-controls">
        <span>{pixel}</span>
        <label>Zoom
          <input type="range" min="0.7" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        {!["original", "grayscale", "frequency"].includes(mode) && (
          <label>Overlay
            <input type="range" min="0.15" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
          </label>
        )}
        <button className="text-button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Reset</button>
      </div>
      <p className="viewer-caption">{modeDescription(mode)}</p>
    </section>
  );
}

function buildDiagnosticCanvas(result: AnalysisResult, mode: DiagnosticMode, opacity: number): HTMLCanvasElement {
  if (mode === "frequency") return frequencyCanvas(result);
  const { width, height } = result.metadata;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(width, height);

  for (let i = 0; i < width * height; i += 1) {
    const gray = result.grayscale[i];
    const p = i * 4;
    let r = gray;
    let g = gray;
    let b = gray;

    if (mode === "original") {
      r = result.rgba[p];
      g = result.rgba[p + 1];
      b = result.rgba[p + 2];
    } else if (mode === "edges") {
      const edge = result.edgeMap[i];
      [r, g, b] = blend(gray, heatColor(edge / 255), opacity);
    } else if (mode === "clipping") {
      const clip = result.clippingMap[i];
      if (clip < 0) [r, g, b] = blend(gray, [78, 190, 255], opacity);
      if (clip > 0) [r, g, b] = blend(gray, [255, 93, 190], opacity);
    } else if (["sharpness", "noise", "contrast", "illumination"].includes(mode)) {
      const map = result.heatmaps[mode as keyof AnalysisResult["heatmaps"]];
      const value = heatmapValue(map, i % width, Math.floor(i / width), width, height);
      const base: [number, number, number] = [result.rgba[p], result.rgba[p + 1], result.rgba[p + 2]];
      [r, g, b] = blendColor(base, heatColor(value), opacity);
    }

    image.data[p] = clampByte(r);
    image.data[p + 1] = clampByte(g);
    image.data[p + 2] = clampByte(b);
    image.data[p + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

function frequencyCanvas(result: AnalysisResult): HTMLCanvasElement {
  const { size, spectrum } = result.frequency;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(size, size);
  spectrum.forEach((value, index) => {
    const [r, g, b] = heatColor(Math.pow(value, 0.75));
    const p = index * 4;
    image.data[p] = r;
    image.data[p + 1] = g;
    image.data[p + 2] = b;
    image.data[p + 3] = 255;
  });
  context.putImageData(image, 0, 0);
  return canvas;
}

function heatmapValue(map: HeatmapData, x: number, y: number, width: number, height: number): number {
  const column = Math.min(map.columns - 1, Math.floor((x / width) * map.columns));
  const row = Math.min(map.rows - 1, Math.floor((y / height) * map.rows));
  const value = map.values[row * map.columns + column] ?? 0;
  if (map.max <= map.min) return 0;
  return (value - map.min) / (map.max - map.min);
}

function heatColor(t: number): [number, number, number] {
  const value = Math.max(0, Math.min(1, t));
  const stops: Array<[number, number, number]> = [
    [35, 29, 94],
    [47, 107, 179],
    [44, 192, 183],
    [201, 229, 93],
    [255, 187, 61],
  ];
  const scaled = value * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const local = scaled - index;
  return [0, 1, 2].map((channel) => Math.round(stops[index][channel] * (1 - local) + stops[index + 1][channel] * local)) as [number, number, number];
}

function blend(gray: number, color: [number, number, number], opacity: number): [number, number, number] {
  return color.map((channel) => gray * (1 - opacity) + channel * opacity) as [number, number, number];
}

function blendColor(base: [number, number, number], color: [number, number, number], opacity: number): [number, number, number] {
  return color.map((channel, index) => base[index] * (1 - opacity) + channel * opacity) as [number, number, number];
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function modeDescription(mode: DiagnosticMode): string {
  const descriptions: Record<DiagnosticMode, string> = {
    original: "Analysis-resolution preview. The original file remains untouched in memory.",
    grayscale: "Luminance representation used by most technical quality metrics.",
    edges: "Sobel gradient magnitude highlights strong local intensity transitions.",
    sharpness: "Tile-level variance of the Laplacian; brighter regions contain stronger local detail.",
    noise: "Robust high-frequency residual estimate by local tiles.",
    contrast: "Local intensity standard deviation across image tiles.",
    clipping: "Blue marks near-black pixels; magenta marks near-white pixels.",
    illumination: "Low-frequency tile means reveal hotspots, falloff, and vignetting.",
    frequency: "Log-scaled 2D Fourier magnitude spectrum computed on a 64×64 windowed sample.",
  };
  return descriptions[mode];
}
