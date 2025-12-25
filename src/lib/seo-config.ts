/**
 * SEO Configuration for SideDish
 * 2025 SEO Best Practices & AI Search Optimization (GEO)
 */

import { SITE_URL, TWITTER_HANDLE } from './site'

export const SEO_CONFIG = {
  siteName: 'SideDish',
  siteUrl: SITE_URL,
  defaultTitle: 'SideDish - 메이커가 요리한 맛있는 사이드 프로젝트',
  titleTemplate: '%s | SideDish',
  defaultDescription:
    '개발은 당신이, 플레이팅은 AI가. 하드디스크 속 잠든 코드를 세상 밖 메인 디시로 만들어주는 사이드 프로젝트 맛집입니다. 메이커들의 창작물을 발견하고 영감을 얻어보세요.',
  defaultKeywords: [
    '사이드 프로젝트',
    '메이커',
    '토이 프로젝트',
    '메이커 커뮤니티',
    '프로젝트 공유',
    '인디 해커',
    '1인 창업',
    '사이드 허슬',
    '창작물 갤러리',
    'side project',
    'maker',
    'indie hacker',
    'maker community',
    'side hustle',
  ],
  locale: 'ko_KR',
  language: 'ko',
  twitterHandle: TWITTER_HANDLE,
  defaultOgImage: '/sidedish_og_thumbnail.png',
  themeColor: '#F97316', // Orange-500
  backgroundColor: '#F8FAFC', // Slate-50
} as const

/**
 * Platform-specific descriptions for SEO
 */
export const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  WEB: '웹 서비스',
  APP: '모바일 앱',
  GAME: '게임',
  EXTENSION: '브라우저 확장 프로그램',
  LIBRARY: '개발 라이브러리',
  DESIGN: '디자인 에셋',
  OTHER: '기타 프로젝트',
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string = ''): string {
  const baseUrl = SEO_CONFIG.siteUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Generate page title with template
 */
export function getPageTitle(title?: string): string {
  if (!title) return SEO_CONFIG.defaultTitle
  return SEO_CONFIG.titleTemplate.replace('%s', title)
}

/**
 * Truncate text for meta description (optimal: 150-160 chars)
 */
export function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * Generate Open Graph image URL
 */
export function getOgImageUrl(params?: {
  title?: string
  description?: string
  imageUrl?: string
}): string {
  if (params?.imageUrl) return params.imageUrl

  const baseUrl = SEO_CONFIG.siteUrl
  if (params?.title) {
    const searchParams = new URLSearchParams()
    searchParams.set('title', params.title)
    if (params.description) {
      searchParams.set('description', truncateDescription(params.description, 100))
    }
    return `${baseUrl}/api/og?${searchParams.toString()}`
  }

  return `${baseUrl}${SEO_CONFIG.defaultOgImage}`
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/sidedish_logo.png`,
    description: SEO_CONFIG.defaultDescription,
    sameAs: [
      // Add social media URLs when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Korean', 'English'],
    },
  }
}

/**
 * Generate JSON-LD structured data for WebSite
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.defaultDescription,
    inLanguage: SEO_CONFIG.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/dashboard?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate JSON-LD structured data for a Project (SoftwareApplication)
 */
export function getProjectSchema(project: {
  id: string
  title: string
  shortDescription: string
  description: string
  authorName: string
  authorId: string
  imageUrl?: string
  platform: string
  tags: string[]
  createdAt: string
  likes: number
}) {
  const platformType = getPlatformApplicationCategory(project.platform)

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.shortDescription,
    url: `${SEO_CONFIG.siteUrl}/menu/${project.id}`,
    image: project.imageUrl || getOgImageUrl({ title: project.title }),
    applicationCategory: platformType,
    author: {
      '@type': 'Person',
      name: project.authorName,
      url: `${SEO_CONFIG.siteUrl}/profile/${project.authorId}`,
    },
    datePublished: project.createdAt,
    keywords: project.tags.join(', '),
    aggregateRating: project.likes > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, 3 + (project.likes / 10)), // Approximate rating based on likes
      ratingCount: project.likes,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
  }
}

/**
 * Generate JSON-LD structured data for BreadcrumbList
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate JSON-LD structured data for Person (Author profile)
 */
export function getPersonSchema(user: {
  id: string
  name: string
  avatarUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.name,
    url: `${SEO_CONFIG.siteUrl}/profile/${user.id}`,
    image: user.avatarUrl,
  }
}

/**
 * Generate JSON-LD structured data for ItemList (Project gallery)
 */
export function getItemListSchema(projects: Array<{
  id: string
  title: string
  shortDescription: string
  imageUrl?: string
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.shortDescription,
        url: `${SEO_CONFIG.siteUrl}/menu/${project.id}`,
        image: project.imageUrl,
      },
    })),
  }
}

/**
 * Map platform to schema.org application category
 */
function getPlatformApplicationCategory(platform: string): string {
  const categoryMap: Record<string, string> = {
    WEB: 'WebApplication',
    APP: 'MobileApplication',
    GAME: 'GameApplication',
    EXTENSION: 'BrowserApplication',
    LIBRARY: 'DeveloperApplication',
    DESIGN: 'DesignApplication',
    OTHER: 'Application',
  }
  return categoryMap[platform] || 'Application'
}

/**
 * Generate FAQ structured data for landing page
 */
export function getFAQSchema() {
  const faqs = [
    {
      question: 'SideDish는 무엇인가요?',
      answer: 'SideDish는 메이커들이 자신의 사이드 프로젝트를 공유하고 다른 메이커들의 작품을 발견할 수 있는 플랫폼입니다. AI가 프로젝트 설명을 매력적으로 다듬어주어 더 효과적으로 프로젝트를 소개할 수 있습니다.',
    },
    {
      question: '프로젝트를 어떻게 등록하나요?',
      answer: 'Google 또는 GitHub 계정으로 로그인한 후, "메뉴 등록" 버튼을 클릭하여 프로젝트 정보를 입력하면 됩니다. AI가 자동으로 매력적인 메뉴 설명을 생성해 드립니다.',
    },
    {
      question: '비용이 드나요?',
      answer: 'SideDish는 완전히 무료입니다. 프로젝트 등록, 검색, 피드백 기능 모두 무료로 이용할 수 있습니다.',
    },
    {
      question: '어떤 종류의 프로젝트를 등록할 수 있나요?',
      answer: '웹 서비스, 모바일 앱, 게임, 브라우저 확장 프로그램, 개발 라이브러리, 디자인 에셋 등 모든 종류의 사이드 프로젝트를 등록할 수 있습니다.',
    },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
