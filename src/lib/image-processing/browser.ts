import type { PixelBuffer } from "@/types/analysis";

export interface LoadedImage {
  name: string;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  pixelBuffer: PixelBuffer;
}

export const MAX_ANALYSIS_SIDE = 768;

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file. Choose PNG, JPEG, or WebP.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("The image exceeds the 25 MB limit.");
  }
  const dataUrl = await fileToDataUrl(file);
  return loadDataUrl(dataUrl, file.name);
}

export async function loadDataUrl(dataUrl: string, name: string): Promise<LoadedImage> {
  const image = await decodeImage(dataUrl);
  const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return {
    name,
    dataUrl,
    originalWidth: image.naturalWidth,
    originalHeight: image.naturalHeight,
    pixelBuffer: { data: imageData.data, width, height },
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

function decodeImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image is corrupted or unreadable."));
    image.src = source;
  });
}

export type DemoKind =
  | "sharp"
  | "blurred"
  | "noisy"
  | "low-contrast"
  | "vignette";

export function generateDemo(kind: DemoKind, size = 640): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  context.fillStyle = "#10151d";
  context.fillRect(0, 0, size, size);
  context.save();
  if (kind === "blurred") context.filter = "blur(8px)";

  const gradient = context.createRadialGradient(size * 0.48, size * 0.45, 20, size / 2, size / 2, size * 0.48);
  gradient.addColorStop(0, kind === "low-contrast" ? "#9da5ad" : "#f3f7f8");
  gradient.addColorStop(0.45, kind === "low-contrast" ? "#7f8992" : "#8ce9e5");
  gradient.addColorStop(1, kind === "low-contrast" ? "#69737b" : "#152330");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = kind === "low-contrast" ? "rgba(225,235,240,.28)" : "rgba(255,255,255,.86)";
  context.lineWidth = 3;
  for (let ring = 1; ring <= 7; ring += 1) {
    context.beginPath();
    context.arc(size / 2, size / 2, 28 + ring * 29, 0, Math.PI * 2);
    context.stroke();
  }
  context.lineWidth = 2;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    context.beginPath();
    context.moveTo(size / 2 + Math.cos(angle) * 30, size / 2 + Math.sin(angle) * 30);
    context.lineTo(size / 2 + Math.cos(angle) * 230, size / 2 + Math.sin(angle) * 230);
    context.stroke();
  }

  context.fillStyle = kind === "low-contrast" ? "rgba(245,245,245,.35)" : "rgba(255,255,255,.9)";
  for (let y = 105; y < size - 100; y += 66) {
    for (let x = 110; x < size - 100; x += 66) {
      if ((x + y) % 3 === 0) {
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
  context.restore();

  if (kind === "noisy") {
    const imageData = context.getImageData(0, 0, size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = gaussianRandom() * 28;
      imageData.data[i] = clampByte(imageData.data[i] + noise);
      imageData.data[i + 1] = clampByte(imageData.data[i + 1] + noise);
      imageData.data[i + 2] = clampByte(imageData.data[i + 2] + noise);
    }
    context.putImageData(imageData, 0, 0);
  }

  if (kind === "vignette") {
    const vignette = context.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.78)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, size, size);
  }

  return canvas.toDataURL("image/png");
}

export type DegradationKind = "blur" | "noise" | "contrast" | "brightness" | "vignette" | "jpeg";

export async function degradeImage(
  source: string,
  kind: DegradationKind,
  strength: number,
): Promise<string> {
  const image = await decodeImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable.");

  if (kind === "blur") context.filter = `blur(${Math.round(strength * 12)}px)`;
  context.drawImage(image, 0, 0);
  context.filter = "none";

  if (kind === "noise" || kind === "contrast" || kind === "brightness") {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const factor = kind === "contrast" ? 1 - strength * 0.8 : 1;
    const offset = kind === "brightness" ? (strength - 0.5) * 180 : 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = kind === "noise" ? gaussianRandom() * strength * 45 : 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const centered = (imageData.data[i + channel] - 127.5) * factor + 127.5;
        imageData.data[i + channel] = clampByte(centered + offset + noise);
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  if (kind === "vignette") {
    const gradient = context.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) * 0.15,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.7,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${strength * 0.9})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL(kind === "jpeg" ? "image/jpeg" : "image/png", kind === "jpeg" ? Math.max(0.08, 1 - strength * 0.94) : undefined);
}

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
