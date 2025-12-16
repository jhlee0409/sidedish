import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/projects/[id]/reactions - Toggle a reaction on a project (requires auth)
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

    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const reactionId = `${user.uid}_${id}_${emoji}`
    const reactionRef = db.collection(COLLECTIONS.REACTIONS).doc(reactionId)

    // Use transaction to atomically check, toggle reaction, and return updated counts
    const result = await db.runTransaction(async (transaction) => {
      const [currentProjectDoc, reactionDoc] = await Promise.all([
        transaction.get(projectRef),
        transaction.get(reactionRef),
      ])

      // Check if project exists
      if (!currentProjectDoc.exists) {
        throw new Error('PROJECT_NOT_FOUND')
      }

      // Check if user is trying to react to their own project
      const projectData = currentProjectDoc.data()
      if (projectData?.authorId === user.uid) {
        throw new Error('SELF_REACTION_NOT_ALLOWED')
      }

      const currentReactions = projectData?.reactions || {}

      if (reactionDoc.exists) {
        // Remove reaction
        transaction.delete(reactionRef)
        transaction.update(projectRef, {
          [`reactions.${emoji}`]: FieldValue.increment(-1),
        })

        // Calculate updated reactions locally
        const updatedReactions = { ...currentReactions }
        updatedReactions[emoji] = Math.max(0, (updatedReactions[emoji] || 0) - 1)
        if (updatedReactions[emoji] === 0) {
          delete updatedReactions[emoji]
        }

        return { reacted: false, reactions: updatedReactions }
      } else {
        // Add reaction
        transaction.set(reactionRef, {
          id: reactionId,
          userId: user.uid,
          projectId: id,
          emoji,
          createdAt: Timestamp.now(),
        })
        transaction.update(projectRef, {
          [`reactions.${emoji}`]: FieldValue.increment(1),
        })

        // Calculate updated reactions locally
        const updatedReactions = { ...currentReactions }
        updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1

        return { reacted: true, reactions: updatedReactions }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message === 'PROJECT_NOT_FOUND') {
        return NextResponse.json(
          { error: '프로젝트를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      if (error.message === 'SELF_REACTION_NOT_ALLOWED') {
        return NextResponse.json(
          { error: '자신의 게시물에는 리액션을 남길 수 없습니다.' },
          { status: 403 }
        )
      }
    }

    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: '리액션 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/reactions - Get user's reactions for a project
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    // Try to get authenticated user
    const user = await verifyAuth(request)

    // Get project reactions
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    const reactions = projectDoc.data()?.reactions || {}

    // If user is authenticated, get their reactions for this project
    let userReactions: string[] = []
    if (user) {
      const userReactionsSnapshot = await db
        .collection(COLLECTIONS.REACTIONS)
        .where('userId', '==', user.uid)
        .where('projectId', '==', id)
        .get()

      userReactions = userReactionsSnapshot.docs.map(doc => doc.data().emoji)
    }

    return NextResponse.json({
      reactions,
      userReactions,
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: '리액션 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
