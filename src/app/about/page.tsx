import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="content-page">
      <section className="content-hero">
        <span className="eyebrow accent">About the project</span>
        <h1>Quality control should be accessible, explainable, and private.</h1>
        <p>MedImage QC is an open computer vision project for inspecting technical image quality before data enters an experiment, annotation workflow, or model-development pipeline.</p>
        <Link href="/analyze" className="primary-button">Open the analyzer →</Link>
      </section>
      <section className="about-grid">
        <article className="panel"><span className="about-icon">◎</span><h2>Local first</h2><p>Images are decoded and analyzed in the browser. The MVP has no image-upload endpoint, database, authentication layer, or analytics event containing pixels.</p></article>
        <article className="panel"><span className="about-icon">∑</span><h2>Inspectable</h2><p>The normalized score is accompanied by raw values, formulas, diagnostic maps, recommendations, and explicit interpretation boundaries.</p></article>
        <article className="panel"><span className="about-icon">↯</span><h2>Interactive</h2><p>The Quality Stress Test lets users introduce blur, noise, vignetting, contrast loss, brightness shifts, and JPEG compression to observe metric behavior.</p></article>
        <article className="panel"><span className="about-icon">⌁</span><h2>Extensible</h2><p>The algorithm layer is independent of React components, making room for DICOM, TIFF, batch QC, dataset outliers, ONNX artifact models, and modality-specific profiles.</p></article>
      </section>
      <section className="privacy-architecture">
        <div><span className="eyebrow accent">Privacy architecture</span><h2>A deliberately small data surface.</h2></div>
        <div className="architecture-flow">
          <span>Local file</span><i>→</i><span>Browser decoder</span><i>→</i><span>Bounded pixel buffer</span><i>→</i><span>Web Worker</span><i>→</i><span>Local report</span>
        </div>
        <p>Closing or refreshing the page clears the in-memory analysis unless the user explicitly exports the results. Generated reports should still be handled according to the sensitivity of the filename and derived metadata.</p>
      </section>
      <section className="ethics-note panel">
        <span className="eyebrow">Safety statement</span>
        <h2>This is not a medical device.</h2>
        <p>MedImage QC must not be used to diagnose disease, determine clinical suitability, replace modality-specific quality assurance, or make patient-care decisions. Research use requires independent validation and appropriate data governance.</p>
      </section>
    </main>
  );
}
