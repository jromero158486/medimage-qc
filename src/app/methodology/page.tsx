const methods = [
  {
    title: "Sharpness and blur",
    formula: "Var(∇²I),  E[Gx² + Gy²]",
    body: "The variance of the discrete Laplacian responds to rapid local intensity changes. Tenengrad uses Sobel gradient energy, while edge density counts sufficiently strong gradients. These values depend on resolution, texture, modality, and preprocessing; they are comparative indicators rather than universal focus thresholds.",
  },
  {
    title: "Image-based noise estimate",
    formula: "σ̂ = 1.4826 · median(|I − mean₃×₃(I)|)",
    body: "A local mean residual isolates high-frequency variation. Its median absolute magnitude provides a robust scale estimate. Anatomical or material texture can also produce high-frequency residuals, so this is not a calibrated physical sensor-noise measurement.",
  },
  {
    title: "Contrast and dynamic range",
    formula: "Cᵣₘₛ = std(I),  ΔP = P₉₅ − P₀₅",
    body: "RMS contrast measures global intensity dispersion. The P5–P95 span is less sensitive to extreme outliers and estimates how much of the available range contains most pixels. A broad range is not automatically desirable for every modality.",
  },
  {
    title: "Exposure and clipping",
    formula: "clip = n(I≤t₀ or I≥t₁) / N",
    body: "Pixels below the configurable dark threshold and above the bright threshold are counted and visualized. Clipping may reflect acquisition saturation, exported windowing, masks, or legitimate backgrounds; context is required.",
  },
  {
    title: "Illumination uniformity",
    formula: "CVtile = std(μtile) / mean(μtile)",
    body: "The image is partitioned into coarse tiles. Variation in tile means and the center-to-edge difference reveal low-frequency falloff, hotspots, or vignetting. Genuine spatial intensity differences may be confounded with illumination.",
  },
  {
    title: "Compression blockiness",
    formula: "B = mean(|ΔI| at 8px boundaries) / mean(|ΔI| elsewhere)",
    body: "JPEG commonly processes 8×8 blocks. Excess discontinuity along these boundaries can indicate compression artifacts. Natural or engineered periodic patterns may produce similar signals.",
  },
  {
    title: "Frequency-domain analysis",
    formula: "F(u,v) = FFT₂{w(x,y)[I(x,y)−μ]}",
    body: "A windowed 64×64 sample is transformed with a two-dimensional FFT. The interface shows the log magnitude spectrum, radial energy profile, and a high-frequency energy ratio. Blur generally suppresses high frequencies; noise often raises them.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="content-page">
      <section className="content-hero">
        <span className="eyebrow accent">Methodology</span>
        <h1>Every score should have a measurable reason.</h1>
        <p>MedImage QC combines complementary no-reference image quality indicators. Its thresholds and score mappings are deliberately visible and must be calibrated before use in a research pipeline.</p>
      </section>
      <section className="method-list">
        {methods.map((method, index) => (
          <article key={method.title}>
            <span className="method-number">{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{method.title}</h2><code>{method.formula}</code><p>{method.body}</p></div>
          </article>
        ))}
      </section>
      <section className="limitations panel">
        <span className="eyebrow">Critical limitations</span>
        <h2>Quality is task-, modality-, and acquisition-dependent.</h2>
        <div className="limitations-grid">
          <p><strong>No clinical validation.</strong> The application does not determine whether an image is diagnostically usable.</p>
          <p><strong>No reference image.</strong> Metrics cannot know the intended appearance or true signal.</p>
          <p><strong>Texture confounding.</strong> Real structure may be interpreted as noise or high-frequency detail.</p>
          <p><strong>Export effects.</strong> Windowing, rescaling, and compression can alter metrics before analysis.</p>
          <p><strong>Resolution dependence.</strong> Sharpness values change with image size and resampling.</p>
          <p><strong>Calibration required.</strong> Thresholds should be validated with domain experts and task-specific outcomes.</p>
        </div>
      </section>
    </main>
  );
}
