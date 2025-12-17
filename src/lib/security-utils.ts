/**
 * Enterprise-grade Security Utilities
 *
 * Provides validation, sanitization, and security functions for API endpoints.
 * Following OWASP guidelines and Korean Personal Information Protection Act standards.
 */

import { NextResponse } from 'next/server'

// ============ Constants ============

// Allowed reaction emoji keys (whitelist)
export const ALLOWED_REACTION_KEYS = ['fire', 'clap', 'party', 'idea', 'love'] as const
export type ReactionKey = typeof ALLOWED_REACTION_KEYS[number]

// Allowed platform types
export const ALLOWED_PLATFORMS = ['WEB', 'APP', 'GAME', 'DESIGN', 'OTHER'] as const
export type PlatformType = typeof ALLOWED_PLATFORMS[number]

// Content length limits (in characters)
export const CONTENT_LIMITS = {
  // User
  USER_NAME_MIN: 2,
  USER_NAME_MAX: 20,

  // Project
  PROJECT_TITLE_MAX: 100,
  PROJECT_SHORT_DESC_MAX: 150,
  PROJECT_DESC_MAX: 10000,
  PROJECT_TAGS_MAX_COUNT: 10,
  PROJECT_TAG_MAX_LENGTH: 30,

  // Comment
  COMMENT_MAX: 1000,

  // Whisper
  WHISPER_MAX: 2000,

  // URL
  URL_MAX: 2048,

  // General
  SEARCH_QUERY_MAX: 100,
} as const

// Rate limiting defaults (to be implemented with Redis in production)
export const RATE_LIMITS = {
  // Requests per minute
  PUBLIC_READ: 60,
  AUTHENTICATED_READ: 120,
  AUTHENTICATED_WRITE: 30,
  AI_GENERATE: 10, // Already implemented per day
} as const

// ============ Validation Functions ============

/**
 * Validates that a reaction emoji key is in the whitelist
 */
export function isValidReactionKey(emoji: unknown): emoji is ReactionKey {
  return typeof emoji === 'string' && ALLOWED_REACTION_KEYS.includes(emoji as ReactionKey)
}

/**
 * Validates that a platform type is in the whitelist
 */
export function isValidPlatform(platform: unknown): platform is PlatformType {
  return typeof platform === 'string' && ALLOWED_PLATFORMS.includes(platform as PlatformType)
}

/**
 * Validates and sanitizes a string field
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    patternMessage?: string
  } = {}
): { valid: true; value: string } | { valid: false; error: string } {
  const { required = false, minLength, maxLength, pattern, patternMessage } = options

  // Check if provided
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName}은(는) 필수 항목입니다.` }
    }
    return { valid: true, value: '' }
  }

  // Must be string
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다.` }
  }

  const trimmed = value.trim()

  // Check minimum length
  if (minLength !== undefined && trimmed.length < minLength) {
    return { valid: false, error: `${fieldName}은(는) ${minLength}자 이상이어야 합니다.` }
  }

  // Check maximum length
  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName}은(는) ${maxLength}자 이하여야 합니다.` }
  }

  // Check pattern
  if (pattern && !pattern.test(trimmed)) {
    return { valid: false, error: patternMessage || `${fieldName} 형식이 올바르지 않습니다.` }
  }

  return { valid: true, value: trimmed }
}

/**
 * Validates a URL string
 */
export function validateUrl(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {}
): { valid: true; value: string } | { valid: false; error: string } {
  const { required = false } = options

  if (!value || value === '') {
    if (required) {
      return { valid: false, error: `${fieldName}은(는) 필수 항목입니다.` }
    }
    return { valid: true, value: '' }
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다.` }
  }

  const trimmed = value.trim()

  // Check length
  if (trimmed.length > CONTENT_LIMITS.URL_MAX) {
    return { valid: false, error: `${fieldName}이(가) 너무 깁니다.` }
  }

  // Validate URL format
  try {
    const url = new URL(trimmed)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: `${fieldName}은(는) http 또는 https 프로토콜만 허용됩니다.` }
    }

    // Block dangerous schemes and localhost in production
    if (process.env.NODE_ENV === 'production') {
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return { valid: false, error: `${fieldName}에 로컬 주소는 사용할 수 없습니다.` }
      }
    }

    return { valid: true, value: trimmed }
  } catch {
    return { valid: false, error: `${fieldName} 형식이 올바르지 않습니다.` }
  }
}

/**
 * Validates an array of tags
 */
export function validateTags(
  value: unknown,
  fieldName: string = '태그'
): { valid: true; value: string[] } | { valid: false; error: string } {
  if (!value) {
    return { valid: true, value: [] }
  }

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName}은(는) 배열이어야 합니다.` }
  }

  if (value.length > CONTENT_LIMITS.PROJECT_TAGS_MAX_COUNT) {
    return { valid: false, error: `${fieldName}은(는) ${CONTENT_LIMITS.PROJECT_TAGS_MAX_COUNT}개 이하여야 합니다.` }
  }

  const sanitizedTags: string[] = []
  const seenTags = new Set<string>()

  for (const tag of value) {
    if (typeof tag !== 'string') {
      return { valid: false, error: `${fieldName}에는 문자열만 포함할 수 있습니다.` }
    }

    const trimmed = tag.trim().toLowerCase()

    if (trimmed.length === 0) continue // Skip empty tags

    if (trimmed.length > CONTENT_LIMITS.PROJECT_TAG_MAX_LENGTH) {
      return { valid: false, error: `각 ${fieldName}은(는) ${CONTENT_LIMITS.PROJECT_TAG_MAX_LENGTH}자 이하여야 합니다.` }
    }

    // Deduplicate
    if (!seenTags.has(trimmed)) {
      seenTags.add(trimmed)
      sanitizedTags.push(trimmed)
    }
  }

  return { valid: true, value: sanitizedTags }
}

/**
 * Validates pagination limit parameter
 */
export function validateLimit(
  value: string | null,
  defaultLimit: number = 20,
  maxLimit: number = 50
): number {
  if (!value) return defaultLimit

  const parsed = parseInt(value, 10)

  // NaN check - return default if invalid
  if (Number.isNaN(parsed)) return defaultLimit

  // Clamp to valid range
  return Math.min(Math.max(1, parsed), maxLimit)
}

/**
 * Validates search query parameter
 */
export function validateSearchQuery(value: string | null): string {
  if (!value) return ''

  const trimmed = value.trim().toLowerCase()

  // Limit length to prevent memory exhaustion
  if (trimmed.length > CONTENT_LIMITS.SEARCH_QUERY_MAX) {
    return trimmed.slice(0, CONTENT_LIMITS.SEARCH_QUERY_MAX)
  }

  return trimmed
}

// ============ Sanitization Functions ============

/**
 * Basic HTML entity encoding to prevent XSS
 * For more robust protection, use a library like DOMPurify on the client
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char])
}

/**
 * Removes potential script injection patterns
 */
export function sanitizeText(text: string): string {
  // Remove script tags and event handlers
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data-blocked:')
}

// ============ Response Helpers ============

export function badRequestResponse(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 })
}

export function forbiddenResponse(error: string = '권한이 없습니다.'): NextResponse {
  return NextResponse.json({ error }, { status: 403 })
}

export function notFoundResponse(error: string = '리소스를 찾을 수 없습니다.'): NextResponse {
  return NextResponse.json({ error }, { status: 404 })
}

export function rateLimitResponse(error: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'): NextResponse {
  return NextResponse.json({ error }, { status: 429 })
}

// ============ ID Validation ============

/**
 * Validates Firebase-style document IDs
 * Firebase auto-generated IDs are 20 characters, alphanumeric
 */
export function isValidDocumentId(id: unknown): boolean {
  if (typeof id !== 'string') return false
  // Allow reasonable ID formats (Firebase generates 20-char IDs, but custom IDs could vary)
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id)
}
