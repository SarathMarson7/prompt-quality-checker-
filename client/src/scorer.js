// scorer.js — pure scoring engine, no imports needed

const VAGUE_WORDS = /\b(something|maybe|kind of|a bit|sort of|stuff|things|whatever)\b/gi

const ACTION_VERBS = /\b(write|list|summarise|summarize|generate|extract|explain|describe|analyse|analyze|compare|create|identify|suggest|provide|review|evaluate|translate|convert|format|return|output)\b/gi

const CONTEXT_PHRASES = /\b(because|the goal is|for a|i need this for|the context is|we are|this is for|in order to|so that)\b/gi

const ROLE_PATTERNS = /\b(act as|you are a|as a [a-z]+|pretend you are|imagine you are|take the role of)\b/gi

const FORMAT_KEYWORDS = /\b(list|table|json|bullet|paragraph|step-by-step|step by step|markdown|numbered|number|format|structure|heading|section|code block|output as)\b/gi

const EXAMPLE_PHRASES = /\b(for example|like this|such as|for instance|here is an example|here's an example)\b|e\.g\./gi

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
  if (count === 1) return { score: 80, tip: '⚠️ Consider adding more background context' }
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
