import { describe, expect, it } from "vitest";
import { analyzePixelBuffer, buildHistogram, calculateCompressionBlockiness, calculateSharpness } from "@/lib/image-processing/analyze";
import type { PixelBuffer } from "@/types/analysis";

function bufferFromGray(width: number, height: number, values: number[]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  values.forEach((value, index) => {
    const offset = index * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  });
  return { data, width, height };
}

function checkerboard(size: number, block = 4): PixelBuffer {
  const values = Array.from({ length: size * size }, (_, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    return (Math.floor(x / block) + Math.floor(y / block)) % 2 ? 240 : 15;
  });
  return bufferFromGray(size, size, values);
}

function boxBlur(input: PixelBuffer): PixelBuffer {
  const output = new Uint8ClampedArray(input.data.length);
  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      let total = 0;
      let count = 0;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const xx = Math.min(input.width - 1, Math.max(0, x + dx));
          const yy = Math.min(input.height - 1, Math.max(0, y + dy));
          total += input.data[(yy * input.width + xx) * 4];
          count += 1;
        }
      }
      const value = Math.round(total / count);
      const offset = (y * input.width + x) * 4;
      output[offset] = value;
      output[offset + 1] = value;
      output[offset + 2] = value;
      output[offset + 3] = 255;
    }
  }
  return { data: output, width: input.width, height: input.height };
}

describe("image quality algorithms", () => {
  it("creates a 256-bin histogram", () => {
    const histogram = buildHistogram(new Float32Array([0, 0, 127, 255]));
    expect(histogram).toHaveLength(256);
    expect(histogram[0]).toBe(2);
    expect(histogram[127]).toBe(1);
    expect(histogram[255]).toBe(1);
  });

  it("assigns a lower sharpness score after blur", () => {
    const sharp = checkerboard(64);
    const blurred = boxBlur(sharp);
    const sharpResult = analyzePixelBuffer(sharp, "sharp.png");
    const blurredResult = analyzePixelBuffer(blurred, "blurred.png");
    const sharpScore = sharpResult.metrics.find((metric) => metric.id === "sharpness")?.score ?? 0;
    const blurredScore = blurredResult.metrics.find((metric) => metric.id === "sharpness")?.score ?? 0;
    expect(sharpScore).toBeGreaterThan(blurredScore);
  });

  it("detects clipping in a saturated image", () => {
    const values = Array.from({ length: 32 * 32 }, (_, index) => index % 2 ? 0 : 255);
    const result = analyzePixelBuffer(bufferFromGray(32, 32, values), "clipped.png");
    const exposure = result.metrics.find((metric) => metric.id === "exposure");
    expect(exposure?.score).toBeLessThan(35);
    expect(result.clippingMap.some((value) => value === -1)).toBe(true);
    expect(result.clippingMap.some((value) => value === 1)).toBe(true);
  });

  it("calculates finite edge and compression metrics", () => {
    const image = checkerboard(64, 8);
    const gray = new Float32Array(image.width * image.height);
    for (let index = 0; index < gray.length; index += 1) gray[index] = image.data[index * 4];
    const sharpness = calculateSharpness(gray, image.width, image.height);
    const blockiness = calculateCompressionBlockiness(gray, image.width, image.height);
    expect(Number.isFinite(sharpness.laplacianVariance)).toBe(true);
    expect(Number.isFinite(blockiness)).toBe(true);
  });

  it("returns deterministic results for identical input", () => {
    const image = checkerboard(48, 6);
    const first = analyzePixelBuffer(image, "same.png");
    const second = analyzePixelBuffer(image, "same.png");
    expect(first.overallScore).toBe(second.overallScore);
    expect(first.metrics.map((metric) => metric.score)).toEqual(second.metrics.map((metric) => metric.score));
  });
});
