You are a senior full-stack engineer, computer vision engineer, medical imaging researcher, and product designer.

Build a complete, polished, production-quality web application called **MedImage QC**.

## 1. Product objective

MedImage QC is an interactive web-based image quality assessment tool for medical and scientific images.

Users should be able to upload an image and immediately receive:

* Quantitative image-quality metrics
* Visual diagnostic maps
* An overall quality score
* Explanations of detected quality issues
* Practical recommendations for improving image acquisition
* A downloadable quality-control report

The application is for:

* Research
* Education
* Dataset curation
* Image acquisition quality control
* Computer vision demonstrations

It must clearly state that it is **not a diagnostic medical device** and must not make disease predictions or clinical diagnoses.

All image processing must happen locally in the browser whenever possible. Uploaded images must not be sent to a server.

---

# 2. Technology stack

Use the following stack:

* Next.js 15 or the latest stable Next.js version
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide React icons
* Framer Motion for subtle animations
* Recharts for plots and charts
* OpenCV.js for image-processing operations when useful
* Native Canvas API for pixel-level operations
* Web Workers for expensive processing
* jsPDF or a similar browser library for report generation
* Vitest or Jest for unit tests
* Playwright for at least one end-to-end test

Do not require a backend for the main demo.

The app must run with:

```bash
npm install
npm run dev
```

It must also build successfully with:

```bash
npm run build
```

---

# 3. Design direction

Create a premium, scientific, dark-mode interface inspired by modern research software and medical-imaging workstations.

Visual direction:

* Near-black background
* White and soft-gray typography
* Subtle cyan, blue, or violet accents
* Fine grid lines
* Glass-like panels used sparingly
* High contrast and excellent readability
* Smooth but restrained animations
* Professional, research-oriented appearance
* No cartoonish visuals
* No excessive gradients
* No generic SaaS dashboard appearance

The interface should feel like a combination of:

* A medical imaging viewer
* A modern scientific instrument
* A high-quality computer vision research demo

Use generous spacing and clear visual hierarchy.

The application must be fully responsive for:

* Desktop
* Tablet
* Mobile

Desktop should provide the richest experience.

---

# 4. Main user flow

The main experience should follow this flow:

1. User opens the landing page.
2. User sees a short explanation and an interactive upload area.
3. User uploads an image or selects a built-in demo image.
4. The application processes the image locally.
5. The interface shows:

   * Original image
   * Quality score
   * Detected issues
   * Individual metrics
   * Visual analysis maps
   * Histograms and frequency-domain analysis
   * Recommendations
6. User can modify analysis parameters.
7. The analysis updates.
8. User can download a PDF report or JSON results.

The user should understand the main result within five seconds.

---

# 5. Supported files

Initially support:

* PNG
* JPEG
* JPG
* WebP

Optionally support:

* TIFF, if it can be implemented reliably in the browser
* DICOM files using a lightweight browser-compatible DICOM library

DICOM support may be marked as experimental, but standard image support must work completely.

Validate:

* File type
* Maximum file size
* Image dimensions
* Corrupted or unreadable files

Show clear error messages.

---

# 6. Landing page

Create a compelling landing section with:

## Header

Logo text:

**MedImage QC**

Navigation:

* Analyze
* Metrics
* How It Works
* About
* GitHub

Include a small badge:

**Local processing · No upload**

## Hero content

Headline:

**Inspect image quality before it affects your model or experiment.**

Supporting text:

“MedImage QC analyzes blur, noise, contrast, exposure, illumination, compression artifacts, and other common image-quality problems directly in your browser.”

Primary button:

**Analyze an image**

Secondary button:

**Try a demo**

Add a small disclaimer:

“For research and educational use. Not intended for clinical diagnosis.”

## Hero visualization

Include an elegant mock analysis panel showing:

* Image preview
* Quality score
* Blur indicator
* Contrast indicator
* Noise indicator
* Exposure indicator

The hero visualization should feel interactive rather than being a static marketing illustration.

---

# 7. Upload experience

Create a large drag-and-drop upload area.

It should support:

* Drag and drop
* Click to select
* Paste image from clipboard
* Loading a built-in demo image

Show:

* Accepted formats
* Privacy note
* File-size limitation
* Local processing badge

After selecting an image, show:

* Filename
* Image dimensions
* File size
* Color mode
* Upload replacement button
* Remove button

Provide at least three built-in demo images or procedurally generated examples:

1. A sharp image
2. A blurred image
3. A low-contrast or noisy image

Avoid copyrighted clinical images. Generate synthetic scientific or phantom-like images programmatically or include clearly reusable assets.

---

# 8. Analysis workspace

Create a dashboard with the following layout.

## Left side

Interactive image viewer.

Features:

* Fit to screen
* Zoom in and out
* Pan
* Reset view
* Fullscreen
* Pixel-coordinate display
* Pixel-intensity display
* Before/after comparison
* Optional grayscale view
* Optional inverted grayscale view
* Image metadata panel

## Right side

Summary panel containing:

* Overall quality score from 0 to 100
* Quality category:

  * Excellent
  * Good
  * Acceptable
  * Needs Review
  * Poor
* Number of detected issues
* Most important issue
* Confidence or reliability indicator
* Short plain-language summary

Example:

“Moderate blur and low global contrast were detected. The image may be unsuitable for fine-structure analysis without enhancement or reacquisition.”

Do not imply clinical suitability. Phrase findings as technical image-quality observations.

---

# 9. Overall quality score

Implement a transparent quality-score system.

The score should combine normalized metrics such as:

* Sharpness
* Noise
* Contrast
* Exposure
* Dynamic range
* Illumination uniformity
* Compression artifacts

Use documented weights.

Example initial weights:

* Sharpness: 25%
* Contrast: 15%
* Noise: 15%
* Exposure: 15%
* Dynamic range: 10%
* Illumination uniformity: 10%
* Compression artifacts: 10%

The score must not be presented as universally valid.

Include a tooltip:

“This composite score is a heuristic summary intended for comparison and quality-control workflows. Thresholds may need calibration for each imaging modality.”

Allow users to expand a “How this score is calculated” section.

Show the formula, normalized metric values, weights, and penalties.

---

# 10. Required image-quality metrics

Implement each metric using actual image-processing code. Do not use fake values.

## 10.1 Blur and sharpness

Calculate:

* Variance of the Laplacian
* Tenengrad sharpness
* Edge density

Show:

* Numeric values
* Quality interpretation
* Edge map
* Local sharpness heatmap

The local sharpness map should divide the image into tiles and calculate sharpness for each region.

Detect:

* Global blur
* Localized blur
* Possible motion blur

Optional advanced feature:

Estimate motion-blur direction using frequency-domain patterns or directional gradients.

## 10.2 Noise

Estimate image noise using one or more robust approaches:

* High-pass residual estimation
* Median-filter residual
* Wavelet-inspired approximation
* Background-region estimation where possible

Report:

* Estimated noise standard deviation
* Approximate signal-to-noise ratio
* Local noise heatmap
* Noise interpretation

Do not claim exact physical SNR unless acquisition parameters are known. Label it as an image-based estimate.

## 10.3 Contrast

Calculate:

* RMS contrast
* Michelson contrast when appropriate
* Intensity standard deviation
* Percentile contrast using P5 and P95
* Local contrast distribution

Show:

* Global histogram
* Local contrast heatmap
* Dynamic-range utilization

Detect:

* Low contrast
* Excessive contrast
* Narrow intensity range

## 10.4 Exposure and clipping

Calculate:

* Percentage of near-black pixels
* Percentage of near-white pixels
* Shadow clipping
* Highlight clipping
* Mean intensity
* Median intensity
* Intensity percentiles

Detect:

* Underexposure
* Overexposure
* Bimodal or highly skewed intensity distribution
* Saturation

Show clipped pixels as an overlay.

## 10.5 Illumination uniformity

Estimate low-frequency illumination using:

* Large Gaussian blur
* Polynomial-like background approximation
* Morphological background estimation

Show:

* Illumination field
* Corrected preview
* Uniformity score
* Center-to-edge intensity behavior

Detect:

* Vignetting
* Uneven illumination
* Bright hotspots
* Dark corners

## 10.6 Compression artifacts

Estimate:

* Blockiness at JPEG 8×8 boundaries
* Ringing or high-frequency artifacts
* Excessive compression indicators

Show:

* Block-boundary map
* Artifact score
* Explanation

Only show this metric when meaningful.

## 10.7 Spatial resolution indicators

Report:

* Image dimensions
* Megapixels
* Aspect ratio
* Downsampling warning
* Small-image warning

Do not infer real-world spatial resolution unless pixel spacing is available.

## 10.8 Color analysis

For color images calculate:

* RGB channel histograms
* HSV summary
* CIELAB summary where possible
* White-balance deviation
* Channel clipping
* Color cast estimate
* Channel imbalance

Show:

* Per-channel histogram
* Average channel values
* Neutrality indicator
* Color-cast visualization

For grayscale images, hide irrelevant color metrics gracefully.

## 10.9 Frequency-domain analysis

Compute and display:

* 2D Fourier magnitude spectrum
* Radial frequency profile
* High-frequency energy ratio
* Low-frequency dominance

Explain how frequency content relates to:

* Blur
* Noise
* Repetitive patterns
* Compression artifacts

Use logarithmic scaling for Fourier visualization.

---

# 11. Visual diagnostic modes

Create tabs or selectable overlays for:

* Original
* Grayscale
* Edge map
* Sharpness heatmap
* Noise heatmap
* Local contrast heatmap
* Exposure clipping
* Illumination field
* Corrected illumination preview
* Fourier spectrum
* Compression map

Each mode must include:

* A short explanation
* A color legend where applicable
* An option to adjust overlay opacity
* A reset button

Use a perceptually clear heatmap. Avoid relying only on red and green because of accessibility concerns.

---

# 12. Metric cards

Each quality metric should have a card containing:

* Metric name
* Score from 0 to 100
* Status badge
* Main numeric value
* Short explanation
* Expandable technical details
* Visualization shortcut
* Recommendation

Example:

**Sharpness — 42/100 — Needs Review**

“Fine structures appear softened. The variance of the Laplacian is below the current threshold.”

Technical details:

* Laplacian variance: 68.2
* Tenengrad score: 11.4
* Edge density: 4.9%

Recommendation:

“Check focus, motion, and acquisition stability. If reacquisition is impossible, apply enhancement cautiously and document the transformation.”

---

# 13. Recommendations engine

Create a rule-based recommendations engine.

Recommendations should be generated based on detected quality problems.

Examples:

## Blur

* Verify camera or scanner focus.
* Stabilize the imaging device.
* Reduce motion during acquisition.
* Avoid aggressive sharpening without preserving the original image.

## Noise

* Increase exposure or signal averaging when appropriate.
* Review sensor settings.
* Consider denoising while keeping the original data.
* Validate whether denoising removes fine structures.

## Low contrast

* Review acquisition windowing.
* Check illumination and staining consistency.
* Consider contrast normalization for visualization.
* Avoid using enhanced images as raw measurement data without documentation.

## Uneven illumination

* Use flat-field correction.
* Check light-source alignment.
* Calibrate the imaging system.
* Avoid interpreting intensity differences before background correction.

Recommendations must be technical, cautious, and non-diagnostic.

---

# 14. Parameter controls

Create an advanced settings drawer.

Allow the user to modify:

* Blur threshold
* Noise threshold
* Dark clipping threshold
* Bright clipping threshold
* Tile size for local analysis
* Heatmap smoothing
* Illumination correction scale
* Metric weights
* Quality-category cutoffs

Include:

* Reset to defaults
* Export configuration
* Import configuration
* Modality presets

Initial presets:

* General Medical Image
* Histology
* Microscopy
* Radiograph
* Smartphone Clinical Photo
* Scientific Imaging

Presets should only adjust technical thresholds. Add a note explaining that presets are starting points and require validation.

---

# 15. Comparison mode

Allow the user to compare two images.

Examples:

* Original vs. enhanced
* Original vs. compressed
* Acquisition A vs. acquisition B
* Before vs. after preprocessing

Comparison view must include:

* Synchronized zoom and pan
* Side-by-side mode
* Swipe slider mode
* Metric comparison table
* Score differences
* Change indicators
* Downloadable comparison report

Do not automatically conclude that the processed image is scientifically better only because its visual score increased.

Show this warning:

“Image enhancement can improve visual appearance while altering quantitative information. Preserve and document the original image.”

---

# 16. Interactive degradation laboratory

Add a section called:

**Quality Stress Test**

Let users simulate common degradations:

* Gaussian blur
* Motion blur
* Gaussian noise
* Salt-and-pepper noise
* Brightness change
* Contrast reduction
* JPEG compression
* Downsampling
* Vignetting

Provide sliders for degradation strength.

The user should see:

* Original image
* Degraded image
* Updated quality metrics
* Change in total score
* Metric-response graph

This section should help users learn how metrics behave.

Processing should update interactively without freezing the UI.

---

# 17. Charts

Include the following charts:

* Intensity histogram
* RGB channel histogram
* Metric radar chart
* Metric bar chart
* Radial frequency profile
* Local-quality distribution
* Before/after metric comparison

Charts must have:

* Tooltips
* Responsive resizing
* Accessible labels
* Download as PNG option where practical

Do not overload the main page. Use tabs and progressive disclosure.

---

# 18. Report generation

Provide a button:

**Download QC Report**

Generate a polished PDF report locally.

The report should include:

* MedImage QC title
* Date and time
* Image filename
* Image dimensions
* Thumbnail
* Overall score
* Metric table
* Detected issues
* Recommendations
* Selected visual maps
* Threshold configuration
* Disclaimer

Also allow:

* Download results as JSON
* Download metrics as CSV
* Download selected visualization as PNG

The JSON must contain:

```json
{
  "appVersion": "",
  "analysisTimestamp": "",
  "file": {},
  "overallScore": 0,
  "qualityCategory": "",
  "metrics": {},
  "issues": [],
  "recommendations": [],
  "settings": {}
}
```

---

# 19. Privacy and safety

Clearly communicate:

* Images are processed locally in the browser.
* Images are not uploaded by the application.
* Refreshing or closing the page clears the analysis unless the user explicitly saves it.
* The tool is not intended for diagnosis or clinical decision-making.
* The score is heuristic and modality-dependent.
* Results should be validated before use in research pipelines.

Create a privacy section explaining the client-side processing architecture.

Do not add analytics that capture uploaded image data.

---

# 20. Accessibility

Implement:

* Keyboard navigation
* Visible focus states
* Sufficient contrast
* Screen-reader labels
* Accessible chart descriptions
* Colorblind-safe status indicators
* Text labels in addition to color
* Reduced-motion support
* Responsive font sizes

Do not communicate quality status using color alone.

---

# 21. Performance

Image processing may be computationally expensive.

Implement:

* Web Workers
* Progressive processing
* Loading states for each metric
* Processing cancellation
* Image resizing for analysis while preserving the original
* Maximum analysis resolution
* Separate preview and analysis resolutions
* Memoization where useful
* Debounced slider updates
* Lazy-loaded advanced visualizations

Show a progress indicator such as:

* Reading image
* Preparing pixels
* Measuring sharpness
* Estimating noise
* Analyzing exposure
* Computing illumination
* Generating visualizations
* Finalizing report

The UI must remain responsive.

---

# 22. Suggested architecture

Use a clean project structure similar to:

```text
src/
  app/
    page.tsx
    analyze/
      page.tsx
    about/
      page.tsx
    methodology/
      page.tsx
  components/
    layout/
    upload/
    viewer/
    metrics/
    charts/
    reports/
    settings/
    stress-test/
    ui/
  lib/
    image-processing/
      sharpness.ts
      noise.ts
      contrast.ts
      exposure.ts
      illumination.ts
      compression.ts
      color.ts
      frequency.ts
      heatmaps.ts
      normalization.ts
    scoring/
      score.ts
      presets.ts
      recommendations.ts
    reports/
      pdf.ts
      csv.ts
      json.ts
    workers/
  types/
  hooks/
  public/
```

Keep algorithms independent from React components.

Use strongly typed interfaces.

---

# 23. Core data types

Create clear TypeScript types such as:

```ts
type MetricStatus =
  | "excellent"
  | "good"
  | "acceptable"
  | "needs-review"
  | "poor";

interface QualityMetric {
  id: string;
  name: string;
  score: number;
  status: MetricStatus;
  value: number;
  unit?: string;
  description: string;
  technicalDetails: Record<string, number | string>;
  recommendations: string[];
}

interface AnalysisResult {
  overallScore: number;
  category: MetricStatus;
  metrics: QualityMetric[];
  issues: QualityIssue[];
  recommendations: string[];
  metadata: ImageMetadata;
  generatedAt: string;
}
```

Use discriminated unions where useful.

---

# 24. Algorithm documentation

Create a methodology page that explains:

* What each metric measures
* Formula or algorithm
* Limitations
* Threshold assumptions
* Interpretation risks
* Why metrics are modality-dependent

Include equations where useful.

Examples:

## Variance of Laplacian

Calculate the Laplacian response and use its variance as a focus indicator.

## RMS contrast

```text
RMS contrast = standard deviation of normalized pixel intensities
```

## Clipping

```text
dark clipping = pixels below dark threshold / total pixels
bright clipping = pixels above bright threshold / total pixels
```

## Uniformity

Compare the estimated illumination field across image regions.

Explain that thresholds are heuristics and not clinical standards.

---

# 25. Testing

Add meaningful tests.

Unit tests should cover:

* Laplacian variance
* Histogram generation
* Exposure clipping
* Contrast metrics
* Score normalization
* Quality-category assignment
* Recommendation rules

Use small synthetic images with expected behavior:

* Constant image
* Checkerboard
* Gradient
* Blurred checkerboard
* Noisy image
* Clipped image

Add at least one Playwright test that:

1. Opens the app
2. Loads a demo image
3. Waits for analysis
4. Confirms that the score and metric cards appear
5. Opens one diagnostic visualization

---

# 26. Demo data

Generate demo images programmatically or include reusable synthetic assets.

Create examples representing:

* Sharp and high contrast
* Defocused
* Motion blurred
* Noisy
* Underexposed
* Overexposed
* Uneven illumination
* JPEG compressed

Include labels explaining the intentionally introduced degradation.

---

# 27. Empty, loading, and error states

Create polished states for:

* No image selected
* Image loading
* Image processing
* Partially completed metrics
* Invalid file
* Unsupported format
* Image too large
* Browser incompatibility
* Worker failure
* OpenCV initialization failure

The application should still provide a basic Canvas-based analysis if OpenCV.js fails to load.

---

# 28. Content and copy

Use concise, professional English copy.

Avoid exaggerated claims such as:

* “Clinically validated”
* “Medical-grade”
* “Guarantees usable images”
* “AI diagnosis”
* “Determines diagnostic quality”

Use cautious phrases such as:

* “Technical quality indicator”
* “Estimated image noise”
* “Potential clipping”
* “May indicate blur”
* “Requires modality-specific validation”
* “Suitable for exploratory quality control”

---

# 29. GitHub-ready documentation

Create a detailed README containing:

* Project overview
* Screenshots section
* Feature list
* Architecture
* Installation
* Development commands
* Build instructions
* Testing
* Privacy design
* Supported formats
* Metric descriptions
* Known limitations
* Future work
* Contributing
* License recommendation

Also include:

```bash
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Provide a `.env.example` even if no variables are currently required.

---

# 30. Future-ready features

Structure the project so the following features can be added later:

* DICOM metadata inspection
* NIfTI support
* Batch dataset QC
* Dataset-level statistics
* Duplicate detection
* Outlier image detection
* Model-based artifact detection
* Image registration comparison
* PACS integration
* Research audit trails
* User-defined quality profiles
* ONNX models running locally

Do not implement unnecessary authentication or databases in the first version.

---

# 31. Required pages

Implement:

## `/`

Landing page and initial upload.

## `/analyze`

Full analysis workspace.

## `/methodology`

Detailed explanations of metrics and formulas.

## `/about`

Project motivation, privacy, limitations, and disclaimer.

A separate settings modal or drawer can be used instead of a settings page.

---

# 32. Required reusable components

At minimum, create:

* Header
* Footer
* UploadDropzone
* DemoImageSelector
* ImageViewer
* ViewerToolbar
* AnalysisProgress
* OverallScoreGauge
* MetricCard
* MetricGrid
* IssueSummary
* RecommendationPanel
* HistogramChart
* FrequencyChart
* RadarMetricChart
* HeatmapViewer
* OverlayControls
* MetadataPanel
* SettingsDrawer
* ComparisonViewer
* StressTestControls
* ReportDownloadMenu
* DisclaimerBanner
* ErrorBoundary

---

# 33. Quality score behavior

Use deterministic calculations.

Do not use random values anywhere in the analysis.

Scores should behave logically:

* Blurring a sharp image should reduce sharpness score.
* Adding noise should reduce noise score.
* Clipping intensities should reduce exposure score.
* Reducing contrast should reduce contrast score.
* Adding vignetting should reduce illumination-uniformity score.
* JPEG compression should increase artifact score.

Create synthetic tests to verify these relationships.

---

# 34. Development priorities

Prioritize in this order:

1. Correct image upload and local processing
2. Real quality metrics
3. Stable analysis workflow
4. Clear visual presentation
5. Diagnostic overlays
6. Stress-test laboratory
7. Report generation
8. Optional DICOM support

Do not sacrifice working functionality for decorative complexity.

---

# 35. Completion requirements

Deliver the complete repository.

Do not provide:

* Pseudocode
* Incomplete snippets
* Placeholder components
* TODO-only functions
* Fake metric values
* Nonfunctional buttons
* Static charts pretending to be analysis results

All primary buttons and controls must work.

The application must be coherent, visually polished, and runnable.

Before finishing:

1. Install dependencies.
2. Run linting.
3. Run tests.
4. Run the production build.
5. Fix all TypeScript errors.
6. Fix all broken imports.
7. Check desktop and mobile layouts.
8. Confirm that demo images can be analyzed.
9. Confirm that PDF and JSON downloads work.
10. Confirm that uploaded images never leave the browser.

---

# 36. Final output expected from you

Create all files necessary for the application.

At the end, provide:

* A concise summary of what was built
* The project file structure
* Exact setup commands
* Main technical decisions
* Algorithms implemented
* Tests completed
* Known limitations
* Suggested next improvements

Begin by inspecting the existing directory. If it is empty, initialize the full Next.js project. If a project already exists, preserve working configuration and integrate the application cleanly.

Build the full application now.
