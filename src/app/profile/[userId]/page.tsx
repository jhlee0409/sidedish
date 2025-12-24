import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminDb } from '@/lib/firebase-admin'
import { SEO_CONFIG, getPersonSchema, getBreadcrumbSchema, getCanonicalUrl } from '@/lib/seo-config'
import ProfileClient from './ProfileClient'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params

  try {
    const db = getAdminDb()
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return {
        title: '셰프를 찾을 수 없습니다',
        description: '존재하지 않는 사용자입니다.',
      }
    }

    const user = userDoc.data()!

    if (user.isWithdrawn) {
      return {
        title: '탈퇴한 셰프',
        description: '탈퇴한 사용자입니다.',
        robots: { index: false, follow: false },
      }
    }

    const title = `${user.name} Chef`
    const description = `${user.name} 셰프의 사이드 프로젝트를 확인하세요. SideDish에서 메이커들의 창작물을 발견하세요.`
    const canonicalUrl = getCanonicalUrl(`/profile/${userId}`)

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'profile',
        title: `${title} | SideDish`,
        description,
        url: canonicalUrl,
        images: user.avatarUrl ? [{ url: user.avatarUrl, width: 400, height: 400, alt: user.name }] : undefined,
      },
      twitter: {
        card: 'summary',
        title: `${title} | SideDish`,
        description,
        images: user.avatarUrl ? [user.avatarUrl] : undefined,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: '셰프 프로필',
      description: 'SideDish 셰프의 프로필입니다.',
    }
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params

  let userData = null

  try {
    const db = getAdminDb()
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      notFound()
    }

    const user = userDoc.data()!
    userData = {
      id: userDoc.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isWithdrawn: user.isWithdrawn || false,
      createdAt: user.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    notFound()
  }

  // Generate structured data
  const personSchema = getPersonSchema({
    id: userData.id,
    name: userData.name,
    avatarUrl: userData.avatarUrl,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: '홈', url: SEO_CONFIG.siteUrl },
    { name: '메뉴판', url: `${SEO_CONFIG.siteUrl}/dashboard` },
    { name: `${userData.name} Chef`, url: `${SEO_CONFIG.siteUrl}/profile/${userData.id}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <ProfileClient userId={userId} initialUser={userData} />
    </>
  )
}
