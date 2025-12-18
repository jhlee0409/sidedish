/**
 * 도시락 시드 데이터 스크립트
 *
 * 실행 방법:
 * npx ts-node --project tsconfig.json scripts/seed-digests.ts
 *
 * 또는 Admin API를 통해 실행 (아래 데이터를 POST /api/digests로 호출)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// Firebase Admin 초기화
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// 시드 데이터
const digestsData = [
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
    isActive: false, // 개발 중
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
    isActive: false, // 개발 중
    isPremium: true,
    config: {
      deliveryTime: '08:00',
    },
  },
]

async function seedDigests() {
  console.log('🍱 도시락 시드 데이터 생성 시작...\n')

  const now = Timestamp.now()

  for (const digest of digestsData) {
    const docRef = db.collection('digests').doc(digest.id)
    const existing = await docRef.get()

    if (existing.exists) {
      console.log(`⏭️  건너뜀: ${digest.name} (이미 존재)`)
      continue
    }

    await docRef.set({
      ...digest,
      createdAt: now,
      updatedAt: now,
    })

    console.log(`✅ 생성됨: ${digest.name} (${digest.slug})`)
  }

  console.log('\n🎉 시드 데이터 생성 완료!')
}

// 스크립트 실행
seedDigests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 에러 발생:', error)
    process.exit(1)
  })
