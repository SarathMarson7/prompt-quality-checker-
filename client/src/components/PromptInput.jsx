const SAMPLES = {
  weak: 'Tell me something about marketing.',
  medium: 'Write a blog post about remote work productivity. Include some tips and make it about 300 words.',
  strong: `Act as a senior content strategist with 10 years of B2B experience. Write a 400-word LinkedIn article for a SaaS founder audience about how async-first remote work boosts engineering productivity. Structure it as: hook (1 sentence), 3 numbered insights with a specific stat or example each, and a CTA. Do not use buzzwords like "synergy" or "leverage". For example, one insight might be: "Buffer saw a 20% reduction in meetings after switching to async standups."`,
}

export default function PromptInput({ text, onChange }) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  return (
    <div className="prompt-panel">
      <div className="panel-label">Your Prompt</div>

      <textarea
        className="prompt-textarea"
        placeholder="Paste or type your AI prompt here…"
        value={text}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
      />

      <div className="prompt-meta">
        <span className="prompt-count">
          {charCount} chars · {wordCount} words
        </span>
        <button className="clear-btn" onClick={() => onChange('')}>
          Clear
        </button>
      </div>

      <div className="samples-section">
        <div className="samples-label">Try a sample</div>
        <div className="samples-row">
          {Object.entries(SAMPLES).map(([key, value]) => (
            <span
              key={key}
              className="sample-pill"
              onClick={() => onChange(value)}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(value)}
              aria-label={`Load ${key} prompt sample`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} prompt
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
