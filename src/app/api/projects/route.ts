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

    const requestedLimit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const cursor = searchParams.get('cursor')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')?.toLowerCase()
    const authorId = searchParams.get('authorId')

    // For search queries, fetch more data to filter from (Firestore doesn't support full-text search)
    // This ensures better search coverage while maintaining reasonable performance
    const fetchLimit = search ? Math.min(requestedLimit * 5, 200) : requestedLimit

    const collection = db.collection(COLLECTIONS.PROJECTS)

    // Use composite index for authorId + createdAt queries
    let query: FirebaseFirestore.Query = authorId
      ? collection.where('authorId', '==', authorId).orderBy('createdAt', 'desc')
      : collection.orderBy('createdAt', 'desc')

    // Filter by platform using composite index
    if (platform && platform !== 'All' && !authorId) {
      query = query.where('platform', '==', platform)
    }

    // Pagination cursor
    if (cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    // Fetch extra for search filtering and pagination check
    const snapshot = await query.limit(fetchLimit + 1).get()

    let projects: ProjectResponse[] = snapshot.docs.slice(0, fetchLimit).map(doc => {
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

    // Client-side search filtering (Firestore doesn't support full-text search)
    if (search) {
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.shortDescription?.toLowerCase().includes(search) ||
        p.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // Client-side platform filtering for authorId queries
    if (platform && platform !== 'All' && authorId) {
      projects = projects.filter(p => p.platform === platform)
    }

    // Apply requested limit after filtering
    const hasMoreFromDb = snapshot.docs.length > fetchLimit
    const hasMoreAfterFilter = projects.length > requestedLimit
    const hasMore = hasMoreFromDb || hasMoreAfterFilter

    // Slice to requested limit
    const resultProjects = projects.slice(0, requestedLimit)

    // Use the last returned project's ID as cursor for next page
    const lastDoc = search
      ? snapshot.docs.find(doc => doc.id === resultProjects[resultProjects.length - 1]?.id)
      : snapshot.docs[resultProjects.length - 1]
    const nextCursor = hasMore ? lastDoc?.id : undefined

    const response: PaginatedResponse<ProjectResponse> = {
      data: resultProjects,
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
      console.log('POST /api/projects: Authentication failed')
      return unauthorizedResponse()
    }
    console.log('POST /api/projects: User authenticated:', user.uid)

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

    console.log('POST /api/projects: Writing to Firestore...')
    await projectRef.set(projectData)
    console.log('POST /api/projects: Project created:', projectRef.id)

    const response: ProjectResponse = {
      ...projectData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: '프로젝트 생성에 실패했습니다.', details: errorMessage },
      { status: 500 }
    )
  }
}
