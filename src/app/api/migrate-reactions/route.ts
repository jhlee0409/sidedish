import { NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

// 이모지 → 키 매핑
const EMOJI_TO_KEY_MAP: Record<string, string> = {
  '🔥': 'fire',
  '👏': 'clap',
  '🎉': 'party',
  '💡': 'idea',
  '🥰': 'love',
}

const VALID_KEYS = new Set(['fire', 'clap', 'party', 'idea', 'love'])

// GET /api/migrate-reactions - 마이그레이션 실행
export async function GET() {
  try {
    const db = getAdminDb()
    const projectsRef = db.collection(COLLECTIONS.PROJECTS)
    const snapshot = await projectsRef.get()

    const results: Array<{ id: string; before: object; after: object }> = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const reactions = data.reactions || {}

      // 변환이 필요한지 확인
      const needsMigration = Object.keys(reactions).some(
        key => !VALID_KEYS.has(key) && EMOJI_TO_KEY_MAP[key]
      )

      if (!needsMigration) continue

      // 새로운 reactions 객체 생성
      const newReactions: Record<string, number> = {}

      for (const [key, count] of Object.entries(reactions)) {
        if (VALID_KEYS.has(key)) {
          newReactions[key] = (newReactions[key] || 0) + (count as number)
        } else if (EMOJI_TO_KEY_MAP[key]) {
          const newKey = EMOJI_TO_KEY_MAP[key]
          newReactions[newKey] = (newReactions[newKey] || 0) + (count as number)
        }
      }

      // Firestore 업데이트
      await projectsRef.doc(doc.id).update({ reactions: newReactions })

      results.push({
        id: doc.id,
        before: reactions,
        after: newReactions,
      })
    }

    return NextResponse.json({
      success: true,
      migrated: results.length,
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: '마이그레이션 실패' },
      { status: 500 }
    )
  }
}
