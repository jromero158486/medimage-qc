import Link from "next/link";

const metrics = [
  ["01", "Sharpness", "Laplacian variance, Tenengrad energy, and local edge density."],
  ["02", "Noise", "Robust residual estimate and approximate image-based SNR."],
  ["03", "Contrast", "RMS contrast, robust intensity span, and local variation."],
  ["04", "Exposure", "Shadow/highlight clipping, saturation, and intensity balance."],
  ["05", "Illumination", "Tile uniformity, center-edge falloff, and vignetting cues."],
  ["06", "Compression", "JPEG 8×8 boundary signal and frequency-domain evidence."],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow accent">Open scientific software · Browser native</span>
          <h1>Inspect image quality <em>before</em> it affects your model or experiment.</h1>
          <p>MedImage QC analyzes blur, noise, contrast, exposure, illumination, and compression artifacts directly in your browser—without uploading the image.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/analyze">Analyze an image <span>→</span></Link>
            <Link className="secondary-button" href="/analyze?demo=true">Try a controlled demo</Link>
          </div>
          <div className="privacy-strip">
            <span>✓ Local pixel processing</span>
            <span>✓ No account</span>
            <span>✓ Exportable audit report</span>
          </div>
          <p className="micro-disclaimer">For research and educational use. Not intended for clinical diagnosis.</p>
        </div>
        <div className="hero-console" aria-label="Example MedImage QC analysis">
          <div className="console-head"><span>phantom_reference.png</span><span className="console-live">● ANALYSIS COMPLETE</span></div>
          <div className="console-body">
            <div className="phantom-preview">
              <div className="phantom-ring ring-a" /><div className="phantom-ring ring-b" /><div className="phantom-ring ring-c" />
              <div className="scan-line" />
              <span>LOCAL SHARPNESS MAP</span>
            </div>
            <div className="console-score">
              <div className="mini-gauge"><strong>82</strong><small>/100</small></div>
              <div><span className="status status-good">Good</span><p>One moderate issue</p></div>
            </div>
            <div className="console-metrics">
              {[['Sharpness', 88], ['Noise', 74], ['Contrast', 79], ['Exposure', 91]].map(([label, value]) => (
                <div key={String(label)}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></div>
              ))}
            </div>
            <div className="console-note"><span>!</span><p><strong>Review local noise.</strong> High-frequency residuals are concentrated near the image edge.</p></div>
          </div>
        </div>
      </section>

      <section className="trust-band">
        <span>CANVAS API</span><span>WEB WORKERS</span><span>FFT 2D</span><span>NO BACKEND</span><span>OPEN SOURCE</span>
      </section>

      <section className="home-section metric-explainer">
        <div className="section-heading wide">
          <div><span className="eyebrow accent">Transparent by design</span><h2>Not one mysterious score.<br />A stack of interpretable signals.</h2></div>
          <p>Each normalized score can be expanded into its measured values, diagnostic visualization, limitations, and recommended next checks.</p>
        </div>
        <div className="home-metric-grid">
          {metrics.map(([number, title, detail]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section workflow-section">
        <div className="workflow-copy">
          <span className="eyebrow accent">Five-second workflow</span>
          <h2>From raw pixels to an auditable quality report.</h2>
          <p>The original image remains untouched. Analysis runs on a bounded-resolution copy and produces a technical report you can preserve with a dataset or experiment.</p>
          <Link className="text-link" href="/methodology">Explore algorithms and limitations →</Link>
        </div>
        <ol className="workflow-list">
          <li><span>01</span><div><strong>Load</strong><p>Drop, choose, or paste a supported image.</p></div></li>
          <li><span>02</span><div><strong>Compute</strong><p>Run deterministic metrics in a browser worker.</p></div></li>
          <li><span>03</span><div><strong>Inspect</strong><p>Explore local maps, clipping, edges, and frequency content.</p></div></li>
          <li><span>04</span><div><strong>Stress test</strong><p>Apply synthetic artifacts and observe metric response.</p></div></li>
          <li><span>05</span><div><strong>Export</strong><p>Download PDF, JSON, or CSV evidence.</p></div></li>
        </ol>
      </section>

      <section className="home-cta">
        <span className="eyebrow">Your pixels never leave the device</span>
        <h2>Open the quality lab.</h2>
        <Link className="primary-button light-button" href="/analyze">Start local analysis →</Link>
      </section>
    </main>
  );
}
