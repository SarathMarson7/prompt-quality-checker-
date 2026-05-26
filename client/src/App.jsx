import { useState, useEffect } from 'react'
import { score } from './scorer.js'
import ThemeToggle from './components/ThemeToggle.jsx'
import PromptInput from './components/PromptInput.jsx'
import ScorePanel from './components/ScorePanel.jsx'

const VALID_THEMES = ['light', 'grey', 'dark']

function getInitialTheme() {
  const saved = localStorage.getItem('pqc-theme')
  if (saved && VALID_THEMES.includes(saved)) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme]   = useState(getInitialTheme)
  const [text, setText]     = useState('')
  const [result, setResult] = useState(null)

  // Persist theme
  useEffect(() => {
    localStorage.setItem('pqc-theme', theme)
  }, [theme])

  // Debounced scoring
  useEffect(() => {
    if (!text.trim()) {
      setResult(null)
      return
    }
    const timer = setTimeout(() => {
      setResult(score(text))
    }, 500)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div>
          <span className="app-header-title">⚡ Prompt Quality Checker</span>
          <span className="app-header-subtitle">Paste any AI prompt and see how to improve it</span>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <div className="panels">
        <PromptInput text={text} onChange={setText} />
        <ScorePanel result={result} />
      </div>
    </div>
  )
}
