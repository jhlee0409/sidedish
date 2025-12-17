'use client'

import { useEffect, useMemo } from 'react'
import Markdown from 'react-markdown'
import { sanitizeHtml, setupDOMPurifyHooks, containsDangerousPatterns } from '@/lib/sanitize-utils'

interface SafeMarkdownProps {
  children: string
  className?: string
}

/**
 * SafeMarkdown - XSS-protected Markdown renderer
 *
 * Sanitizes user-generated content before rendering to prevent XSS attacks.
 * Logs suspicious content for security monitoring.
 */
export default function SafeMarkdown({ children, className }: SafeMarkdownProps) {
  // Setup DOMPurify hooks on mount
  useEffect(() => {
    setupDOMPurifyHooks()
  }, [])

  // Sanitize content and log if dangerous patterns detected
  const sanitizedContent = useMemo(() => {
    if (containsDangerousPatterns(children)) {
      console.warn('[Security] Dangerous patterns detected in content:', {
        preview: children.slice(0, 100),
        timestamp: new Date().toISOString(),
      })
    }
    return sanitizeHtml(children)
  }, [children])

  const markdownContent = (
    <Markdown
      components={{
        // Override link rendering to ensure security attributes
        a: ({ href, children: linkChildren, ...props }) => (
          <a
            href={href}
            target={href?.startsWith('/') || href?.startsWith('#') ? undefined : '_blank'}
            rel={href?.startsWith('/') || href?.startsWith('#') ? undefined : 'noopener noreferrer nofollow'}
            {...props}
          >
            {linkChildren}
          </a>
        ),
        // Block potentially dangerous elements
        script: () => null,
        iframe: () => null,
        object: () => null,
        embed: () => null,
      }}
    >
      {sanitizedContent}
    </Markdown>
  )

  // Wrap with className if provided
  if (className) {
    return <div className={className}>{markdownContent}</div>
  }

  return markdownContent
}
