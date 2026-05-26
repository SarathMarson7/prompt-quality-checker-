const CRITERION_LABELS = {
  clarity:     'Clarity',
  specificity: 'Specificity',
  context:     'Context',
  role:        'Role / Persona',
  format:      'Output Format',
  length:      'Length',
  examples:    'Examples',
  constraints: 'Constraints',
}

function colorClass(score) {
  if (score >= 80) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

export default function ScorePanel({ result }) {
  if (!result) {
    return (
      <div className="score-panel">
        <div className="panel-label">Quality Score</div>
        <div className="score-empty">
          <span className="score-empty-icon">⚡</span>
          <span>Start typing to see your score</span>
        </div>
      </div>
    )
  }

  const { overall, label, criteria } = result

  return (
    <div className="score-panel">
      <div className="panel-label">Quality Score</div>

      <div className="overall-card">
        <div className="score-ring">
          <span className="score-ring-number">{overall}</span>
        </div>
        <div>
          <div className="overall-label">{label}</div>
          <div className="overall-sublabel">Overall score out of 100</div>
        </div>
      </div>

      <div className="criteria-list">
        {Object.entries(criteria).map(([key, { score, tip }]) => {
          const cls = colorClass(score)
          return (
            <div key={key} className="criterion">
              <div className="criterion-header">
                <span className="criterion-name">{CRITERION_LABELS[key]}</span>
                <span className={`criterion-score ${cls}`}>{score}</span>
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${cls}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="criterion-tip">{tip}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
