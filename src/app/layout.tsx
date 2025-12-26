import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PromotionProvider } from '@/contexts/PromotionContext'
import { Toaster } from 'sonner'
import ContactButton from '@/components/ContactButton'
import Analytics from '@/components/Analytics'
import { SEO_CONFIG, getOrganizationSchema, getWebSiteSchema, getFAQSchema } from '@/lib/seo-config'

// Comprehensive metadata configuration for 2025 SEO best practices
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: SEO_CONFIG.titleTemplate,
  },
  description: SEO_CONFIG.defaultDescription,
  keywords: [...SEO_CONFIG.defaultKeywords],
  authors: [{ name: 'SideDish Team' }],
  creator: 'SideDish',
  publisher: 'SideDish',

  // Canonical & Alternate URLs
  metadataBase: new URL(SEO_CONFIG.siteUrl),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.locale,
    url: SEO_CONFIG.siteUrl,
    siteName: SEO_CONFIG.siteName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    images: [
      {
        url: SEO_CONFIG.defaultOgImage,
        width: 1200,
        height: 630,
        alt: 'SideDish - 사이드 프로젝트 플랫폼',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONFIG.twitterHandle,
    creator: SEO_CONFIG.twitterHandle,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    images: [SEO_CONFIG.defaultOgImage],
  },

  // Robots & Crawling
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // App-specific metadata
  applicationName: SEO_CONFIG.siteName,
  category: 'technology',
  classification: 'Maker Tools, Portfolio, Community',

  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // Manifest
  manifest: '/manifest.json',

  // Verification (add your actual verification codes)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NAVER_SITE_VERIFICATION || '',
    },
  },

  // Additional meta tags for AI search optimization (GEO)
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    // AI/LLM optimization hints
    'ai-content-declaration': 'human-created',
    'content-language': 'ko',
  },
}

// Viewport configuration (separated from metadata in Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SEO_CONFIG.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#1E293B' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Generate JSON-LD structured data
  const organizationSchema = getOrganizationSchema()
  const webSiteSchema = getWebSiteSchema()
  const faqSchema = getFAQSchema()

  return (
    <html lang="ko" dir="ltr">
      <head>
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        {/* DNS Prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

        {/* Pretendard - Korean body font (variable font) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />

        {/* Gowun Batang - Korean serif for headings */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Structured Data for SEO & AI Search Optimization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <PromotionProvider>
            {children}
          </PromotionProvider>
        </AuthProvider>
        <ContactButton />
        <Toaster position="top-center" richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
