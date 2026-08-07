"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyzePixelBuffer } from "@/lib/image-processing/analyze";
import {
  degradeImage,
  generateDemo,
  loadDataUrl,
  loadImageFile,
  type DegradationKind,
  type DemoKind,
  type LoadedImage,
} from "@/lib/image-processing/browser";
import { downloadCsv, downloadJson, downloadPdf } from "@/lib/reports/download";
import { DEFAULT_SETTINGS, METRIC_LABELS, statusLabel } from "@/lib/scoring/defaults";
import type { AnalysisResult, AnalysisSettings, MetricId } from "@/types/analysis";
import { ChartsPanel } from "@/components/ChartsPanel";
import { DiagnosticViewer, type DiagnosticMode } from "@/components/DiagnosticViewer";
import { MetricCard } from "@/components/MetricCard";
import { ScoreGauge } from "@/components/ScoreGauge";
import { UploadDropzone } from "@/components/UploadDropzone";

const STEPS = [
  "Reading image",
  "Preparing pixels",
  "Measuring sharpness",
  "Estimating noise",
  "Analyzing exposure",
  "Computing illumination",
  "Generating visualizations",
  "Finalizing report",
];

const DIAGNOSTIC_FOR_METRIC: Partial<Record<MetricId, DiagnosticMode>> = {
  sharpness: "sharpness",
  noise: "noise",
  contrast: "contrast",
  exposure: "clipping",
  illumination: "illumination",
  compression: "frequency",
};

export function AnalysisStudio({ startWithDemo = false }: { startWithDemo?: boolean }) {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<DiagnosticMode>("original");
  const [settings, setSettings] = useState<AnalysisSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "visuals" | "stress">("overview");
  const [degradation, setDegradation] = useState<DegradationKind>("blur");
  const [strength, setStrength] = useState(0.45);
  const [degraded, setDegraded] = useState<{ image: LoadedImage; result: AnalysisResult } | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDemoStarted = useRef(false);

  const runAnalysis = useCallback(async (image: LoadedImage, nextSettings = settings) => {
    setError(null);
    setProcessing(true);
    setProgress(4);
    setResult(null);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress((value) => Math.min(91, value + Math.max(2, Math.round((96 - value) / 8))));
    }, 130);

    try {
      const analysis = await analyzeInWorker(image, nextSettings);
      setResult(analysis);
      setProgress(100);
      setLoaded(image);
      setMode("original");
    } catch (workerError) {
      try {
        const fallback = analyzePixelBuffer(image.pixelBuffer, image.name, nextSettings);
        setResult(fallback);
        setProgress(100);
        setLoaded(image);
      } catch (fallbackError) {
        setError(fallbackError instanceof Error ? fallbackError.message : String(workerError));
      }
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setTimeout(() => setProcessing(false), 220);
    }
  }, [settings]);

  const handleFile = useCallback(async (file: File) => {
    try {
      const image = await loadImageFile(file);
      await runAnalysis(image);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be opened.");
    }
  }, [runAnalysis]);

  const handleDemo = useCallback(async (kind: DemoKind) => {
    try {
      const image = await loadDataUrl(generateDemo(kind), `${kind}-phantom.png`);
      await runAnalysis(image);
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : "The demo could not be generated.");
    }
  }, [runAnalysis]);

  useEffect(() => {
    function paste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) void handleFile(file);
    }
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, [handleFile]);

  useEffect(() => {
    if (startWithDemo && !loaded && !processing && !autoDemoStarted.current) {
      autoDemoStarted.current = true;
      void handleDemo("sharp");
    }
  }, [handleDemo, loaded, processing, startWithDemo]);

  useEffect(() => {
    if (!loaded || !result || activeTab !== "stress") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const dataUrl = await degradeImage(loaded.dataUrl, degradation, strength);
        const image = await loadDataUrl(dataUrl, `${degradation}-${Math.round(strength * 100)}.png`);
        const analysis = await analyzeInWorker(image, settings);
        if (!cancelled) setDegraded({ image, result: analysis });
      } catch {
        if (!cancelled) setDegraded(null);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, degradation, loaded, result, settings, strength]);

  const progressStep = STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))];
  const weakest = useMemo(() => result ? [...result.metrics].sort((a, b) => a.score - b.score)[0] : null, [result]);

  if (!loaded && !processing) {
    return (
      <main className="analyze-page empty-analysis">
        <div className="analysis-intro">
          <span className="eyebrow accent">Interactive quality lab</span>
          <h1>Inspect the technical quality of an image.</h1>
          <p>Every metric and diagnostic map is computed from the pixels in your browser. No image upload, account, or backend is required.</p>
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <UploadDropzone onFile={handleFile} onDemo={handleDemo} />
      </main>
    );
  }

  if (processing || !result || !loaded) {
    return (
      <main className="processing-screen">
        <div className="processing-orbit"><span>{progress}%</span></div>
        <span className="eyebrow accent">Local analysis</span>
        <h1>{progressStep}</h1>
        <p>Computing deterministic metrics and diagnostic maps from the analysis-resolution pixels.</p>
        <div className="wide-progress"><span style={{ width: `${progress}%` }} /></div>
      </main>
    );
  }

  return (
    <main className="workspace">
      <section className="workspace-heading">
        <div>
          <span className="eyebrow accent">Analysis workspace</span>
          <h1>{result.metadata.fileName}</h1>
          <p>{result.metadata.width} × {result.metadata.height} analysis pixels · {result.metadata.colorMode} · {result.metadata.megapixels} MP</p>
        </div>
        <div className="workspace-actions">
          <button className="secondary-button" onClick={() => setShowSettings(true)}>Settings</button>
          <div className="export-menu">
            <button className="primary-button">Export report ▾</button>
            <div className="export-popover">
              <button onClick={() => downloadPdf(result)}>PDF report</button>
              <button onClick={() => downloadJson(result)}>JSON results</button>
              <button onClick={() => downloadCsv(result)}>CSV metrics</button>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-tabs" role="tablist">
        {(["overview", "visuals", "stress"] as const).map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab === "overview" ? "Quality overview" : tab === "visuals" ? "Diagnostics" : "Quality Stress Test"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <section className="overview-grid">
            <article className="summary-card panel">
              <div className="summary-top">
                <ScoreGauge score={result.overallScore} status={result.category} />
                <div className="summary-facts">
                  <div><span>Detected issues</span><strong>{result.issues.length}</strong></div>
                  <div><span>Reliability</span><strong>{result.reliability}</strong></div>
                  <div><span>Weakest metric</span><strong>{weakest?.name}</strong></div>
                </div>
              </div>
              <div className="technical-summary">
                <span className="eyebrow">Technical summary</span>
                <p>{result.summary}</p>
              </div>
              <details className="formula-disclosure">
                <summary>How the composite score is calculated</summary>
                <p>The score is a weighted heuristic, not a universal imaging standard.</p>
                <div className="weight-list">
                  {(Object.entries(result.settings.weights) as Array<[MetricId, number]>).map(([id, weight]) => (
                    <span key={id}>{METRIC_LABELS[id as MetricId]} <strong>{Math.round(weight * 100)}%</strong></span>
                  ))}
                </div>
              </details>
            </article>
            <article className="panel issue-panel">
              <span className="eyebrow">Priority findings</span>
              {result.issues.length ? result.issues.slice(0, 4).map((issue) => (
                <div className={`issue-row severity-${issue.severity}`} key={issue.id}>
                  <span aria-hidden="true">{issue.severity === "high" ? "!" : issue.severity === "moderate" ? "•" : "i"}</span>
                  <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
                </div>
              )) : <div className="empty-findings">No major issue under current thresholds.</div>}
            </article>
          </section>

          <section className="metric-section">
            <div className="section-heading">
              <div><span className="eyebrow accent">Metric stack</span><h2>Seven complementary quality signals</h2></div>
              <p>Expand any card to inspect the measured values behind its normalized score.</p>
            </div>
            <div className="metric-grid">
              {result.metrics.map((metric) => (
                <MetricCard
                  metric={metric}
                  key={metric.id}
                  onVisualize={DIAGNOSTIC_FOR_METRIC[metric.id] ? () => {
                    setMode(DIAGNOSTIC_FOR_METRIC[metric.id] ?? "original");
                    setActiveTab("visuals");
                  } : undefined}
                />
              ))}
            </div>
          </section>

          <section className="recommendation-grid">
            <article className="panel">
              <span className="eyebrow">Recommendations</span>
              <ol className="recommendation-list">
                {result.recommendations.length ? result.recommendations.map((item, index) => (
                  <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
                )) : <li><span>✓</span><p>No specific corrective action was generated.</p></li>}
              </ol>
            </article>
            <article className="panel disclaimer-panel">
              <span className="eyebrow">Interpretation boundary</span>
              <h3>Technical quality is not diagnostic quality.</h3>
              <p>A visually improved image may alter quantitative information. Preserve the original, document preprocessing, and calibrate thresholds for each modality and acquisition system.</p>
              <a href="/methodology" className="text-link">Read methodology and limitations →</a>
            </article>
          </section>
        </>
      )}

      {activeTab === "visuals" && (
        <section className="diagnostic-layout">
          <DiagnosticViewer source={loaded.dataUrl} result={result} mode={mode} onModeChange={setMode} />
          <ChartsPanel result={result} />
        </section>
      )}

      {activeTab === "stress" && (
        <section className="stress-layout">
          <article className="panel stress-controls">
            <span className="eyebrow accent">Controlled degradation</span>
            <h2>Observe how quality metrics respond.</h2>
            <p>Apply a synthetic artifact to the current image. This educational sandbox never overwrites the original.</p>
            <label>Degradation
              <select value={degradation} onChange={(event) => setDegradation(event.target.value as DegradationKind)}>
                <option value="blur">Gaussian-like blur</option>
                <option value="noise">Gaussian noise</option>
                <option value="contrast">Contrast reduction</option>
                <option value="brightness">Brightness shift</option>
                <option value="vignette">Vignetting</option>
                <option value="jpeg">JPEG compression</option>
              </select>
            </label>
            <label>Strength <strong>{Math.round(strength * 100)}%</strong>
              <input type="range" min="0.05" max="1" step="0.05" value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
            </label>
            <div className="stress-warning">Image enhancement or degradation can change scientific measurements. Always retain the original.</div>
          </article>
          <article className="panel stress-result">
            <div className="compare-images">
              <figure><img src={loaded.dataUrl} alt="Original input" /><figcaption>Original · {result.overallScore}/100</figcaption></figure>
              <figure>{degraded ? <img src={degraded.image.dataUrl} alt="Synthetically degraded" /> : <div className="loading-tile" />}<figcaption>Degraded · {degraded?.result.overallScore ?? "—"}/100</figcaption></figure>
            </div>
            {degraded && (
              <div className="comparison-table">
                <div className="comparison-head"><span>Metric</span><span>Original</span><span>Degraded</span><span>Δ</span></div>
                {result.metrics.map((metric) => {
                  const next = degraded.result.metrics.find((item) => item.id === metric.id);
                  const delta = (next?.score ?? 0) - metric.score;
                  return <div key={metric.id}><span>{metric.name}</span><span>{metric.score}</span><span>{next?.score}</span><strong className={delta < 0 ? "delta-negative" : "delta-positive"}>{delta > 0 ? "+" : ""}{delta}</strong></div>;
                })}
              </div>
            )}
          </article>
        </section>
      )}

      <section className="replace-section">
        <UploadDropzone compact onFile={handleFile} onDemo={handleDemo} />
      </section>

      {showSettings && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowSettings(false)}>
          <aside className="settings-drawer" role="dialog" aria-modal="true" aria-label="Analysis settings" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head"><div><span className="eyebrow accent">Calibration</span><h2>Analysis settings</h2></div><button onClick={() => setShowSettings(false)} aria-label="Close settings">×</button></div>
            <p>These defaults are heuristic starting points. Validate them for your modality and acquisition protocol.</p>
            <label>Dark clipping threshold <strong>{settings.darkClipThreshold}</strong>
              <input type="range" min="0" max="25" value={settings.darkClipThreshold} onChange={(event) => setSettings({ ...settings, darkClipThreshold: Number(event.target.value) })} />
            </label>
            <label>Bright clipping threshold <strong>{settings.brightClipThreshold}</strong>
              <input type="range" min="230" max="255" value={settings.brightClipThreshold} onChange={(event) => setSettings({ ...settings, brightClipThreshold: Number(event.target.value) })} />
            </label>
            <label>Local tile size <strong>{settings.tileSize}px</strong>
              <input type="range" min="24" max="96" step="8" value={settings.tileSize} onChange={(event) => setSettings({ ...settings, tileSize: Number(event.target.value) })} />
            </label>
            <div className="drawer-actions">
              <button className="secondary-button" onClick={() => setSettings(DEFAULT_SETTINGS)}>Reset defaults</button>
              <button className="primary-button" onClick={() => { setShowSettings(false); void runAnalysis(loaded, settings); }}>Re-run analysis</button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

async function analyzeInWorker(image: LoadedImage, settings: AnalysisSettings): Promise<AnalysisResult> {
  if (typeof Worker === "undefined") return analyzePixelBuffer(image.pixelBuffer, image.name, settings);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/analysis.worker.ts", import.meta.url), { type: "module" });
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Worker timed out."));
    }, 30_000);
    worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: AnalysisResult; error?: string }>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok && event.data.result) resolve(event.data.result);
      else reject(new Error(event.data.error ?? "Worker analysis failed."));
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error("Worker initialization failed."));
    };
    worker.postMessage({ pixelBuffer: image.pixelBuffer, fileName: image.name, settings });
  });
}
