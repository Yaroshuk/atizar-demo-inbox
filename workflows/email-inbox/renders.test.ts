// @vitest-environment happy-dom
//
// Contract guard: the renderSort render spec must accept summary-only and must NOT
// surface a `counts` key (model contributes prose only; numbers are workflow-projected).
//
// Runs in the default happy-dom environment (NOT `@vitest-environment node`): it imports the
// workflow's client cards, which pull @atizar/react — and the published package bundles the
// browser build of its Markdown deps (decode-named-character-reference), which touch `document`
// at module eval. happy-dom provides it; the assertions themselves are environment-agnostic.
import { describe, it, expect } from 'vitest'
import { emailInboxRenders } from './client.js'
import { EMAIL_INBOX_TOOLS as t } from './tools.js'

describe('renderSort render spec — counts stripped from contract', () => {
  const spec = emailInboxRenders.find((r) => r.toolName === t.renderSort)!

  it('spec exists', () => {
    expect(spec).toBeDefined()
  })

  it('accepts summary-only input', () => {
    expect(spec.parameters.safeParse({ summary: 'ok' }).success).toBe(true)
  })

  it('does NOT surface a counts key (model no longer sends numbers)', () => {
    const result = spec.parameters.safeParse({ summary: 'ok', counts: { reply: 1 } })
    expect('counts' in (result as any).data).toBe(false)
  })
})
