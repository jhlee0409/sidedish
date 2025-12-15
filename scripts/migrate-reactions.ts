/**
 * 기존 이모지 키 reactions를 새로운 string 키로 마이그레이션하는 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/migrate-reactions.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// 이모지 → 키 매핑
const EMOJI_TO_KEY_MAP: Record<string, string> = {
  '🔥': 'fire',
  '👏': 'clap',
  '🎉': 'party',
  '💡': 'idea',
  '🥰': 'love',
}

// 새로운 키 목록 (이미 새 키면 변환 불필요)
const VALID_KEYS = new Set(['fire', 'clap', 'party', 'idea', 'love'])

async function migrateReactions() {
  // Firebase Admin 초기화
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (!serviceAccountKey) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 설정되지 않았습니다.')
      process.exit(1)
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey)
      initializeApp({
        credential: cert(serviceAccount),
      })
    } catch {
      console.error('서비스 계정 키 파싱 실패')
      process.exit(1)
    }
  }

  const db = getFirestore()
  const projectsRef = db.collection('projects')

  console.log('🚀 Reactions 마이그레이션 시작...\n')

  const snapshot = await projectsRef.get()
  let migratedCount = 0
  let skippedCount = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const reactions = data.reactions || {}

    // 변환이 필요한지 확인
    const needsMigration = Object.keys(reactions).some(
      key => !VALID_KEYS.has(key) && EMOJI_TO_KEY_MAP[key]
    )

    if (!needsMigration) {
      skippedCount++
      continue
    }

    // 새로운 reactions 객체 생성
    const newReactions: Record<string, number> = {}

    for (const [key, count] of Object.entries(reactions)) {
      if (VALID_KEYS.has(key)) {
        // 이미 새 키면 그대로
        newReactions[key] = (newReactions[key] || 0) + (count as number)
      } else if (EMOJI_TO_KEY_MAP[key]) {
        // 이모지 키면 변환
        const newKey = EMOJI_TO_KEY_MAP[key]
        newReactions[newKey] = (newReactions[newKey] || 0) + (count as number)
      }
      // 알 수 없는 키는 무시
    }

    // Firestore 업데이트
    await projectsRef.doc(doc.id).update({ reactions: newReactions })

    console.log(`✅ ${doc.id}: ${JSON.stringify(reactions)} → ${JSON.stringify(newReactions)}`)
    migratedCount++
  }

  console.log('\n📊 마이그레이션 완료!')
  console.log(`   - 변환됨: ${migratedCount}개`)
  console.log(`   - 스킵됨: ${skippedCount}개 (이미 새 형식)`)
}

migrateReactions().catch(console.error)
