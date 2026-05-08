import React, { useMemo } from 'react'
import DOMPurify from 'dompurify'

/**
 * Renders an admin-supplied HTML string after sanitizing with DOMPurify.
 * Allows the small set of formatting tags TipTap can produce: headings,
 * bold/italic/underline, color (via inline style), text alignment, lists.
 */
export const SafeHtml = ({ html, className = '' }) => {
  const clean = useMemo(() => {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'strong', 'em', 'u', 's', 'mark',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'a',
      ],
      ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel'],
      // Inline styles are needed for color + alignment + font-family from TipTap
      ALLOWED_CSS_PROPERTIES: ['color', 'background-color', 'text-align', 'font-family', 'font-size', 'font-weight'],
    })
  }, [html])

  if (!clean) return null

  return (
    <div
      className={`prose-content ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
