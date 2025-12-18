import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { DigestCategory, SupportedCity } from '@/lib/digest-types'

/** 관리자 인증 검증 (간단한 시크릿 기반) */
function verifyAdminSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET
  if (!adminSecret) {
    console.warn('ADMIN_SECRET is not configured')
    return false
  }

  return authHeader === `Bearer ${adminSecret}`
}

// 시드 데이터
const SEED_DIGESTS: Array<{
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: DigestCategory
  isActive: boolean
  isPremium: boolean
  config: {
    cities?: SupportedCity[]
    deliveryTime: string
  }
}> = [
  {
    id: 'weather-digest',
    name: '날씨 도시락',
    slug: 'weather',
    description:
      '매일 아침 오늘의 날씨와 옷차림 추천을 받아보세요. 서울, 부산 등 주요 도시의 날씨를 한눈에!',
    icon: '🌤️',
    category: 'weather',
    isActive: true,
    isPremium: false,
    config: {
      cities: ['seoul', 'busan', 'daegu'],
      deliveryTime: '07:00',
    },
  },
  {
    id: 'morning-news-digest',
    name: '아침 뉴스 도시락',
    slug: 'morning-news',
    description:
      'AI가 선별한 오늘의 주요 뉴스를 한눈에 볼 수 있어요. 바쁜 아침, 5분 만에 세상 돌아가는 일을 파악하세요.',
    icon: '📰',
    category: 'news',
    isActive: false,
    isPremium: false,
    config: {
      deliveryTime: '07:30',
    },
  },
  {
    id: 'stock-digest',
    name: '주식 도시락',
    slug: 'stock',
    description:
      '어제 장 마감 후 주요 지수와 오늘의 관심 종목을 정리해드려요. 투자자를 위한 모닝 브리핑!',
    icon: '📈',
    category: 'finance',
    isActive: false,
    isPremium: true,
    config: {
      deliveryTime: '08:00',
    },
  },
]

/**
 * POST /api/admin/seed - 시드 데이터 생성
 * ADMIN_SECRET 또는 CRON_SECRET 인증 필요
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = Timestamp.now()
    const results: Array<{ id: string; name: string; status: 'created' | 'skipped' }> = []

    for (const digest of SEED_DIGESTS) {
      const docRef = db.collection(COLLECTIONS.DIGESTS).doc(digest.id)
      const existing = await docRef.get()

      if (existing.exists) {
        results.push({ id: digest.id, name: digest.name, status: 'skipped' })
        continue
      }

      await docRef.set({
        ...digest,
        createdAt: now,
        updatedAt: now,
      })

      results.push({ id: digest.id, name: digest.name, status: 'created' })
    }

    const created = results.filter((r) => r.status === 'created').length
    const skipped = results.filter((r) => r.status === 'skipped').length

    return NextResponse.json({
      message: `시드 데이터 생성 완료: ${created}개 생성, ${skipped}개 건너뜀`,
      results,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: '시드 데이터 생성 실패', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/seed - 현재 시드 데이터 상태 확인
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()

    const digestsSnapshot = await db.collection(COLLECTIONS.DIGESTS).get()
    const digests = digestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    }))

    return NextResponse.json({
      count: digests.length,
      digests,
    })
  } catch (error) {
    console.error('Seed status error:', error)
    return NextResponse.json(
      { error: '상태 확인 실패' },
      { status: 500 }
    )
  }
}
