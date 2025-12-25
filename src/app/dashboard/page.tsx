import { Metadata } from 'next'
import { SEO_CONFIG, getCanonicalUrl, getItemListSchema, getBreadcrumbSchema } from '@/lib/seo-config'
import { getAdminDb } from '@/lib/firebase-admin'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: '메뉴판',
  description: '메이커들이 요리한 다양한 사이드 프로젝트를 발견하세요. 웹 서비스, 앱, 게임, 라이브러리 등 영감을 주는 창작물들이 가득합니다.',
  keywords: ['사이드 프로젝트 갤러리', '메이커 작품', '토이 프로젝트', '인디 해커', 'side project showcase'],
  alternates: {
    canonical: getCanonicalUrl('/dashboard'),
  },
  openGraph: {
    title: '메뉴판 | SideDish',
    description: '메이커들이 요리한 다양한 사이드 프로젝트를 발견하세요.',
    url: getCanonicalUrl('/dashboard'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '메뉴판 | SideDish',
    description: '메이커들이 요리한 다양한 사이드 프로젝트를 발견하세요.',
  },
}

export default async function DashboardPage() {
  // Fetch initial projects for SEO (server-side)
  let initialProjects: Array<{
    id: string
    title: string
    shortDescription: string
    imageUrl?: string
  }> = []

  try {
    const db = getAdminDb()
    const projectsSnapshot = await db
      .collection('projects')
      .orderBy('createdAt', 'desc')
      .limit(12)
      .get()

    initialProjects = projectsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        shortDescription: data.shortDescription,
        imageUrl: data.imageUrl,
      }
    })
  } catch (error) {
    console.error('Error fetching initial projects:', error)
  }

  // Generate structured data for project list
  const itemListSchema = getItemListSchema(initialProjects)
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: '홈', url: SEO_CONFIG.siteUrl },
    { name: '메뉴판', url: `${SEO_CONFIG.siteUrl}/dashboard` },
  ])

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <DashboardClient />
    </>
  )
}
