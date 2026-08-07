import { statusLabel } from "@/lib/scoring/defaults";
import type { MetricStatus } from "@/types/analysis";

export function ScoreGauge({ score, status }: { score: number; status: MetricStatus }) {
  const angle = Math.max(0, Math.min(360, score * 3.6));
  return (
    <div className="score-wrap">
      <div
        className="score-gauge"
        style={{ background: `conic-gradient(var(--accent) ${angle}deg, var(--line) ${angle}deg)` }}
        aria-label={`Overall quality score ${score} out of 100`}
      >
        <div className="score-core">
          <strong>{score}</strong>
          <span>/100</span>
        </div>
      </div>
      <div>
        <span className={`status status-${status}`}>{statusLabel(status)}</span>
        <p className="muted small">Composite heuristic score</p>
      </div>
    </div>
  );
}
