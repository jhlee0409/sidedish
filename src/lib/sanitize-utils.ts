/**
 * Client-side Content Sanitization Utilities
 *
 * Uses DOMPurify to prevent XSS attacks on user-generated content.
 * This file should only be imported in client components.
 */

import DOMPurify, { Config } from 'dompurify'

// DOMPurify configuration for maximum safety
const PURIFY_CONFIG: Config = {
  // Allow safe HTML elements
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'hr',
  ],
  // Allow safe attributes
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  // Force all links to open in new tab with noopener
  ADD_ATTR: ['target', 'rel'],
  // Prevent javascript: URLs
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Remove data: URLs to prevent data exfiltration
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  // Strip dangerous tags completely
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
}

// Stricter config for plain text (comments, whispers)
const PLAINTEXT_CONFIG: Config = {
  ALLOWED_TAGS: [], // No HTML allowed
  KEEP_CONTENT: true, // Keep text content
}

/**
 * Sanitize HTML content (for Markdown-rendered content)
 * Removes dangerous scripts while preserving safe formatting
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (will be sanitized on client)
    return dirty
  }
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG)
}

/**
 * Sanitize plain text content (for comments, whispers)
 * Strips all HTML, leaving only text
 */
export function sanitizePlainText(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic HTML entity encoding
    return dirty
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
  return DOMPurify.sanitize(dirty, PLAINTEXT_CONFIG)
}

/**
 * Hook to add security attributes to all links
 * Call this after DOMPurify is loaded
 */
export function setupDOMPurifyHooks(): void {
  if (typeof window === 'undefined') return

  // Add hooks to ensure all links are safe
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      // Force external links to open in new tab with security attributes
      const href = node.getAttribute('href')
      if (href && !href.startsWith('/') && !href.startsWith('#')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer nofollow')
      }
    }
  })
}

/**
 * Check if content contains potentially dangerous patterns
 * Use for logging/monitoring purposes
 */
export function containsDangerousPatterns(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ]

  return dangerousPatterns.some(pattern => pattern.test(content))
}
