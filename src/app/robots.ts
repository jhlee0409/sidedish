import { MetadataRoute } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

/**
 * Robots.txt configuration for SEO
 * Optimized for 2025 with AI crawler considerations
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO_CONFIG.siteUrl

  return {
    rules: [
      {
        // Main search engine crawlers
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/mypage',
          '/menu/register',
          '/menu/edit/',
          '/_next/',
          '/private/',
        ],
      },
      {
        // Google specific rules
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/mypage', '/menu/register', '/menu/edit/'],
      },
      {
        // AI crawlers (ChatGPT, Perplexity, etc.) - Allow for GEO optimization
        userAgent: 'GPTBot',
        allow: ['/', '/dashboard', '/menu/'],
        disallow: ['/api/', '/mypage', '/menu/register', '/menu/edit/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/dashboard', '/menu/'],
        disallow: ['/api/', '/mypage'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/dashboard', '/menu/'],
        disallow: ['/api/', '/mypage'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/dashboard', '/menu/'],
        disallow: ['/api/', '/mypage'],
      },
      {
        // Bing AI
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/mypage', '/menu/register', '/menu/edit/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
