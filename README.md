# MedImage QC

**Privacy-first technical image quality control for medical and scientific images.**

MedImage QC is a browser-native research and education tool that measures blur, noise, contrast, exposure, dynamic range, illumination uniformity, compression artifacts, and frequency content without uploading the image to a server.

> **Safety:** MedImage QC is not a medical device. It does not determine diagnostic quality, predict disease, or support clinical decision-making. All thresholds are heuristic and require modality-specific validation.

## Why this project exists

Image quality problems can silently influence annotation, computer vision training, quantitative measurements, and reproducibility. Existing quality assurance tools are often modality-specific, proprietary, or difficult to demonstrate outside a laboratory environment. MedImage QC provides an open, inspectable starting point for exploratory quality control.

The complete product brief is preserved in [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md).

## Current MVP

- Drag-and-drop, file picker, and clipboard paste
- PNG, JPEG, and WebP support
- Browser-only processing with a Web Worker and synchronous fallback
- Bounded analysis resolution to keep the interface responsive
- Seven normalized technical quality scores
- Raw measurements and expandable technical details
- Local sharpness, noise, contrast, and illumination maps
- Edge, clipping, grayscale, and Fourier diagnostic views
- Zoom, pan, overlay-opacity control, and pixel-intensity readout
- Intensity histogram and radial frequency profile
- Controlled synthetic image phantoms
- Quality Stress Test for blur, noise, contrast, brightness, vignetting, and JPEG compression
- Local PDF, JSON, and CSV export
- Responsive dark scientific interface
- Unit and Playwright test scaffolding
- GitHub Actions validation workflow

## Algorithms

### Sharpness

- Variance of the discrete Laplacian
- Tenengrad/Sobel gradient energy
- Edge density
- Tile-level Laplacian variance map

### Noise

A robust high-frequency residual estimate:

```text
residual = pixel - local 3×3 mean
sigma ≈ 1.4826 × median(|residual|)
```

The displayed SNR is an image-based approximation, not a calibrated physical SNR.

### Contrast and dynamic range

- RMS intensity contrast
- P5 and P95 intensity percentiles
- P95–P5 robust span
- Tile-level standard deviation map

### Exposure

- Configurable near-black and near-white thresholds
- Shadow clipping
- Highlight clipping
- Mean and median intensity
- Pixel-level clipping overlay

### Illumination

- Coarse tile-mean field
- Tile coefficient of variation
- Center-to-edge intensity difference
- Vignetting and hotspot cues

### Compression

The blockiness estimator compares intensity discontinuities at JPEG 8×8 boundaries with discontinuities elsewhere.

### Frequency domain

A windowed 64×64 grayscale sample is processed with a dependency-free separable 2D FFT. The app displays:

- Log-magnitude spectrum
- Radial frequency profile
- Approximate high-frequency energy ratio

## Composite score

The default score is a documented weighted heuristic:

| Metric | Weight |
|---|---:|
| Sharpness | 25% |
| Contrast | 15% |
| Noise | 15% |
| Exposure | 15% |
| Dynamic range | 10% |
| Illumination | 10% |
| Compression | 10% |

The settings drawer exposes clipping thresholds and local tile size. Weight editing is represented in the data model and can be exposed in a later calibration interface.

## Architecture

```text
Local file / generated phantom
            │
            ▼
Browser image decoder + Canvas
            │
            ▼
Bounded RGBA analysis buffer
            │
            ▼
Web Worker ──► deterministic algorithm modules
            │
            ▼
React analysis workspace
            │
            ├── diagnostic Canvas views
            ├── local charts
            └── PDF / JSON / CSV exports
```

Primary source structure:

```text
src/
  app/
    page.tsx                 Landing page
    analyze/page.tsx         Analysis workspace route
    methodology/page.tsx     Equations, interpretation, limitations
    about/page.tsx           Motivation, privacy, safety
  components/
    AnalysisStudio.tsx       Main state and workflow
    DiagnosticViewer.tsx     Pixel viewer and overlays
    UploadDropzone.tsx       Upload, paste, and demo entry
    MetricCard.tsx           Explainable metric presentation
    Charts.tsx               Dependency-free Canvas charts
  lib/
    image-processing/
      analyze.ts             Deterministic algorithms and scoring inputs
      browser.ts             Browser decode, demos, degradations
    reports/download.ts      PDF, JSON, CSV generation
    scoring/defaults.ts      Weights and status thresholds
  workers/analysis.worker.ts Browser worker
  types/analysis.ts          Strong analysis contracts
```

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer recommended
- Modern browser with Canvas, Web Workers, FileReader, and Blob support

## Installation

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For the browser test:

```bash
npx playwright install chromium
npm run test:e2e
```

## Privacy design

- The MVP has no upload API.
- Pixel buffers are created in the browser.
- Analysis runs in a browser worker when available.
- The original file is not overwritten.
- Refreshing or closing the page clears in-memory state.
- Export happens only after an explicit user action.
- No image-derived analytics events are implemented.

Be aware that exported reports contain the filename and derived metadata. Handle them according to the sensitivity of the source data.

## Known limitations

1. **No clinical or modality-specific validation.** Scores are exploratory.
2. **No reference image.** The tool cannot know the intended ground truth appearance.
3. **Texture confounding.** Real structure can resemble noise or compression energy.
4. **Resolution sensitivity.** Sharpness values change after resampling.
5. **Color science is limited.** The MVP reports RGB channel balance but does not yet implement calibrated CIELAB or ICC workflows.
6. **PDF is intentionally lightweight.** The dependency-free report is text-forward and does not yet embed diagnostic images.
7. **DICOM, TIFF, and NIfTI are not yet implemented.** The interface does not pretend otherwise.
8. **Single-image workflow.** Dataset-level QC and outlier ranking remain future work.

## Planned extensions

- DICOM pixel decoding and metadata inspection
- TIFF and higher bit-depth support
- NIfTI volume support
- Batch dataset QC and outlier discovery
- User-defined modality profiles
- Calibrated threshold studies
- Duplicate and near-duplicate detection
- Local ONNX artifact classifiers
- Registration-based before/after comparison
- Embedded visual maps in PDF reports
- Research audit trails

## Deployment

### Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Keep the default Next.js build settings.
4. No environment variables are required for the MVP.

### Other Node hosts

```bash
npm run build
npm run start
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Algorithm changes should include a synthetic test demonstrating the expected directional behavior.

## License

MIT. See [`LICENSE`](LICENSE).
