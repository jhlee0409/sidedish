import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/projects/[id]/reactions - Add a reaction to a project (requires auth)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const db = getAdminDb()
    const body = await request.json()

    const { emoji } = body
    if (!emoji) {
      return NextResponse.json(
        { error: '이모지가 필요합니다.' },
        { status: 400 }
      )
    }

    // Check if project exists
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check if user is trying to react to their own project
    const projectData = projectDoc.data()
    if (projectData?.authorId === user.uid) {
      return NextResponse.json(
        { error: '자신의 게시물에는 리액션을 남길 수 없습니다.' },
        { status: 403 }
      )
    }

    // Increment reaction count
    await projectRef.update({
      [`reactions.${emoji}`]: FieldValue.increment(1),
    })

    // Get updated reactions
    const updatedDoc = await projectRef.get()
    const reactions = updatedDoc.data()?.reactions || {}

    return NextResponse.json({
      reactions,
    })
  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { error: '리액션 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}
