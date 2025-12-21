import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { ProjectUpdateResponse, ProjectUpdateType } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { validateString, validateLimit, CONTENT_LIMITS, badRequestResponse } from '@/lib/security-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 허용된 이모지 목록 (마일스톤용)
const ALLOWED_EMOJIS = ['🎉', '🚀', '✨', '🐛', '🔧', '📦', '🎨', '⚡', '🔒', '📝', '🌟', '💡']

// 업데이트 타입 검증
const isValidUpdateType = (type: unknown): type is ProjectUpdateType => {
  return type === 'milestone' || type === 'devlog'
}

// GET /api/projects/[id]/updates - 프로젝트 업데이트 목록 조회 (public)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams

    const limit = validateLimit(searchParams.get('limit'), 20, 50)
    const cursor = searchParams.get('cursor')
    const type = searchParams.get('type') // 'milestone' | 'devlog' | null (all)

    // 프로젝트 존재 확인
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 쿼리 구성
    let query = db
      .collection(COLLECTIONS.PROJECT_UPDATES)
      .where('projectId', '==', id)

    // 타입 필터링
    if (type && isValidUpdateType(type)) {
      query = query.where('type', '==', type)
    }

    query = query.orderBy('createdAt', 'desc')

    // 커서 기반 페이지네이션
    if (cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.PROJECT_UPDATES).doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const snapshot = await query.limit(limit + 1).get()
    const hasMore = snapshot.docs.length > limit
    const docs = snapshot.docs.slice(0, limit)

    const updates: ProjectUpdateResponse[] = docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        projectId: data.projectId,
        authorId: data.authorId,
        authorName: data.authorName,
        type: data.type,
        title: data.title,
        content: data.content,
        version: data.version,
        emoji: data.emoji,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    })

    const nextCursor = hasMore ? docs[docs.length - 1]?.id : undefined

    return NextResponse.json({
      data: updates,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching project updates:', error)
    return NextResponse.json(
      { error: '업데이트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/updates - 프로젝트 업데이트 작성 (requires auth, owner only)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const db = getAdminDb()
    const body = await request.json()

    // 프로젝트 확인 및 소유권 검증
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()
    if (projectData?.authorId !== user.uid) {
      return NextResponse.json(
        { error: '본인의 프로젝트만 업데이트를 작성할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 타입 검증
    if (!isValidUpdateType(body.type)) {
      return badRequestResponse('올바른 업데이트 타입을 선택해주세요.')
    }

    // 제목 검증
    const titleValidation = validateString(body.title, '제목', {
      required: true,
      minLength: 2,
      maxLength: 100,
    })
    if (!titleValidation.valid) {
      return badRequestResponse(titleValidation.error)
    }

    // 내용 검증
    const contentValidation = validateString(body.content, '내용', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.PROJECT_DESC_MAX,
    })
    if (!contentValidation.valid) {
      return badRequestResponse(contentValidation.error)
    }

    // 버전 검증 (마일스톤인 경우 선택)
    let version: string | undefined
    if (body.type === 'milestone' && body.version) {
      const versionValidation = validateString(body.version, '버전', {
        maxLength: 20,
      })
      if (!versionValidation.valid) {
        return badRequestResponse(versionValidation.error)
      }
      version = versionValidation.value
    }

    // 이모지 검증 (마일스톤인 경우 선택)
    let emoji: string | undefined
    if (body.type === 'milestone' && body.emoji) {
      if (!ALLOWED_EMOJIS.includes(body.emoji)) {
        return badRequestResponse('허용되지 않은 이모지입니다.')
      }
      emoji = body.emoji
    }

    const now = Timestamp.now()
    const updateRef = db.collection(COLLECTIONS.PROJECT_UPDATES).doc()

    const updateData = {
      id: updateRef.id,
      projectId: id,
      authorId: user.uid,
      authorName: user.name || projectData?.authorName || 'Anonymous',
      type: body.type as ProjectUpdateType,
      title: titleValidation.value,
      content: contentValidation.value,
      version,
      emoji,
      createdAt: now,
    }

    await updateRef.set(updateData)

    const response: ProjectUpdateResponse = {
      ...updateData,
      createdAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating project update:', error)
    return NextResponse.json(
      { error: '업데이트 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
