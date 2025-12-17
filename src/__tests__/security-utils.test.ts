import { describe, it, expect } from 'vitest'
import {
  isValidReactionKey,
  isValidPlatform,
  validateString,
  validateUrl,
  validateTags,
  validateLimit,
  validateSearchQuery,
  escapeHtml,
  sanitizeText,
  isValidDocumentId,
  ALLOWED_REACTION_KEYS,
  ALLOWED_PLATFORMS,
  CONTENT_LIMITS,
} from '@/lib/security-utils'

describe('isValidReactionKey', () => {
  it('should accept valid reaction keys', () => {
    ALLOWED_REACTION_KEYS.forEach(key => {
      expect(isValidReactionKey(key)).toBe(true)
    })
  })

  it('should reject invalid reaction keys', () => {
    expect(isValidReactionKey('invalid')).toBe(false)
    expect(isValidReactionKey('')).toBe(false)
    expect(isValidReactionKey(null)).toBe(false)
    expect(isValidReactionKey(123)).toBe(false)
  })
})

describe('isValidPlatform', () => {
  it('should accept valid platforms', () => {
    ALLOWED_PLATFORMS.forEach(platform => {
      expect(isValidPlatform(platform)).toBe(true)
    })
  })

  it('should reject invalid platforms', () => {
    expect(isValidPlatform('INVALID')).toBe(false)
    expect(isValidPlatform('web')).toBe(false) // case sensitive
    expect(isValidPlatform(null)).toBe(false)
  })
})

describe('validateString', () => {
  it('should pass valid strings', () => {
    const result = validateString('hello', '필드')
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toBe('hello')
  })

  it('should trim whitespace', () => {
    const result = validateString('  hello  ', '필드')
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toBe('hello')
  })

  it('should enforce required field', () => {
    expect(validateString('', '필드', { required: true }).valid).toBe(false)
    expect(validateString(null, '필드', { required: true }).valid).toBe(false)
    expect(validateString(undefined, '필드', { required: true }).valid).toBe(false)
  })

  it('should enforce min/max length', () => {
    expect(validateString('ab', '필드', { minLength: 3 }).valid).toBe(false)
    expect(validateString('abcdef', '필드', { maxLength: 5 }).valid).toBe(false)
    expect(validateString('abc', '필드', { minLength: 3, maxLength: 5 }).valid).toBe(true)
  })

  it('should validate pattern', () => {
    const result = validateString('abc123', '필드', {
      pattern: /^[a-z]+$/,
      patternMessage: '영문 소문자만 가능',
    })
    expect(result.valid).toBe(false)
  })

  it('should reject non-string types', () => {
    expect(validateString(123, '필드').valid).toBe(false)
    expect(validateString({}, '필드').valid).toBe(false)
  })
})

describe('validateUrl', () => {
  it('should accept valid URLs', () => {
    expect(validateUrl('https://example.com', 'URL').valid).toBe(true)
    expect(validateUrl('http://example.com/path', 'URL').valid).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url', 'URL').valid).toBe(false)
    expect(validateUrl('ftp://example.com', 'URL').valid).toBe(false) // only http/https
    expect(validateUrl('javascript:alert(1)', 'URL').valid).toBe(false)
  })

  it('should handle empty values based on required option', () => {
    expect(validateUrl('', 'URL').valid).toBe(true)
    expect(validateUrl('', 'URL', { required: true }).valid).toBe(false)
  })

  it('should reject overly long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(CONTENT_LIMITS.URL_MAX)
    expect(validateUrl(longUrl, 'URL').valid).toBe(false)
  })
})

describe('validateTags', () => {
  it('should accept valid tags array', () => {
    const result = validateTags(['tag1', 'tag2'])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toEqual(['tag1', 'tag2'])
  })

  it('should trim and lowercase tags', () => {
    const result = validateTags(['  TAG1  ', 'Tag2'])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toEqual(['tag1', 'tag2'])
  })

  it('should deduplicate tags', () => {
    const result = validateTags(['tag', 'TAG', '  tag  '])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toEqual(['tag'])
  })

  it('should filter empty tags', () => {
    const result = validateTags(['tag1', '', '  ', 'tag2'])
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.value).toEqual(['tag1', 'tag2'])
  })

  it('should reject too many tags', () => {
    const manyTags = Array.from({ length: CONTENT_LIMITS.PROJECT_TAGS_MAX_COUNT + 1 }, (_, i) => `tag${i}`)
    expect(validateTags(manyTags).valid).toBe(false)
  })

  it('should reject tags that are too long', () => {
    const result = validateTags(['a'.repeat(CONTENT_LIMITS.PROJECT_TAG_MAX_LENGTH + 1)])
    expect(result.valid).toBe(false)
  })

  it('should handle empty/null input', () => {
    expect(validateTags(null).valid).toBe(true)
    expect(validateTags(undefined).valid).toBe(true)
  })
})

describe('validateLimit', () => {
  it('should return default for null/empty', () => {
    expect(validateLimit(null)).toBe(20)
    expect(validateLimit(null, 10)).toBe(10)
  })

  it('should parse valid numbers', () => {
    expect(validateLimit('5')).toBe(5)
    expect(validateLimit('30')).toBe(30)
  })

  it('should clamp to max limit', () => {
    expect(validateLimit('100', 20, 50)).toBe(50)
  })

  it('should handle minimum of 1', () => {
    expect(validateLimit('0')).toBe(1)
    expect(validateLimit('-5')).toBe(1)
  })

  it('should return default for NaN', () => {
    expect(validateLimit('abc')).toBe(20)
    expect(validateLimit('12.5abc')).toBe(12) // parseInt behavior
  })
})

describe('validateSearchQuery', () => {
  it('should lowercase and trim', () => {
    expect(validateSearchQuery('  HELLO  ')).toBe('hello')
  })

  it('should handle empty values', () => {
    expect(validateSearchQuery(null)).toBe('')
    expect(validateSearchQuery('')).toBe('')
  })

  it('should truncate long queries', () => {
    const longQuery = 'a'.repeat(CONTENT_LIMITS.SEARCH_QUERY_MAX + 50)
    const result = validateSearchQuery(longQuery)
    expect(result.length).toBe(CONTENT_LIMITS.SEARCH_QUERY_MAX)
  })
})

describe('escapeHtml', () => {
  it('should escape dangerous characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
    expect(escapeHtml("'test'")).toBe('&#x27;test&#x27;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('path/to')).toBe('path&#x2F;to')
  })

  it('should handle safe strings', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
    expect(escapeHtml('안녕하세요')).toBe('안녕하세요')
  })
})

describe('sanitizeText', () => {
  it('should remove script tags', () => {
    expect(sanitizeText('<script>alert(1)</script>')).toBe('')
    expect(sanitizeText('before<script>evil</script>after')).toBe('beforeafter')
  })

  it('should remove event handlers', () => {
    expect(sanitizeText('<img onerror="alert(1)">')).not.toContain('onerror=')
  })

  it('should block javascript: and data: URLs', () => {
    expect(sanitizeText('javascript:alert(1)')).not.toContain('javascript:')
    expect(sanitizeText('data:text/html')).toContain('data-blocked:')
  })
})

describe('isValidDocumentId', () => {
  it('should accept valid Firebase-style IDs', () => {
    expect(isValidDocumentId('abc123')).toBe(true)
    expect(isValidDocumentId('a1b2c3d4e5f6g7h8i9j0')).toBe(true)
    expect(isValidDocumentId('user_123-abc')).toBe(true)
  })

  it('should reject invalid IDs', () => {
    expect(isValidDocumentId('')).toBe(false)
    expect(isValidDocumentId(null)).toBe(false)
    expect(isValidDocumentId(123)).toBe(false)
    expect(isValidDocumentId('id with spaces')).toBe(false)
    expect(isValidDocumentId('id/path')).toBe(false)
    expect(isValidDocumentId('a'.repeat(129))).toBe(false)
  })
})
