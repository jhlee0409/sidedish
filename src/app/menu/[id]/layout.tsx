import { Metadata } from 'next'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { SITE_URL } from '@/lib/site'

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

async function getProject(id: string) {
  try {
    const db = getAdminDb()
    const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()!
    return {
      title: data.title,
      shortDescription: data.shortDescription,
      authorName: data.authorName,
      platform: data.platform,
      imageUrl: data.imageUrl,
    }
  } catch (error) {
    console.error('Error fetching project for metadata:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    return {
      title: '메뉴를 찾을 수 없습니다 - SideDish',
    }
  }

  const baseUrl = SITE_URL

  // Build OG image URL with project data
  const ogImageParams = new URLSearchParams({
    title: project.title,
    description: project.shortDescription || '',
    author: project.authorName || '',
    platform: project.platform || 'WEB',
  })

  const ogImageUrl = `${baseUrl}/api/og?${ogImageParams.toString()}`

  return {
    title: `${project.title} - SideDish`,
    description: project.shortDescription || `${project.authorName} Chef가 만든 프로젝트`,
    openGraph: {
      title: project.title,
      description: project.shortDescription || `${project.authorName} Chef가 만든 프로젝트`,
      type: 'article',
      url: `${baseUrl}/menu/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
      siteName: 'SideDish',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.shortDescription || `${project.authorName} Chef가 만든 프로젝트`,
      images: [ogImageUrl],
    },
  }
}

export default function MenuDetailLayout({ children }: Props) {
  return <>{children}</>
}
