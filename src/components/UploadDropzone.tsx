"use client";

import { useRef, useState } from "react";
import type { DemoKind } from "@/lib/image-processing/browser";

const DEMOS: Array<{ kind: DemoKind; title: string; detail: string }> = [
  { kind: "sharp", title: "Sharp phantom", detail: "High-detail synthetic reference" },
  { kind: "blurred", title: "Defocused", detail: "Gaussian-like optical blur" },
  { kind: "noisy", title: "Noisy", detail: "High-frequency sensor-like noise" },
  { kind: "low-contrast", title: "Low contrast", detail: "Compressed intensity range" },
  { kind: "vignette", title: "Vignette", detail: "Center-to-edge illumination falloff" },
];

export function UploadDropzone({
  onFile,
  onDemo,
  compact = false,
}: {
  onFile: (file: File) => void;
  onDemo: (kind: DemoKind) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function accept(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className={compact ? "upload-shell compact" : "upload-shell"}>
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files); }}
      >
        <div className="upload-icon" aria-hidden="true">↥</div>
        <h2>{compact ? "Analyze another image" : "Drop an image into the quality lab"}</h2>
        <p>PNG, JPEG, or WebP · maximum 25 MB · processed only in your browser</p>
        <button className="primary-button" onClick={() => inputRef.current?.click()}>Choose image</button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => accept(event.target.files)}
        />
      </div>
      {!compact && (
        <div className="demo-list">
          <div className="demo-heading"><span>Or load a controlled demo</span><i /></div>
          <div className="demo-grid">
            {DEMOS.map((demo) => (
              <button key={demo.kind} className="demo-card" onClick={() => onDemo(demo.kind)}>
                <span className={`demo-swatch swatch-${demo.kind}`} aria-hidden="true" />
                <strong>{demo.title}</strong>
                <small>{demo.detail}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
