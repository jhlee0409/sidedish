import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { containsDangerousPatterns } from '@/lib/sanitize-utils'

describe('containsDangerousPatterns', () => {
  // 위험한 패턴 탐지 테스트
  it('should detect XSS attack patterns', () => {
    // script 태그
    expect(containsDangerousPatterns('<script>alert(1)</script>')).toBe(true)
    // javascript: URL
    expect(containsDangerousPatterns('javascript:alert(1)')).toBe(true)
    // 이벤트 핸들러
    expect(containsDangerousPatterns('<img onerror="alert(1)">')).toBe(true)
    // data: URL
    expect(containsDangerousPatterns('data:text/html,<script>alert(1)</script>')).toBe(true)
    // iframe/object/embed
    expect(containsDangerousPatterns('<iframe src="evil.com">')).toBe(true)
    expect(containsDangerousPatterns('<object data="evil.swf">')).toBe(true)
    expect(containsDangerousPatterns('<embed src="evil.swf">')).toBe(true)
  })

  // 안전한 컨텐츠 테스트
  it('should return false for safe content', () => {
    expect(containsDangerousPatterns('Hello World')).toBe(false)
    expect(containsDangerousPatterns('<p>안녕하세요</p>')).toBe(false)
    expect(containsDangerousPatterns('<a href="https://example.com">Link</a>')).toBe(false)
    expect(containsDangerousPatterns('')).toBe(false)
  })

  // 유사 단어 false positive 방지
  it('should not match partial words', () => {
    expect(containsDangerousPatterns('scripting is fun')).toBe(false)
    expect(containsDangerousPatterns('embedded systems')).toBe(false)
  })
})

describe('sanitizePlainText server-side encoding', () => {
  let originalWindow: typeof globalThis.window | undefined

  beforeAll(() => {
    originalWindow = globalThis.window
    // @ts-expect-error - window를 undefined로 설정하여 서버사이드 시뮬레이션
    delete globalThis.window
  })

  afterAll(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow
    }
  })

  it('should encode HTML entities on server-side', async () => {
    vi.resetModules()
    const { sanitizePlainText } = await import('@/lib/sanitize-utils')

    expect(sanitizePlainText('<script>')).toBe('&lt;script&gt;')
    expect(sanitizePlainText('Tom & Jerry')).toBe('Tom &amp; Jerry')
    expect(sanitizePlainText('"Hello"')).toBe('&quot;Hello&quot;')
    expect(sanitizePlainText("It's")).toBe('It&#x27;s')
    expect(sanitizePlainText('Hello World')).toBe('Hello World')
  })
})

describe('sanitizeHtml server-side passthrough', () => {
  let originalWindow: typeof globalThis.window | undefined

  beforeAll(() => {
    originalWindow = globalThis.window
    // @ts-expect-error - window를 undefined로 설정
    delete globalThis.window
  })

  afterAll(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow
    }
  })

  it('should return input as-is on server-side (sanitized on client)', async () => {
    vi.resetModules()
    const { sanitizeHtml } = await import('@/lib/sanitize-utils')

    expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>')
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('<script>alert(1)</script>')
  })
})
