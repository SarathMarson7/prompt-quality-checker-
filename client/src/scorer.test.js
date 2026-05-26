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
  test('detects "for a" phrase', () => {
    const result = score('Write this for a marketing team.')
    assert.ok(result.criteria.context.score >= 60, 'Expected >= 60 when "for a" is present')
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
  test('4 words scores 0', () => {
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
