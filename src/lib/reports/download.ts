import type { AnalysisResult } from "@/types/analysis";

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(result: AnalysisResult): void {
  const payload = {
    appVersion: result.appVersion,
    analysisTimestamp: result.generatedAt,
    file: result.metadata,
    overallScore: result.overallScore,
    qualityCategory: result.category,
    metrics: Object.fromEntries(result.metrics.map((metric) => [metric.id, metric])),
    issues: result.issues,
    recommendations: result.recommendations,
    settings: result.settings,
  };
  saveBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${baseName(result.metadata.fileName)}-qc.json`,
  );
}

export function downloadCsv(result: AnalysisResult): void {
  const rows = [
    ["metric", "score", "status", "value", "unit"],
    ...result.metrics.map((metric) => [
      metric.name,
      String(metric.score),
      metric.status,
      String(metric.value),
      metric.unit ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${baseName(result.metadata.fileName)}-qc.csv`);
}

export function downloadPdf(result: AnalysisResult): void {
  const lines = [
    "MedImage QC — Technical Quality Report",
    `Generated: ${new Date(result.generatedAt).toLocaleString()}`,
    `File: ${result.metadata.fileName}`,
    `Dimensions: ${result.metadata.width} × ${result.metadata.height}`,
    `Overall score: ${result.overallScore}/100 (${result.category})`,
    `Reliability: ${result.reliability}`,
    "",
    "Technical summary",
    result.summary,
    "",
    "Metrics",
    ...result.metrics.map((metric) => `${metric.name}: ${metric.score}/100 — ${metric.value} ${metric.unit ?? ""}`),
    "",
    "Detected issues",
    ...(result.issues.length ? result.issues.map((issue) => `• ${issue.title}: ${issue.detail}`) : ["No major issue detected."]),
    "",
    "Recommendations",
    ...(result.recommendations.length ? result.recommendations.map((item) => `• ${item}`) : ["No specific recommendation generated."]),
    "",
    "Disclaimer",
    "Heuristic technical quality assessment for research and education. Not intended for clinical diagnosis or decision-making. Thresholds require modality-specific validation.",
  ];

  const pdf = createSimplePdf(lines);
  const pdfBuffer = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(pdfBuffer).set(pdf);

  saveBlob(
    new Blob([pdfBuffer], { type: "application/pdf" }),
    `${baseName(result.metadata.fileName)}-qc-report.pdf`,);
}

function createSimplePdf(lines: string[]): Uint8Array {
  const escaped = lines.map((line) => sanitizePdfText(line));
  const commands: string[] = ["BT", "/F1 11 Tf", "44 790 Td", "14 TL"];
  escaped.slice(0, 51).forEach((line, index) => {
    if (index > 0) commands.push("T*");
    commands.push(`(${line}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    document += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(document);
}

function sanitizePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
}
