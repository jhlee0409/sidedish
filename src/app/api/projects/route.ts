import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CreateProjectInput, ProjectResponse, PaginatedResponse, ProjectLinkDoc } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import {
  validateString,
  validateUrl,
  validateTags,
  validateLimit,
  validateSearchQuery,
  isValidPlatform,
  validateProjectLinks,
  CONTENT_LIMITS,
  badRequestResponse,
} from '@/lib/security-utils'

// GET /api/projects - List all projects with pagination (public)
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams

    // SECURITY: Validate and sanitize query parameters
    const requestedLimit = validateLimit(searchParams.get('limit'), 20, 50)
    const cursor = searchParams.get('cursor')
    const platform = searchParams.get('platform')
    const search = validateSearchQuery(searchParams.get('search'))
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
        links: data.links || [],
        platform: data.platform,
        isBeta: data.isBeta,
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

    // SECURITY: Validate all input fields with proper content length limits

    // Title validation
    const titleValidation = validateString(body.title, '제목', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
    })
    if (!titleValidation.valid) return badRequestResponse(titleValidation.error)

    // Short description validation
    const shortDescValidation = validateString(body.shortDescription, '간단 소개', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.PROJECT_SHORT_DESC_MAX,
    })
    if (!shortDescValidation.valid) return badRequestResponse(shortDescValidation.error)

    // Description validation
    const descValidation = validateString(body.description, '상세 설명', {
      required: false,
      maxLength: CONTENT_LIMITS.PROJECT_DESC_MAX,
    })
    if (!descValidation.valid) return badRequestResponse(descValidation.error)

    // Tags validation
    const tagsValidation = validateTags(body.tags)
    if (!tagsValidation.valid) return badRequestResponse(tagsValidation.error)

    // URL validations (하위 호환용 - links 없으면 link 사용)
    const linkValidation = validateUrl(body.link, '프로젝트 링크')
    if (!linkValidation.valid) return badRequestResponse(linkValidation.error)

    const githubValidation = validateUrl(body.githubUrl, 'GitHub 링크')
    if (!githubValidation.valid) return badRequestResponse(githubValidation.error)

    // Links 배열 검증 (새로운 멀티링크 시스템)
    const linksValidation = validateProjectLinks(body.links, '스토어 링크')
    if (!linksValidation.valid) return badRequestResponse(linksValidation.error)

    // Platform validation
    const platform = isValidPlatform(body.platform) ? body.platform : 'OTHER'

    const now = Timestamp.now()
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc()

    const projectData = {
      id: projectRef.id,
      title: titleValidation.value,
      description: descValidation.value,
      shortDescription: shortDescValidation.value,
      tags: tagsValidation.value,
      imageUrl: body.imageUrl || '',
      authorId: user.uid, // Use authenticated user's ID
      authorName: user.name || 'Anonymous Chef',
      likes: 0,
      reactions: {},
      link: linkValidation.value,
      githubUrl: githubValidation.value,
      links: linksValidation.value as ProjectLinkDoc[],
      platform,
      isBeta: body.isBeta === true,
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
