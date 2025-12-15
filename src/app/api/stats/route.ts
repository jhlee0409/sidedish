import { NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

// GET /api/stats - Get platform statistics (public endpoint)
export async function GET() {
  try {
    const db = getAdminDb()

    // Get user count
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).count().get()
    const userCount = usersSnapshot.data().count

    // Get project count
    const projectsSnapshot = await db.collection(COLLECTIONS.PROJECTS).count().get()
    const projectCount = projectsSnapshot.data().count

    return NextResponse.json({
      chefCount: userCount,
      menuCount: projectCount,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
