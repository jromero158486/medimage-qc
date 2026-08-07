import { DEFAULT_SETTINGS, scoreToStatus } from "@/lib/scoring/defaults";
import type {
  AnalysisResult,
  AnalysisSettings,
  ColorAnalysis,
  FrequencyAnalysis,
  HeatmapData,
  MetricId,
  PixelBuffer,
  QualityIssue,
  QualityMetric,
} from "@/types/analysis";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function mean(values: ArrayLike<number>): number {
  if (!values.length) return 0;
  let total = 0;
  for (let i = 0; i < values.length; i += 1) total += values[i];
  return total / values.length;
}

function standardDeviation(values: ArrayLike<number>, average = mean(values)): number {
  if (!values.length) return 0;
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    const delta = values[i] - average;
    total += delta * delta;
  }
  return Math.sqrt(total / values.length);
}

function percentileFromHistogram(histogram: number[], quantile: number, total: number): number {
  const target = total * quantile;
  let cumulative = 0;
  for (let i = 0; i < histogram.length; i += 1) {
    cumulative += histogram[i];
    if (cumulative >= target) return i;
  }
  return 255;
}

export function toGrayscale(buffer: PixelBuffer): {
  grayscale: Float32Array;
  color: ColorAnalysis;
  grayscaleLike: boolean;
} {
  const { data, width, height } = buffer;
  const total = width * height;
  const grayscale = new Float32Array(total);
  const histogramR = new Array<number>(256).fill(0);
  const histogramG = new Array<number>(256).fill(0);
  const histogramB = new Array<number>(256).fill(0);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let channelDifference = 0;

  for (let p = 0, i = 0; p < total; p += 1, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    grayscale[p] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    histogramR[r] += 1;
    histogramG[g] += 1;
    histogramB[b] += 1;
    sumR += r;
    sumG += g;
    sumB += b;
    channelDifference += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
  }

  const meanR = sumR / total;
  const meanG = sumG / total;
  const meanB = sumB / total;
  const channelImbalance = Math.max(meanR, meanG, meanB) - Math.min(meanR, meanG, meanB);

  return {
    grayscale,
    grayscaleLike: channelDifference / Math.max(1, total * 3) < 1.5,
    color: {
      meanR: round(meanR),
      meanG: round(meanG),
      meanB: round(meanB),
      channelImbalance: round(channelImbalance),
      histogramR,
      histogramG,
      histogramB,
    },
  };
}

export function buildHistogram(grayscale: ArrayLike<number>): number[] {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < grayscale.length; i += 1) {
    histogram[Math.max(0, Math.min(255, Math.round(grayscale[i])))] += 1;
  }
  return histogram;
}

export function calculateSharpness(
  grayscale: Float32Array,
  width: number,
  height: number,
): {
  laplacianVariance: number;
  tenengrad: number;
  edgeDensity: number;
  edgeMap: number[];
} {
  const laplacian = new Float32Array(width * height);
  const edgeMap = new Array<number>(width * height).fill(0);
  let gradientEnergy = 0;
  let edgePixels = 0;
  let samples = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const left = grayscale[i - 1];
      const right = grayscale[i + 1];
      const top = grayscale[i - width];
      const bottom = grayscale[i + width];
      laplacian[i] = left + right + top + bottom - 4 * grayscale[i];

      const gx =
        -grayscale[i - width - 1] +
        grayscale[i - width + 1] -
        2 * grayscale[i - 1] +
        2 * grayscale[i + 1] -
        grayscale[i + width - 1] +
        grayscale[i + width + 1];
      const gy =
        -grayscale[i - width - 1] -
        2 * grayscale[i - width] -
        grayscale[i - width + 1] +
        grayscale[i + width - 1] +
        2 * grayscale[i + width] +
        grayscale[i + width + 1];
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edgeMap[i] = clamp(magnitude, 0, 255);
      gradientEnergy += magnitude * magnitude;
      if (magnitude > 80) edgePixels += 1;
      samples += 1;
    }
  }

  const lapMean = mean(laplacian);
  const laplacianVariance = standardDeviation(laplacian, lapMean) ** 2;
  return {
    laplacianVariance,
    tenengrad: gradientEnergy / Math.max(1, samples),
    edgeDensity: edgePixels / Math.max(1, samples),
    edgeMap,
  };
}

export function estimateNoise(
  grayscale: Float32Array,
  width: number,
  height: number,
): { sigma: number; residual: Float32Array; estimatedSnr: number } {
  const residual = new Float32Array(width * height);
  const absoluteResiduals: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      let neighborhood = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          neighborhood += grayscale[(y + dy) * width + x + dx];
        }
      }
      const value = grayscale[i] - neighborhood / 9;
      residual[i] = value;
      absoluteResiduals.push(Math.abs(value));
    }
  }
  absoluteResiduals.sort((a, b) => a - b);
  const medianAbsolute = absoluteResiduals[Math.floor(absoluteResiduals.length / 2)] ?? 0;
  const sigma = medianAbsolute * 1.4826;
  const signalMean = mean(grayscale);
  const estimatedSnr = sigma > 0 ? 20 * Math.log10(Math.max(1, signalMean) / sigma) : 60;
  return { sigma, residual, estimatedSnr };
}

function localMap(
  grayscale: Float32Array,
  width: number,
  height: number,
  tileSize: number,
  compute: (values: number[], tileWidth: number, tileHeight: number) => number,
): HeatmapData {
  const columns = Math.max(1, Math.ceil(width / tileSize));
  const rows = Math.max(1, Math.ceil(height / tileSize));
  const values: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x0 = column * tileSize;
      const y0 = row * tileSize;
      const x1 = Math.min(width, x0 + tileSize);
      const y1 = Math.min(height, y0 + tileSize);
      const tile: number[] = [];
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) tile.push(grayscale[y * width + x]);
      }
      values.push(compute(tile, x1 - x0, y1 - y0));
    }
  }
  return {
    rows,
    columns,
    values,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

function localSharpness(values: number[], width: number, height: number): number {
  if (width < 3 || height < 3) return 0;
  const laplacian: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      laplacian.push(values[i - 1] + values[i + 1] + values[i - width] + values[i + width] - 4 * values[i]);
    }
  }
  const average = mean(laplacian);
  return standardDeviation(laplacian, average) ** 2;
}

function localNoise(values: number[], width: number, height: number): number {
  if (width < 3 || height < 3) return 0;
  const residuals: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const neighbors = values[i - 1] + values[i + 1] + values[i - width] + values[i + width];
      residuals.push(Math.abs(values[i] - neighbors / 4));
    }
  }
  residuals.sort((a, b) => a - b);
  return (residuals[Math.floor(residuals.length / 2)] ?? 0) * 1.4826;
}

function calculateIllumination(map: HeatmapData): {
  coefficientOfVariation: number;
  centerEdgeDelta: number;
} {
  const average = mean(map.values);
  const coefficientOfVariation = average > 0 ? standardDeviation(map.values, average) / average : 1;
  let edgeTotal = 0;
  let edgeCount = 0;
  let centerTotal = 0;
  let centerCount = 0;
  map.values.forEach((value, index) => {
    const row = Math.floor(index / map.columns);
    const column = index % map.columns;
    const edge = row === 0 || column === 0 || row === map.rows - 1 || column === map.columns - 1;
    if (edge) {
      edgeTotal += value;
      edgeCount += 1;
    } else {
      centerTotal += value;
      centerCount += 1;
    }
  });
  const edgeMean = edgeTotal / Math.max(1, edgeCount);
  const centerMean = centerTotal / Math.max(1, centerCount);
  return {
    coefficientOfVariation,
    centerEdgeDelta: centerMean > 0 ? (centerMean - edgeMean) / centerMean : 0,
  };
}

export function calculateCompressionBlockiness(
  grayscale: Float32Array,
  width: number,
  height: number,
): number {
  let boundary = 0;
  let boundaryCount = 0;
  let internal = 0;
  let internalCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const difference = Math.abs(grayscale[y * width + x] - grayscale[y * width + x - 1]);
      if (x % 8 === 0) {
        boundary += difference;
        boundaryCount += 1;
      } else {
        internal += difference;
        internalCount += 1;
      }
    }
  }
  for (let y = 1; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const difference = Math.abs(grayscale[y * width + x] - grayscale[(y - 1) * width + x]);
      if (y % 8 === 0) {
        boundary += difference;
        boundaryCount += 1;
      } else {
        internal += difference;
        internalCount += 1;
      }
    }
  }
  const boundaryMean = boundary / Math.max(1, boundaryCount);
  const internalMean = internal / Math.max(1, internalCount);
  return boundaryMean / Math.max(0.001, internalMean);
}

function fft1d(real: Float64Array, imaginary: Float64Array): void {
  const n = real.length;
  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]];
    }
  }
  for (let length = 2; length <= n; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const wLengthReal = Math.cos(angle);
    const wLengthImaginary = Math.sin(angle);
    for (let i = 0; i < n; i += length) {
      let wReal = 1;
      let wImaginary = 0;
      for (let k = 0; k < length / 2; k += 1) {
        const even = i + k;
        const odd = even + length / 2;
        const oddReal = real[odd] * wReal - imaginary[odd] * wImaginary;
        const oddImaginary = real[odd] * wImaginary + imaginary[odd] * wReal;
        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
        const nextWReal = wReal * wLengthReal - wImaginary * wLengthImaginary;
        wImaginary = wReal * wLengthImaginary + wImaginary * wLengthReal;
        wReal = nextWReal;
      }
    }
  }
}

export function frequencyAnalysis(
  grayscale: Float32Array,
  width: number,
  height: number,
  size = 64,
): FrequencyAnalysis {
  const real = new Float64Array(size * size);
  const imaginary = new Float64Array(size * size);
  const average = mean(grayscale);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x / size) * width));
      const sourceY = Math.min(height - 1, Math.floor((y / size) * height));
      const windowX = 0.5 - 0.5 * Math.cos((2 * Math.PI * x) / Math.max(1, size - 1));
      const windowY = 0.5 - 0.5 * Math.cos((2 * Math.PI * y) / Math.max(1, size - 1));
      real[y * size + x] = (grayscale[sourceY * width + sourceX] - average) * windowX * windowY;
    }
  }

  for (let y = 0; y < size; y += 1) {
    const rowReal = real.slice(y * size, (y + 1) * size);
    const rowImaginary = imaginary.slice(y * size, (y + 1) * size);
    fft1d(rowReal, rowImaginary);
    real.set(rowReal, y * size);
    imaginary.set(rowImaginary, y * size);
  }
  for (let x = 0; x < size; x += 1) {
    const columnReal = new Float64Array(size);
    const columnImaginary = new Float64Array(size);
    for (let y = 0; y < size; y += 1) {
      columnReal[y] = real[y * size + x];
      columnImaginary[y] = imaginary[y * size + x];
    }
    fft1d(columnReal, columnImaginary);
    for (let y = 0; y < size; y += 1) {
      real[y * size + x] = columnReal[y];
      imaginary[y * size + x] = columnImaginary[y];
    }
  }

  const spectrum = new Array<number>(size * size).fill(0);
  const bins = Math.floor(size / 2);
  const radialSum = new Array<number>(bins).fill(0);
  const radialCount = new Array<number>(bins).fill(0);
  let totalEnergy = 0;
  let highEnergy = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const shiftedX = (x + size / 2) % size;
      const shiftedY = (y + size / 2) % size;
      const magnitude = Math.log1p(Math.hypot(real[y * size + x], imaginary[y * size + x]));
      spectrum[shiftedY * size + shiftedX] = magnitude;
      const dx = shiftedX - size / 2;
      const dy = shiftedY - size / 2;
      const radius = Math.floor(Math.sqrt(dx * dx + dy * dy));
      if (radius < bins) {
        radialSum[radius] += magnitude;
        radialCount[radius] += 1;
      }
      const energy = magnitude * magnitude;
      totalEnergy += energy;
      if (radius > size * 0.2) highEnergy += energy;
    }
  }
  const maxSpectrum = Math.max(1, ...spectrum);
  return {
    size,
    spectrum: spectrum.map((value) => value / maxSpectrum),
    radialProfile: radialSum.map((sum, index) => sum / Math.max(1, radialCount[index])),
    highFrequencyRatio: highEnergy / Math.max(1e-8, totalEnergy),
  };
}

function metric(
  id: MetricId,
  name: string,
  score: number,
  value: number,
  unit: string,
  description: string,
  technicalDetails: Record<string, number | string>,
  recommendations: string[],
): QualityMetric {
  const normalized = round(clamp(score), 0);
  return {
    id,
    name,
    score: normalized,
    status: scoreToStatus(normalized),
    value: round(value),
    unit,
    description,
    technicalDetails,
    recommendations,
  };
}

export function analyzePixelBuffer(
  buffer: PixelBuffer,
  fileName = "image.png",
  settings: AnalysisSettings = DEFAULT_SETTINGS,
): AnalysisResult {
  const { width, height } = buffer;
  const { grayscale, color, grayscaleLike } = toGrayscale(buffer);
  const histogram = buildHistogram(grayscale);
  const total = grayscale.length;
  const average = mean(grayscale);
  const rmsContrast = standardDeviation(grayscale, average);
  const p5 = percentileFromHistogram(histogram, 0.05, total);
  const median = percentileFromHistogram(histogram, 0.5, total);
  const p95 = percentileFromHistogram(histogram, 0.95, total);
  const percentileContrast = p95 - p5;
  const sharpness = calculateSharpness(grayscale, width, height);
  const noise = estimateNoise(grayscale, width, height);
  const illuminationMap = localMap(grayscale, width, height, Math.max(32, settings.tileSize * 2), (values) => mean(values));
  const sharpnessMap = localMap(grayscale, width, height, settings.tileSize, localSharpness);
  const noiseMap = localMap(grayscale, width, height, settings.tileSize, localNoise);
  const contrastMap = localMap(grayscale, width, height, settings.tileSize, (values) => standardDeviation(values));
  const illumination = calculateIllumination(illuminationMap);
  const blockiness = calculateCompressionBlockiness(grayscale, width, height);
  const frequency = frequencyAnalysis(grayscale, width, height);

  let darkPixels = 0;
  let brightPixels = 0;
  const clippingMap = new Array<number>(total).fill(0);
  for (let i = 0; i < total; i += 1) {
    if (grayscale[i] <= settings.darkClipThreshold) {
      darkPixels += 1;
      clippingMap[i] = -1;
    } else if (grayscale[i] >= settings.brightClipThreshold) {
      brightPixels += 1;
      clippingMap[i] = 1;
    }
  }
  const darkClip = darkPixels / total;
  const brightClip = brightPixels / total;
  const totalClip = darkClip + brightClip;

  const sharpnessScore = clamp(
    65 * (1 - Math.exp(-sharpness.laplacianVariance / 380)) +
      25 * (1 - Math.exp(-sharpness.tenengrad / 7500)) +
      10 * clamp(sharpness.edgeDensity / 0.12, 0, 1),
  );
  const noiseScore = clamp(100 - noise.sigma * 4.2);
  const contrastScore = clamp((percentileContrast / 190) * 100);
  const exposureScore = clamp(
    100 - totalClip * 600 - (Math.abs(average - 127.5) / 127.5) * 25,
  );
  const dynamicRangeScore = clamp((percentileContrast / 220) * 100);
  const illuminationScore = clamp(
    100 - illumination.coefficientOfVariation * 230 - Math.abs(illumination.centerEdgeDelta) * 90,
  );
  const compressionScore = clamp(100 - Math.max(0, blockiness - 1.05) * 70);

  const metrics: QualityMetric[] = [
    metric(
      "sharpness",
      "Sharpness",
      sharpnessScore,
      sharpness.laplacianVariance,
      "Laplacian variance",
      sharpnessScore < 55
        ? "Fine structures may appear softened or locally out of focus."
        : "Edge energy and local detail are reasonably preserved.",
      {
        "Variance of Laplacian": round(sharpness.laplacianVariance),
        "Tenengrad energy": round(sharpness.tenengrad),
        "Edge density": `${round(sharpness.edgeDensity * 100)}%`,
      },
      [
        "Verify focus and acquisition stability.",
        "Preserve the original before applying sharpening.",
      ],
    ),
    metric(
      "noise",
      "Noise",
      noiseScore,
      noise.sigma,
      "estimated σ",
      noiseScore < 55
        ? "High-frequency residuals may obscure subtle structures."
        : "The image-based residual estimate is relatively low.",
      {
        "Estimated noise sigma": round(noise.sigma),
        "Estimated image SNR": `${round(noise.estimatedSnr)} dB`,
      },
      [
        "Review exposure and sensor settings.",
        "Validate denoising against fine-structure preservation.",
      ],
    ),
    metric(
      "contrast",
      "Contrast",
      contrastScore,
      rmsContrast,
      "RMS intensity",
      contrastScore < 55
        ? "The central intensity range is narrow and may hide structures."
        : "The image uses a substantial portion of the intensity range.",
      {
        "RMS contrast": round(rmsContrast),
        "P5 intensity": p5,
        "P95 intensity": p95,
        "P95–P5 span": percentileContrast,
      },
      [
        "Review acquisition windowing or illumination.",
        "Document any contrast normalization used for analysis.",
      ],
    ),
    metric(
      "exposure",
      "Exposure",
      exposureScore,
      totalClip * 100,
      "% clipped",
      totalClip > 0.02
        ? "A noticeable fraction of pixels is close to black or white saturation."
        : "Shadow and highlight clipping are limited under current thresholds.",
      {
        "Mean intensity": round(average),
        "Median intensity": median,
        "Dark clipping": `${round(darkClip * 100)}%`,
        "Bright clipping": `${round(brightClip * 100)}%`,
      },
      [
        "Check exposure, gain, and acquisition windowing.",
        "Avoid interpreting saturated regions quantitatively.",
      ],
    ),
    metric(
      "dynamic-range",
      "Dynamic range",
      dynamicRangeScore,
      percentileContrast,
      "P95–P5",
      dynamicRangeScore < 55
        ? "Most pixels occupy a limited intensity interval."
        : "The robust intensity span is broad.",
      { "P5 intensity": p5, "P95 intensity": p95 },
      ["Verify that intensity scaling preserves the original data distribution."],
    ),
    metric(
      "illumination",
      "Illumination",
      illuminationScore,
      illumination.coefficientOfVariation * 100,
      "% tile CV",
      illuminationScore < 55
        ? "Low-frequency intensity variation may indicate uneven illumination or vignetting."
        : "Large-scale illumination is comparatively uniform.",
      {
        "Tile coefficient of variation": `${round(illumination.coefficientOfVariation * 100)}%`,
        "Center-edge delta": `${round(illumination.centerEdgeDelta * 100)}%`,
      },
      [
        "Inspect light-source alignment and flat-field calibration.",
        "Correct background variation before intensity-based measurements.",
      ],
    ),
    metric(
      "compression",
      "Compression",
      compressionScore,
      blockiness,
      "boundary ratio",
      compressionScore < 55
        ? "Differences at 8×8 boundaries may indicate visible block artifacts."
        : "No strong block-boundary signal was detected.",
      { "8×8 boundary/internal difference ratio": round(blockiness, 3) },
      ["Prefer lossless export when subtle texture is important."],
    ),
  ];

  const issues: QualityIssue[] = metrics
    .filter((item) => item.score < 55)
    .map((item) => ({
      id: item.id,
      severity: item.score < 35 ? "high" : "moderate",
      title: `${item.name} requires review`,
      detail: item.description,
    }));

  if (width < 512 || height < 512) {
    issues.push({
      id: "small-image",
      severity: "low",
      title: "Limited pixel dimensions",
      detail: "The image may be too small for fine-structure analysis or robust local quality maps.",
    });
  }

  if (!grayscaleLike && color.channelImbalance > 35) {
    issues.push({
      id: "color-cast",
      severity: "low",
      title: "Possible channel imbalance",
      detail: "Average RGB channels differ substantially; verify white balance or staining context.",
    });
  }

  const overallScore = round(
    metrics.reduce((sum, item) => sum + item.score * settings.weights[item.id], 0),
    0,
  );
  const category = scoreToStatus(overallScore);
  const primaryIssue = [...issues].sort((a, b) => {
    const rank = { high: 3, moderate: 2, low: 1 };
    return rank[b.severity] - rank[a.severity];
  })[0];
  const summary = primaryIssue
    ? `${primaryIssue.title}. ${primaryIssue.detail}`
    : "No major technical quality issue was detected under the current heuristic thresholds.";
  const recommendations = Array.from(
    new Set(metrics.filter((item) => item.score < 70).flatMap((item) => item.recommendations)),
  ).slice(0, 6);

  return {
    appVersion: "0.1.0",
    generatedAt: new Date().toISOString(),
    overallScore,
    category,
    summary,
    reliability: width * height >= 262_144 ? "High" : width * height >= 65_536 ? "Moderate" : "Limited",
    metrics,
    issues,
    recommendations,
    metadata: {
      fileName,
      width,
      height,
      megapixels: round((width * height) / 1_000_000, 3),
      aspectRatio: round(width / height, 3),
      colorMode: grayscaleLike ? "Grayscale-like" : "RGB",
      analyzedPixels: width * height,
    },
    histogram,
    rgba: Array.from(buffer.data),
    grayscale: Array.from(grayscale),
    edgeMap: sharpness.edgeMap,
    clippingMap,
    heatmaps: {
      sharpness: sharpnessMap,
      noise: noiseMap,
      contrast: contrastMap,
      illumination: illuminationMap,
    },
    frequency,
    color,
    settings,
  };
}
