import { describe, expect, it } from 'vitest'
import { allowedOrigin, originPatterns } from '../src/origins'

const preview = { ALLOWED_ORIGINS: 'https://chroma9-survivors.pages.dev,https://*.chroma9-survivors.pages.dev' }

describe('isolated Cloudflare Pages preview origin policy', () => {
  it('accepts the project, branch preview and deployment-specific URLs', () => {
    expect(allowedOrigin(preview, 'https://chroma9-survivors.pages.dev')).toBe(true)
    expect(allowedOrigin(preview, 'https://updated-11-3-2026.chroma9-survivors.pages.dev')).toBe(true)
    expect(allowedOrigin(preview, 'https://95a1deee.chroma9-survivors.pages.dev')).toBe(true)
  })

  it('never permits unrelated or nested subdomains, alternate schemes, or prefix/suffix lookalikes', () => {
    for (const origin of [
      'https://unrelated.pages.dev',
      'https://chroma9-survivors.pages.dev.evil.test',
      'https://nested.preview.chroma9-survivors.pages.dev',
      'http://95a1deee.chroma9-survivors.pages.dev',
      'https://fakechroma9-survivors.pages.dev',
      'https://a.chroma9-survivors.pages.dev.evil.test',
    ]) expect(allowedOrigin(preview, origin), origin).toBe(false)
  })

  it('preserves local development and ensures wildcard matching exactly one hostname label', () => {
    expect(allowedOrigin(preview, 'http://localhost:5173')).toBe(true)
    expect(allowedOrigin(preview, 'http://127.0.0.1:8791')).toBe(true)
    const [pattern] = originPatterns('https://*.chroma9-survivors.pages.dev')
    expect(pattern.test('https://build-1.chroma9-survivors.pages.dev')).toBe(true)
    expect(pattern.test('https://x.y.chroma9-survivors.pages.dev')).toBe(false)
  })
})
