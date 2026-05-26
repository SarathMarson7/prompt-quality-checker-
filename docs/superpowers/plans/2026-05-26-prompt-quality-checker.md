# Prompt Quality Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully static React + Vite SPA that scores any AI prompt across 8 criteria using pure JavaScript heuristics and deploys to GitHub Pages.

**Architecture:** Single-page app with no backend — `scorer.js` is a pure function that takes prompt text and returns an object with 8 criterion scores plus an overall average. `App.jsx` holds theme state and debounced scoring; two child panels (`PromptInput`, `ScorePanel`) communicate only through props. CSS custom properties drive all three themes via a `data-theme` attribute on the root div.

**Tech Stack:** React 18, Vite 5, Node built-in `node:test` (no Jest), GitHub Actions CI/CD, GitHub Pages.

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | `"type":"module"`, scripts dev/build/test, all deps |
| `vite.config.js` | `root:'client'`, `base` set to `/prompt-quality-checker/` in production |
| `client/index.html` | HTML entry point, mounts `#root` |
| `client/src/main.jsx` | React bootstrap, renders `<App />` into `#root` |
| `client/src/scorer.js` | Pure scoring engine — 8 criteria functions + `score()` export |
| `client/src/scorer.test.js` | ~16 node:test tests, one per criterion + edge cases |
| `client/src/App.css` | CSS custom properties for light/grey/dark + all component styles |
| `client/src/App.jsx` | Root: theme state, localStorage, debounced score, layout |
| `client/src/components/ThemeToggle.jsx` | ☀️/🌥/🌙 toggle (same pattern as ai-trust-chat) |
| `client/src/components/PromptInput.jsx` | Left panel: textarea, char/word count, Clear, sample pills |
| `client/src/components/ScorePanel.jsx` | Right panel: score ring, 8 criterion bars with tips |
| `.github/workflows/ci.yml` | npm ci → test → build on every push/PR |
| `.github/workflows/release.yml` | Build + deploy to GitHub Pages on `v*.*.*` tag |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `.gitignore` (update existing)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "prompt-quality-checker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "node --test client/src/scorer.test.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: 'client',
  base: mode === 'production' ? '/prompt-quality-checker/' : '/',
  build: {
    outDir: '../client/dist',
    emptyOutDir: true,
  },
}))
```

- [ ] **Step 3: Create `client/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prompt Quality Checker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `client/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Create `client/src/App.jsx` (skeleton — full implementation in Task 7)**

```jsx
export default function App() {
  return <div className="app" data-theme="light"><p>Prompt Quality Checker</p></div>
}
```

- [ ] **Step 6: Create `client/src/App.css` (empty placeholder — full implementation in Task 3)**

```css
/* styles added in Task 3 */
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite starts on http://localhost:5173 (or similar). Visit URL — see "Prompt Quality Checker" text.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js client/index.html client/src/main.jsx client/src/App.jsx client/src/App.css
git commit -m "feat: scaffold Vite + React project"
```

---

## Task 2: Scoring Engine (TDD)

**Files:**
- Create: `client/src/scorer.js`
- Create: `client/src/scorer.test.js`

Write all tests first, run them to confirm they fail, then implement `scorer.js` to make them pass.

- [ ] **Step 1: Create `client/src/scorer.test.js`**

```js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { score } from './scorer.js'

describe('clarity', () => {
  test('penalises vague filler words', () => {
    const result = score('Write something about maybe a kind of thing')
    assert.ok(result.criteria.clarity.score < 50, 'Expected <50 for vague prompt')
  })
  test('scores 100 with no filler words', () => {
    const result = score('Write a numbered list of 5 Python best practices')
    assert.strictEqual(result.criteria.clarity.score, 100)
  })
})

describe('specificity', () => {
  test('rewards action verbs', () => {
    const result = score('Summarise the following article in 3 bullet points')
    assert.ok(result.criteria.specificity.score >= 80)
  })
  test('scores low with no action verbs or numbers', () => {
    const result = score('Tell me about the weather')
    assert.ok(result.criteria.specificity.score < 50)
  })
})

describe('context', () => {
  test('detects background phrases', () => {
    const result = score('The goal is to improve user retention. Suggest 5 strategies.')
    assert.ok(result.criteria.context.score >= 80)
  })
  test('scores 0 with no context phrases', () => {
    const result = score('Write a poem')
    assert.strictEqual(result.criteria.context.score, 0)
  })
})

describe('role', () => {
  test('detects "act as" pattern', () => {
    const result = score('Act as a senior software engineer and review this code')
    assert.strictEqual(result.criteria.role.score, 100)
  })
  test('detects "you are a" pattern', () => {
    const result = score('You are a helpful writing assistant')
    assert.strictEqual(result.criteria.role.score, 100)
  })
  test('scores 0 with no role', () => {
    const result = score('Write a poem about the sea')
    assert.strictEqual(result.criteria.role.score, 0)
  })
})

describe('format', () => {
  test('detects format keywords', () => {
    const result = score('Return your answer as a JSON object with keys name and age')
    assert.strictEqual(result.criteria.format.score, 100)
  })
  test('scores 0 with no format instruction', () => {
    const result = score('Tell me about Python')
    assert.strictEqual(result.criteria.format.score, 0)
  })
})

describe('length', () => {
  test('5 words scores 0', () => {
    const result = score('Write me a poem')
    assert.strictEqual(result.criteria.length.score, 0)
  })
  test('30 words scores 100', () => {
    const words = Array(30).fill('word').join(' ')
    const result = score(words)
    assert.strictEqual(result.criteria.length.score, 100)
  })
  test('600 words scores 0', () => {
    const words = Array(600).fill('word').join(' ')
    const result = score(words)
    assert.strictEqual(result.criteria.length.score, 0)
  })
})

describe('examples', () => {
  test('detects "for example"', () => {
    const result = score('Write 3 headlines. For example: "10 tips to improve your sleep"')
    assert.strictEqual(result.criteria.examples.score, 100)
  })
  test('detects "e.g."', () => {
    const result = score('List 5 tools, e.g. Notion or Figma')
    assert.strictEqual(result.criteria.examples.score, 100)
  })
  test('scores 0 with no examples', () => {
    const result = score('Write a short blog post about productivity')
    assert.strictEqual(result.criteria.examples.score, 0)
  })
})

describe('constraints', () => {
  test('detects "do not"', () => {
    const result = score('Summarise the article. Do not include opinions.')
    assert.strictEqual(result.criteria.constraints.score, 100)
  })
  test('detects "avoid"', () => {
    const result = score('Write copy. Avoid jargon and technical terms.')
    assert.strictEqual(result.criteria.constraints.score, 100)
  })
  test('scores 0 with no constraints', () => {
    const result = score('Explain quantum computing')
    assert.strictEqual(result.criteria.constraints.score, 0)
  })
})

describe('overall', () => {
  test('empty string scores 0 overall', () => {
    const result = score('')
    assert.strictEqual(result.overall, 0)
    assert.strictEqual(result.label, 'Weak Prompt')
  })
  test('overall is average of 8 criteria', () => {
    const result = score('Write a poem')
    const sum = Object.values(result.criteria).reduce((acc, c) => acc + c.score, 0)
    const expected = Math.round(sum / 8)
    assert.strictEqual(result.overall, expected)
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
npm test
```

Expected: `ReferenceError: Cannot find module './scorer.js'` or similar. All tests fail. This is correct.

- [ ] **Step 3: Create `client/src/scorer.js`**

```js
// scorer.js — pure scoring engine, no imports needed

const VAGUE_WORDS = /\b(something|maybe|kind of|a bit|sort of|stuff|things|whatever)\b/gi

const ACTION_VERBS = /\b(write|list|summarise|summarize|generate|extract|explain|describe|analyse|analyze|compare|create|identify|suggest|provide|review|evaluate|translate|convert|format|return|output)\b/gi

const CONTEXT_PHRASES = /\b(because|the goal is|for a |i need this for|the context is|we are|this is for|in order to|so that)\b/gi

const ROLE_PATTERNS = /\b(act as|you are a|as a [a-z]+|pretend you are|imagine you are|take the role of)\b/gi

const FORMAT_KEYWORDS = /\b(list|table|json|bullet|paragraph|step-by-step|step by step|markdown|numbered|number|format|structure|heading|section|code block|output as)\b/gi

const EXAMPLE_PHRASES = /\b(for example|like this|such as|e\.g\.|for instance|here is an example|here's an example)\b/gi

const CONSTRAINT_WORDS = /\b(do not|avoid|only|must not|never|don't|dont|exclude|without|no more than|at most|at least|limit)\b/gi

function countMatches(text, regex) {
  return (text.match(regex) || []).length
}

function scoreClarity(text) {
  if (!text.trim()) return { score: 0, tip: '❌ Add a clear, specific instruction' }
  const vagueCount = countMatches(text, VAGUE_WORDS)
  if (vagueCount === 0) return { score: 100, tip: '✅ No vague filler words detected' }
  if (vagueCount === 1) return { score: 50, tip: '⚠️ Remove vague word — be more precise' }
  return { score: 0, tip: `❌ ${vagueCount} vague words found — replace with specific language` }
}

function scoreSpecificity(text) {
  if (!text.trim()) return { score: 0, tip: '❌ Use action verbs and measurable targets' }
  const verbCount = countMatches(text, ACTION_VERBS)
  const hasNumber = /\d/.test(text)
  let score = 0
  if (verbCount >= 1) score += 60
  if (verbCount >= 2) score += 20
  if (hasNumber) score += 20
  score = Math.min(score, 100)
  if (score >= 80) return { score, tip: '✅ Action verbs and specific task detected' }
  if (score >= 40) return { score, tip: '⚠️ Add more specific action verbs or measurable targets' }
  return { score, tip: '❌ Use action verbs (write, list, summarise) and specific targets' }
}

function scoreContext(text) {
  if (!text.trim()) return { score: 0, tip: '❌ Add background — why is this needed?' }
  const count = countMatches(text, CONTEXT_PHRASES)
  if (count >= 2) return { score: 100, tip: '✅ Good context and purpose provided' }
  if (count === 1) return { score: 60, tip: '⚠️ Consider adding more background context' }
  return { score: 0, tip: '❌ Add context — "The goal is…" or "I need this for…"' }
}

function scoreRole(text) {
  if (!text.trim()) return { score: 0, tip: '❌ No role defined — try "Act as a…"' }
  const count = countMatches(text, ROLE_PATTERNS)
  if (count >= 1) return { score: 100, tip: '✅ Role / persona detected' }
  return { score: 0, tip: '❌ Add a role — "Act as a senior developer" or "You are a…"' }
}

function scoreFormat(text) {
  if (!text.trim()) return { score: 0, tip: '❌ No output format specified' }
  const count = countMatches(text, FORMAT_KEYWORDS)
  if (count >= 1) return { score: 100, tip: '✅ Output format specified' }
  return { score: 0, tip: '❌ Specify format — "as a numbered list", "as JSON", "in markdown"' }
}

function scoreLength(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  if (words === 0) return { score: 0, tip: '❌ Prompt is empty' }
  if (words < 10) return { score: 0, tip: `❌ Too short (${words} words) — add more detail` }
  if (words <= 20) return { score: 60, tip: `⚠️ Short prompt (${words} words) — consider expanding` }
  if (words <= 150) return { score: 100, tip: `✅ ${words} words — ideal length` }
  if (words <= 300) return { score: 80, tip: `⚠️ Long prompt (${words} words) — consider tightening` }
  if (words <= 500) return { score: 50, tip: `⚠️ Very long prompt (${words} words) — may confuse the AI` }
  return { score: 0, tip: `❌ Extremely long (${words} words) — split into smaller prompts` }
}

function scoreExamples(text) {
  if (!text.trim()) return { score: 0, tip: '❌ No examples provided' }
  const count = countMatches(text, EXAMPLE_PHRASES)
  if (count >= 1) return { score: 100, tip: '✅ Examples provided to guide the AI' }
  return { score: 0, tip: '❌ Add an example — "for example:" or "such as:"' }
}

function scoreConstraints(text) {
  if (!text.trim()) return { score: 0, tip: '❌ No constraints or limits set' }
  const count = countMatches(text, CONSTRAINT_WORDS)
  if (count >= 1) return { score: 100, tip: '✅ Constraints detected' }
  return { score: 0, tip: '❌ Add constraints — "do not", "avoid", "only", "must not"' }
}

function getLabel(overall) {
  if (overall >= 85) return 'Strong Prompt'
  if (overall >= 65) return 'Good Prompt'
  if (overall >= 40) return 'Needs Improvement'
  return 'Weak Prompt'
}

export function score(text) {
  const criteria = {
    clarity:     scoreClarity(text),
    specificity: scoreSpecificity(text),
    context:     scoreContext(text),
    role:        scoreRole(text),
    format:      scoreFormat(text),
    length:      scoreLength(text),
    examples:    scoreExamples(text),
    constraints: scoreConstraints(text),
  }
  const scores = Object.values(criteria).map(c => c.score)
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  return { overall, label: getLabel(overall), criteria }
}
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npm test
```

Expected output (16 tests):
```
▶ clarity
  ✔ penalises vague filler words
  ✔ scores 100 with no filler words
▶ specificity
  ✔ rewards action verbs
  ✔ scores low with no action verbs or numbers
▶ context
  ✔ detects background phrases
  ✔ scores 0 with no context phrases
▶ role
  ✔ detects "act as" pattern
  ✔ detects "you are a" pattern
  ✔ scores 0 with no role
▶ format
  ✔ detects format keywords
  ✔ scores 0 with no format instruction
▶ length
  ✔ 5 words scores 0
  ✔ 30 words scores 100
  ✔ 600 words scores 0
▶ examples
  ✔ detects "for example"
  ✔ detects "e.g."
  ✔ scores 0 with no examples
▶ constraints
  ✔ detects "do not"
  ✔ detects "avoid"
  ✔ scores 0 with no constraints
▶ overall
  ✔ empty string scores 0 overall
  ✔ overall is average of 8 criteria
pass 22, fail 0
```

If any test fails, fix `scorer.js` to match the expected behaviour — do not change the tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/scorer.js client/src/scorer.test.js
git commit -m "feat: add pure scoring engine with 22 passing tests"
```

---

## Task 3: App.css — Themes and Layout

**Files:**
- Modify: `client/src/App.css`

- [ ] **Step 1: Replace `client/src/App.css` with full styles**

```css
/* ─── Reset ─────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── Theme tokens ───────────────────────────────────────── */
[data-theme="light"] {
  --bg-base:       #f8fafc;
  --bg-panel:      #f1f5f9;
  --bg-input:      #ffffff;
  --border:        #cbd5e1;
  --text-primary:  #1e293b;
  --text-secondary:#475569;
  --text-muted:    #94a3b8;
  --accent:        #6366f1;
  --score-green:   #059669;
  --score-amber:   #d97706;
  --score-red:     #dc2626;
  --bar-track:     #e2e8f0;
}
[data-theme="grey"] {
  --bg-base:       #1e2330;
  --bg-panel:      #252d3d;
  --bg-input:      #2d3748;
  --border:        #374151;
  --text-primary:  #e2e8f0;
  --text-secondary:#94a3b8;
  --text-muted:    #64748b;
  --accent:        #818cf8;
  --score-green:   #10b981;
  --score-amber:   #f59e0b;
  --score-red:     #ef4444;
  --bar-track:     #374151;
}
[data-theme="dark"] {
  --bg-base:       #0f1117;
  --bg-panel:      #161925;
  --bg-input:      #1e2333;
  --border:        #2d3553;
  --text-primary:  #e2e8f0;
  --text-secondary:#94a3b8;
  --text-muted:    #64748b;
  --accent:        #6366f1;
  --score-green:   #10b981;
  --score-amber:   #f59e0b;
  --score-red:     #ef4444;
  --bar-track:     #2d3553;
}

/* ─── App shell ──────────────────────────────────────────── */
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
}

/* ─── Header ─────────────────────────────────────────────── */
.app-header {
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.app-header-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.app-header-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 10px;
}

/* ─── ThemeToggle ────────────────────────────────────────── */
.theme-toggle {
  display: flex;
  gap: 4px;
}
.theme-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
  transition: background 0.15s, border-color 0.15s;
}
.theme-btn:hover {
  background: var(--bg-input);
  border-color: var(--border);
}
.theme-btn.active {
  background: var(--bg-input);
  border-color: var(--accent);
  color: var(--text-primary);
}
.theme-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ─── Two-panel body ─────────────────────────────────────── */
.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: hidden;
}

/* ─── PromptInput (left panel) ───────────────────────────── */
.prompt-panel {
  border-right: 1px solid var(--border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}
.prompt-textarea {
  flex: 1;
  min-height: 220px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 12px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}
.prompt-textarea:focus {
  border-color: var(--accent);
}
.prompt-textarea::placeholder {
  color: var(--text-muted);
}
.prompt-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.prompt-count {
  font-size: 11px;
  color: var(--text-muted);
}
.clear-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.clear-btn:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

/* ─── Sample pills ───────────────────────────────────────── */
.samples-section {
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
.samples-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.samples-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.sample-pill {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 99px;
  padding: 3px 10px;
  font-size: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.sample-pill:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

/* ─── ScorePanel (right panel) ───────────────────────────── */
.score-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.overall-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.score-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.score-ring-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}
.overall-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.overall-sublabel {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ─── Criterion bars ─────────────────────────────────────── */
.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.criterion {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.criterion-name {
  font-size: 11px;
  color: var(--text-secondary);
}
.criterion-score {
  font-size: 11px;
  font-weight: 600;
}
.criterion-score.green { color: var(--score-green); }
.criterion-score.amber { color: var(--score-amber); }
.criterion-score.red   { color: var(--score-red);   }

.bar-track {
  background: var(--bar-track);
  border-radius: 99px;
  height: 6px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}
.bar-fill.green { background: var(--score-green); }
.bar-fill.amber { background: var(--score-amber); }
.bar-fill.red   { background: var(--score-red);   }

.criterion-tip {
  font-size: 10px;
  color: var(--text-muted);
}

/* ─── Empty state ────────────────────────────────────────── */
.score-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  padding: 40px 20px;
}
.score-empty-icon {
  font-size: 32px;
  opacity: 0.4;
}

/* ─── Responsive (narrow screens) ───────────────────────── */
@media (max-width: 640px) {
  .panels {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .prompt-panel {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
```

- [ ] **Step 2: Verify dev server still renders (no crash)**

```bash
npm run dev
```

Expected: Vite hot-reloads, page visible.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.css
git commit -m "feat: add CSS custom properties for 3 themes and full layout styles"
```

---

## Task 4: ThemeToggle Component

**Files:**
- Create: `client/src/components/ThemeToggle.jsx`

- [ ] **Step 1: Create `client/src/components/ThemeToggle.jsx`**

```jsx
export default function ThemeToggle({ theme, setTheme }) {
  const themes = [
    { key: 'light', icon: '☀️', label: 'Light' },
    { key: 'grey',  icon: '🌥',  label: 'Grey'  },
    { key: 'dark',  icon: '🌙',  label: 'Dark'  },
  ]
  return (
    <div className="theme-toggle">
      {themes.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`theme-btn${theme === key ? ' active' : ''}`}
          onClick={() => setTheme(key)}
          title={label}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === key}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ThemeToggle.jsx
git commit -m "feat: add ThemeToggle component (light/grey/dark)"
```

---

## Task 5: PromptInput Component

**Files:**
- Create: `client/src/components/PromptInput.jsx`

- [ ] **Step 1: Define the three sample prompts**

These will be defined as constants at the top of `PromptInput.jsx`:

```js
const SAMPLES = {
  weak: 'Tell me something about marketing.',
  medium: 'Write a blog post about remote work productivity. Include some tips and make it about 300 words.',
  strong: `Act as a senior content strategist with 10 years of B2B experience. Write a 400-word LinkedIn article for a SaaS founder audience about how async-first remote work boosts engineering productivity. Structure it as: hook (1 sentence), 3 numbered insights with a specific stat or example each, and a CTA. Do not use buzzwords like "synergy" or "leverage". For example, one insight might be: "Buffer saw a 20% reduction in meetings after switching to async standups."`,
}
```

- [ ] **Step 2: Create `client/src/components/PromptInput.jsx`**

```jsx
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
              onKeyDown={e => e.key === 'Enter' && onChange(value)}
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
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/PromptInput.jsx
git commit -m "feat: add PromptInput component with textarea, counter, and sample pills"
```

---

## Task 6: ScorePanel Component

**Files:**
- Create: `client/src/components/ScorePanel.jsx`

- [ ] **Step 1: Create `client/src/components/ScorePanel.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ScorePanel.jsx
git commit -m "feat: add ScorePanel with score ring and 8 criterion bars"
```

---

## Task 7: App.jsx — Wire Everything Together

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/main.jsx` (ensure `App.css` import is there)

- [ ] **Step 1: Replace `client/src/App.jsx` with full implementation**

```jsx
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
```

- [ ] **Step 2: Verify `client/src/main.jsx` imports App.css**

`main.jsx` should look like this (created in Task 1 — verify it's unchanged):

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Run dev server and verify full app works**

```bash
npm run dev
```

Manual checks:
1. Page loads with header "⚡ Prompt Quality Checker"
2. Theme toggle (☀️/🌥/🌙) switches between three themes — verify background colour changes
3. Typing in textarea triggers score after ~500ms — score ring and bars appear
4. Clicking "Clear" empties the textarea and removes the score panel (shows empty state)
5. Clicking a sample pill loads the sample prompt and triggers scoring
6. Refreshing the page — theme is remembered via localStorage
7. Verify score for the "Strong prompt" sample is ≥ 80 overall

- [ ] **Step 4: Run build to verify no errors**

```bash
npm run build
```

Expected: Build succeeds with no errors or warnings in `client/dist/`.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx client/src/main.jsx
git commit -m "feat: wire App.jsx with theme state, debounced scoring, and two-panel layout"
```

---

## Task 8: CI/CD — GitHub Actions + GitHub Pages

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`

Before this task: create a public GitHub repository at `https://github.com/sarathmarson/prompt-quality-checker` and add it as origin:

```bash
git remote add origin https://github.com/sarathmarson/prompt-quality-checker.git
git push -u origin master
```

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
```

- [ ] **Step 2: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: client/dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit CI/CD files**

```bash
git add .github/workflows/ci.yml .github/workflows/release.yml
git commit -m "feat: add GitHub Actions CI and release-to-Pages workflows"
```

- [ ] **Step 4: Push to GitHub and verify CI passes**

```bash
git push origin master
```

Go to `https://github.com/sarathmarson/prompt-quality-checker/actions` — the CI workflow should run and show green.

Expected: `npm test` (22 passing) + `npm run build` both succeed.

- [ ] **Step 5: Enable GitHub Pages**

In the GitHub repository settings:
1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

- [ ] **Step 6: Tag v1.0.0 and trigger deploy**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Go to `https://github.com/sarathmarson/prompt-quality-checker/actions` — the Release workflow should run.

Expected: Build succeeds and deploys to `https://sarathmarson.github.io/prompt-quality-checker/`

- [ ] **Step 7: Verify live URL**

Open `https://sarathmarson.github.io/prompt-quality-checker/` in a browser.

Expected:
- App loads with header "⚡ Prompt Quality Checker"
- Theme toggle works
- Typing in textarea triggers live scoring
- Sample pills load prompts

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in task |
|---|---|
| 8 scoring criteria (clarity, specificity, context, role, format, length, examples, constraints) | Task 2 |
| Scores 0–100, overall = equal-weight average | Task 2 |
| Score colours: green ≥80, amber 50–79, red ≤49 | Task 3, Task 6 |
| Overall labels: Strong/Good/Needs Improvement/Weak | Task 2 |
| Live debounced scoring (500ms) | Task 7 |
| `score()` pure function API with criteria + tips | Task 2 |
| Empty string → all 0, "Weak Prompt" | Task 2 |
| CSS custom properties, 3 themes: light/grey/dark | Task 3 |
| localStorage key `pqc-theme` | Task 7 |
| Falls back to `prefers-color-scheme` | Task 7 |
| `data-theme` on root `.app` div | Task 7 |
| App header with title + subtitle + ThemeToggle | Task 4, Task 7 |
| Two-panel layout: PromptInput left, ScorePanel right | Task 5, Task 6, Task 7 |
| Textarea editable, char/word count, Clear button | Task 5 |
| 3 sample pills (Weak/Medium/Strong) | Task 5 |
| Score ring (circle with overall number) | Task 6 |
| 8 criterion bars with tip text | Task 6 |
| ~16 tests, node:test runner | Task 2 |
| CI: push → test + build | Task 8 |
| Release: v*.*.* tag → GitHub Pages | Task 8 |
| Live URL: sarathmarson.github.io/prompt-quality-checker/ | Task 8 |
| File structure matches spec | Tasks 1–8 |
| Vite config: root='client', base='/prompt-quality-checker/' in prod | Task 1 |

All spec requirements covered. No placeholders. Type signatures consistent across all tasks.
