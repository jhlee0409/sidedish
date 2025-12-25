import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminDb } from '@/lib/firebase-admin'
import { SEO_CONFIG, getProjectSchema, getBreadcrumbSchema, truncateDescription, getCanonicalUrl } from '@/lib/seo-config'
import { ProjectPlatform, PromotionPostsResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'
import MenuDetailClient from './MenuDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const db = getAdminDb()
    const projectDoc = await db.collection('projects').doc(id).get()

    if (!projectDoc.exists) {
      return {
        title: '프로젝트를 찾을 수 없습니다',
        description: '요청하신 프로젝트가 존재하지 않습니다.',
      }
    }

    const project = projectDoc.data()!
    const title = project.title
    const description = truncateDescription(project.shortDescription || project.description, 155)
    const imageUrl = getProjectThumbnail({ imageUrl: project.imageUrl, title: project.title })
    const canonicalUrl = getCanonicalUrl(`/menu/${id}`)

    return {
      title,
      description,
      keywords: [...project.tags, '사이드 프로젝트', '메이커 프로젝트', project.platform],

      alternates: {
        canonical: canonicalUrl,
      },

      openGraph: {
        type: 'article',
        title,
        description,
        url: canonicalUrl,
        siteName: SEO_CONFIG.siteName,
        locale: SEO_CONFIG.locale,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        publishedTime: project.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        modifiedTime: project.updatedAt?.toDate?.()?.toISOString(),
        authors: [project.authorName],
        tags: project.tags,
      },

      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
        creator: SEO_CONFIG.twitterHandle,
      },

      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },

      // Additional meta for AI search optimization
      other: {
        'article:author': project.authorName,
        'article:published_time': project.createdAt?.toDate?.()?.toISOString() || '',
        'article:tag': project.tags.join(', '),
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: '프로젝트',
      description: 'SideDish에서 프로젝트를 확인하세요.',
    }
  }
}

// Server Component for SEO-optimized rendering
export default async function MenuDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetch project data on server for SEO
  const db = getAdminDb()
  const projectDoc = await db.collection('projects').doc(id).get()

  if (!projectDoc.exists) {
    notFound()
  }

  const project = projectDoc.data()!
  const projectData = {
    id: projectDoc.id,
    title: project.title as string,
    shortDescription: project.shortDescription as string,
    description: project.description as string,
    authorName: project.authorName as string,
    authorId: project.authorId as string,
    imageUrl: project.imageUrl as string,
    platform: project.platform as ProjectPlatform,
    tags: (project.tags || []) as string[],
    likes: (project.likes || 0) as number,
    reactions: project.reactions || {},
    link: project.link as string,
    githubUrl: project.githubUrl as string | undefined,
    links: project.links,
    isBeta: project.isBeta as boolean | undefined,
    promotionPosts: project.promotionPosts as PromotionPostsResponse | undefined,
    createdAt: project.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: project.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }

  // Fetch author data
  let authorData: { id: string; name: string; avatarUrl?: string; role?: string } | null = null
  if (project.authorId) {
    try {
      const authorDoc = await db.collection('users').doc(project.authorId).get()
      if (authorDoc.exists) {
        const author = authorDoc.data()!
        authorData = {
          id: authorDoc.id,
          name: author.name,
          avatarUrl: author.avatarUrl,
          role: author.role,
        }
      }
    } catch (error) {
      console.error('Error fetching author:', error)
    }
  }

  // Generate structured data for the project
  const projectSchema = getProjectSchema({
    id: projectData.id,
    title: projectData.title,
    shortDescription: projectData.shortDescription,
    description: projectData.description,
    authorName: projectData.authorName,
    authorId: projectData.authorId,
    imageUrl: projectData.imageUrl,
    platform: projectData.platform,
    tags: projectData.tags,
    createdAt: projectData.createdAt,
    likes: projectData.likes || 0,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: '홈', url: SEO_CONFIG.siteUrl },
    { name: '메뉴판', url: `${SEO_CONFIG.siteUrl}/dashboard` },
    { name: projectData.title, url: `${SEO_CONFIG.siteUrl}/menu/${projectData.id}` },
  ])

  return (
    <>
      {/* JSON-LD Structured Data for this project */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Client Component for interactive features */}
      <MenuDetailClient
        projectId={id}
        initialProject={projectData}
        initialAuthor={authorData}
      />
    </>
  )
}
