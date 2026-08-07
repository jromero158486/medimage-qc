import { statusLabel } from "@/lib/scoring/defaults";
import type { QualityMetric } from "@/types/analysis";

export function MetricCard({ metric, onVisualize }: { metric: QualityMetric; onVisualize?: () => void }) {
  return (
    <article className="metric-card">
      <div className="metric-card-head">
        <div>
          <span className="eyebrow">{metric.name}</span>
          <div className="metric-score"><strong>{metric.score}</strong><span>/100</span></div>
        </div>
        <span className={`status status-${metric.status}`}>{statusLabel(metric.status)}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${metric.score}%` }} />
      </div>
      <p>{metric.description}</p>
      <div className="metric-primary">
        <strong>{metric.value}</strong> <span>{metric.unit}</span>
      </div>
      <details>
        <summary>Technical details</summary>
        <dl className="technical-list">
          {Object.entries(metric.technicalDetails).map(([key, value]) => (
            <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </details>
      <div className="metric-actions">
        {onVisualize && <button className="text-button" onClick={onVisualize}>View diagnostic</button>}
      </div>
    </article>
  );
}
