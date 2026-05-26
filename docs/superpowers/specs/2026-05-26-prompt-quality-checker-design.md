# Prompt Quality Checker — Design Spec

**Date:** 2026-05-26
**Status:** Approved
**Project:** `C:\Users\Sarath Marson\prompt-quality-checker\`

---

## Overview

A fully static React + Vite web app that lets users paste any AI prompt and instantly see a quality score across 8 criteria. No backend, no API key, no server — pure client-side JavaScript. Deploys 100% to GitHub Pages. The scoring engine is a pure function that analyses the prompt text using pattern matching and heuristics.

**Live scoring:** Results update automatically as the user types (debounced 500 ms). No "Analyse" button needed.

---

## Scoring Criteria

All 8 criteria are scored 0–100. Overall score = equal-weight average of all 8.

| Criterion | What is checked |
|---|---|
| **Clarity** | Penalises vague filler words: *something, maybe, kind of, a bit, sort of, stuff, things, whatever* |
| **Specificity** | Rewards numbers, measurable targets, named outputs, strong action verbs (*write, list, summarise, generate, extract*) |
| **Context** | Detects background phrases: *because, the goal is, for a, I need this for, the context is, we are, this is for* |
| **Role / Persona** | Detects *"act as", "you are a", "as a [role]", "pretend you are"* patterns |
| **Output Format** | Detects format keywords: *list, table, JSON, bullet, paragraph, step-by-step, markdown, numbered* |
| **Length** | Penalises <10 words (too vague) and >500 words (too cluttered); sweet spot 20–150 words = 100 |
| **Examples** | Detects *"for example", "like this", "such as", "e.g.", "for instance", "here is an example"* |
| **Constraints** | Detects *"do not", "avoid", "only", "must not", "never", "don't", "exclude", "without"* |

### Score colours

| Range | Colour | Label |
|---|---|---|
| 80–100 | Green `#10b981` | ✅ Strong |
| 50–79 | Amber `#f59e0b` | ⚠️ Needs work |
| 0–49 | Red `#ef4444` | ❌ Missing |

### Overall score labels

| Range | Label |
|---|---|
| 85–100 | Strong Prompt |
| 65–84 | Good Prompt |
| 40–64 | Needs Improvement |
| 0–39 | Weak Prompt |

---

## Architecture

### Fully static — no backend

The app is a single Vite + React SPA. No Express server, no API calls, no environment variables. The `scorer.js` module exports a pure function — same input always produces same output, fully unit-testable with Node's built-in test runner.

### File structure

```
prompt-quality-checker/
├── client/
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Root: layout, theme state, debounced score
│       ├── App.css               # CSS custom properties — light/grey/dark themes
│       ├── scorer.js             # Pure scoring engine — 8 criteria functions
│       ├── scorer.test.js        # Node built-in test runner — one test per criterion
│       └── components/
│           ├── PromptInput.jsx   # Left panel: textarea, char/word count, sample pills
│           ├── ScorePanel.jsx    # Right panel: score ring, 8 criterion bars + tips
│           └── ThemeToggle.jsx   # ☀️/🌥/🌙 toggle (same pattern as ai-trust-chat)
├── vite.config.js                # root: 'client', base: '/prompt-quality-checker/' in prod
├── package.json                  # scripts: dev, build, test
├── .gitignore
└── .github/
    └── workflows/
        ├── ci.yml                # test + build on every push/PR
        └── release.yml           # deploy to GitHub Pages on v*.*.* tag
```

---

## UI Layout

### App Header (full width)

```
┌────────────────────────────────────────────────────┐
│  ⚡ Prompt Quality Checker   [subtitle]   ☀️ 🌥 🌙  │
└────────────────────────────────────────────────────┘
```

- Left: app title + subtitle ("Paste any AI prompt and see how to improve it")
- Right: ThemeToggle (☀️/🌥/🌙)

### Two-panel body

```
┌─────────────────────────┬──────────────────────────┐
│  YOUR PROMPT            │  QUALITY SCORE           │
│                         │                          │
│  [textarea — editable]  │  ◯ 87  Strong Prompt     │
│                         │                          │
│  178 chars · 32 words   │  Clarity      ████ 90 ✅ │
│  [Clear]                │  Specificity  ███░ 85 ✅  │
│                         │  Context      ██░░ 60 ⚠️  │
│  Try a sample:          │  Role         ████ 100 ✅ │
│  [Weak] [Medium][Strong]│  Format       ████ 90 ✅  │
│                         │  Length       ████ 100 ✅ │
│                         │  Examples     ░░░░  0 ❌  │
│                         │  Constraints  ████ 100 ✅ │
└─────────────────────────┴──────────────────────────┘
```

### Sample prompts (3 pills in left panel)

Three clickable pills that load pre-written prompts to demonstrate the scorer:

- **Weak** — vague, no role, no format, no constraints (~score 15)
- **Medium** — has some structure but missing examples and context (~score 55)
- **Strong** — full role, format, constraints, context, examples (~score 90)

---

## Theming

Same CSS custom properties approach as ai-trust-chat. `data-theme` attribute on root `<div class="app">`. Three themes: `light` (default), `grey`, `dark`. localStorage key: `pqc-theme`. Falls back to `prefers-color-scheme` on first visit.

### CSS variables per theme (same structure as ai-trust-chat)

```css
[data-theme="light"] {
  --bg-base: #f8fafc; --bg-panel: #f1f5f9; --bg-input: #ffffff;
  --border: #cbd5e1; --text-primary: #1e293b; --text-secondary: #475569;
  --text-muted: #94a3b8; --accent: #6366f1;
}
[data-theme="grey"] {
  --bg-base: #1e2330; --bg-panel: #252d3d; --bg-input: #2d3748;
  --border: #374151; --text-primary: #e2e8f0; --text-secondary: #94a3b8;
  --text-muted: #64748b; --accent: #818cf8;
}
[data-theme="dark"] {
  --bg-base: #0f1117; --bg-panel: #161925; --bg-input: #1e2333;
  --border: #2d3553; --text-primary: #e2e8f0; --text-secondary: #94a3b8;
  --text-muted: #64748b; --accent: #6366f1;
}
```

---

## Scorer API

```js
// scorer.js — pure function, no imports needed
export function score(text) {
  // returns:
  {
    overall: Number,          // 0–100, average of all criteria
    label: String,            // "Strong Prompt" | "Good Prompt" | "Needs Improvement" | "Weak Prompt"
    criteria: {
      clarity:     { score: Number, tip: String },
      specificity: { score: Number, tip: String },
      context:     { score: Number, tip: String },
      role:        { score: Number, tip: String },
      format:      { score: Number, tip: String },
      length:      { score: Number, tip: String },
      examples:    { score: Number, tip: String },
      constraints: { score: Number, tip: String },
    }
  }
}
```

Empty string input → all scores 0, label "Weak Prompt".

---

## Testing

`client/src/scorer.test.js` — uses Node built-in `node:test`. One `describe` block per criterion + one for overall. Run with `npm test`.

```js
// example tests
test('clarity: penalises vague words', () => { ... })
test('role: detects "act as" pattern', () => { ... })
test('length: 5 words scores 0', () => { ... })
test('length: 30 words scores 100', () => { ... })
test('overall: empty string scores 0', () => { ... })
```

Target: ~16 tests covering all 8 criteria + edge cases.

---

## CI/CD

Identical pipeline to ai-trust-chat:

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | Every push + PR | npm ci → npm test → npm run build |
| `release.yml` | Tag `v*.*.*` | npm ci → npm run build (NODE_ENV=production) → deploy `client/dist/` to GitHub Pages |

**Live URL after first release:** `https://sarathmarson.github.io/prompt-quality-checker/`

---

## localStorage Key

`pqc-theme` — stores `'light'`, `'grey'`, or `'dark'`

---

## Out of Scope

- AI/LLM scoring (pure rules only)
- Saving/history of past prompts
- User accounts
- Sharing results via URL
- Mobile-specific layout (desktop-first, readable on mobile but not optimised)
- More than 3 themes
