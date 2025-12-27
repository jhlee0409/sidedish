import { NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { handleApiError } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

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
    return handleApiError(error, 'GET /api/stats', ERROR_MESSAGES.STATS_FETCH_FAILED)
  }
}
