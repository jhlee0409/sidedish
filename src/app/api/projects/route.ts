import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CreateProjectInput, ProjectResponse, PaginatedResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

// GET /api/projects - List all projects with pagination (public)
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const cursor = searchParams.get('cursor')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')?.toLowerCase()
    const authorId = searchParams.get('authorId')

    let query = db.collection(COLLECTIONS.PROJECTS)
      .orderBy('createdAt', 'desc')

    // Filter by platform
    if (platform && platform !== 'All') {
      query = query.where('platform', '==', platform)
    }

    // Filter by author
    if (authorId) {
      query = query.where('authorId', '==', authorId)
    }

    // Pagination cursor
    if (cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    // Fetch one extra to check if there are more
    const snapshot = await query.limit(limit + 1).get()

    let projects: ProjectResponse[] = snapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        tags: data.tags || [],
        imageUrl: data.imageUrl,
        authorId: data.authorId,
        authorName: data.authorName,
        likes: data.likes || 0,
        reactions: data.reactions || {},
        link: data.link,
        githubUrl: data.githubUrl,
        platform: data.platform,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    })

    // Client-side search filtering (for title and tags)
    if (search) {
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    const hasMore = snapshot.docs.length > limit
    const nextCursor = hasMore ? snapshot.docs[limit - 1]?.id : undefined

    const response: PaginatedResponse<ProjectResponse> = {
      data: projects,
      nextCursor,
      hasMore,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: '프로젝트 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const body: Omit<CreateProjectInput, 'authorId' | 'authorName'> = await request.json()

    // Validate required fields
    if (!body.title || !body.shortDescription) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      )
    }

    const now = Timestamp.now()
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc()

    const projectData = {
      id: projectRef.id,
      title: body.title,
      description: body.description || '',
      shortDescription: body.shortDescription,
      tags: body.tags || [],
      imageUrl: body.imageUrl || '',
      authorId: user.uid, // Use authenticated user's ID
      authorName: user.name || 'Anonymous Chef',
      likes: 0,
      reactions: {},
      link: body.link || '',
      githubUrl: body.githubUrl || '',
      platform: body.platform || 'OTHER',
      createdAt: now,
      updatedAt: now,
    }

    await projectRef.set(projectData)

    const response: ProjectResponse = {
      ...projectData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
