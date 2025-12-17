/**
 * @fileoverview Centralized API client for the SideDish platform.
 *
 * This module provides a type-safe, authenticated API client with built-in:
 * - **Request caching**: Configurable TTL-based caching to reduce redundant requests
 * - **Request deduplication**: Prevents duplicate in-flight requests for the same resource
 * - **Authentication**: Automatic Bearer token injection via Firebase Auth
 * - **Error handling**: Typed errors with status codes and error codes
 *
 * @example Basic Usage
 * ```tsx
 * // Initialize in AuthContext (done automatically)
 * import { initApiClient } from '@/lib/api-client'
 * initApiClient(getIdToken)
 *
 * // Use in components
 * import { getProjects, createProject } from '@/lib/api-client'
 *
 * const projects = await getProjects({ limit: 10, platform: 'WEB' })
 * const newProject = await createProject({ title: 'My Project', ... })
 * ```
 *
 * @example Error Handling
 * ```tsx
 * import { createProject, ApiError } from '@/lib/api-client'
 *
 * try {
 *   await createProject(data)
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.status === 401) {
 *       // Handle unauthorized
 *     } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
 *       // Handle rate limiting
 *     }
 *   }
 * }
 * ```
 *
 * @module api-client
 */

import {
  ProjectResponse,
  CommentResponse,
  WhisperResponse,
  UserResponse,
  PaginatedResponse,
  ProjectPlatform,
  Reactions,
} from './db-types'

/**
 * Function type for retrieving Firebase ID tokens.
 * Returns null if user is not authenticated.
 */
type GetIdToken = () => Promise<string | null>

let getIdToken: GetIdToken | null = null

/**
 * Initializes the API client with a token getter function.
 *
 * This should be called once during app initialization, typically in AuthContext.
 * All subsequent authenticated API calls will use this function to get tokens.
 *
 * @param tokenGetter - Async function that returns the current user's Firebase ID token
 *
 * @example
 * ```tsx
 * // In AuthContext.tsx
 * import { initApiClient } from '@/lib/api-client'
 *
 * useEffect(() => {
 *   initApiClient(async () => {
 *     return firebaseUser ? await firebaseUser.getIdToken() : null
 *   })
 * }, [firebaseUser])
 * ```
 */
export function initApiClient(tokenGetter: GetIdToken) {
  getIdToken = tokenGetter
}

// ============ Request Cache ============
// In-memory cache to reduce redundant API calls and improve perceived performance.
// Cache entries are automatically invalidated based on TTL.

/**
 * Internal cache entry structure.
 * @internal
 */
interface CacheEntry<T> {
  /** The cached data */
  data: T
  /** Unix timestamp when the entry was created */
  timestamp: number
}

/** In-memory cache store. Keys are typically in format "resource:id" */
const requestCache = new Map<string, CacheEntry<unknown>>()

/** Default cache duration: 30 seconds. Used for general API responses. */
const DEFAULT_CACHE_TTL = 30 * 1000

/** User profile cache duration: 5 minutes. Longer TTL since profiles rarely change. */
const USER_CACHE_TTL = 5 * 60 * 1000

/** AI usage info cache duration: 1 minute. Shorter TTL to reflect usage changes. */
const AI_USAGE_CACHE_TTL = 60 * 1000

/**
 * Retrieves a cached value if it exists and hasn't expired.
 *
 * @param key - Cache key (e.g., "user:abc123", "ai-usage:draft-456")
 * @param ttl - Time-to-live in milliseconds. Defaults to DEFAULT_CACHE_TTL (30s)
 * @returns The cached data if valid, or null if expired/missing
 *
 * @internal
 */
function getCached<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const entry = requestCache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data
  }
  requestCache.delete(key)
  return null
}

/**
 * Stores a value in the cache with the current timestamp.
 *
 * @param key - Cache key to store under
 * @param data - Data to cache
 *
 * @internal
 */
function setCache<T>(key: string, data: T): void {
  requestCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Invalidates cached entries matching a pattern.
 *
 * Use this after mutations to ensure fresh data is fetched on next request.
 * Supports pattern-based invalidation for related cache entries.
 *
 * @param pattern - Substring to match against cache keys. If omitted, clears entire cache.
 *
 * @example Clear all project-related cache
 * ```tsx
 * invalidateCache('projects')
 * ```
 *
 * @example Clear specific user cache
 * ```tsx
 * invalidateCache('user:abc123')
 * ```
 *
 * @example Clear entire cache
 * ```tsx
 * invalidateCache()
 * ```
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    requestCache.clear()
    return
  }
  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key)
    }
  }
}

// ============ Request Deduplication ============
// Prevents multiple identical requests from being sent simultaneously.
// When the same resource is requested multiple times before the first completes,
// all callers receive the same promise, reducing server load and network traffic.

/** Map of in-flight request promises, keyed by request identifier */
const pendingRequests = new Map<string, Promise<unknown>>()

/**
 * Wraps a fetch operation to prevent duplicate in-flight requests.
 *
 * If a request with the same key is already in progress, returns that promise
 * instead of making a new request. Once the request completes (success or failure),
 * the entry is removed to allow fresh requests.
 *
 * @param key - Unique identifier for this request (e.g., "user:abc123")
 * @param fetcher - Async function that performs the actual fetch
 * @returns Promise resolving to the fetched data
 *
 * @example
 * ```tsx
 * // Multiple components calling getUser('abc') simultaneously
 * // will result in only ONE network request
 * return deduplicatedFetch('user:abc', async () => {
 *   const response = await fetch('/api/users/abc')
 *   return response.json()
 * })
 * ```
 *
 * @internal
 */
async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key) as Promise<T> | undefined
  if (pending) {
    return pending
  }

  // Create the request and store it
  const request = fetcher().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, request)
  return request
}

/**
 * Performs an authenticated fetch request.
 *
 * Automatically injects the Firebase ID token as a Bearer token in the
 * Authorization header if the user is authenticated. Sets Content-Type
 * to application/json by default.
 *
 * @param url - API endpoint URL (relative or absolute)
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns The raw Response object
 *
 * @internal
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (getIdToken) {
    const token = await getIdToken()
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Custom error class for API errors.
 *
 * Extends Error with HTTP status code and optional error code for
 * programmatic error handling.
 *
 * @example
 * ```tsx
 * try {
 *   await createProject(data)
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     switch (error.status) {
 *       case 401: // Unauthorized - redirect to login
 *       case 403: // Forbidden - show permission error
 *       case 404: // Not found
 *       case 429: // Rate limited
 *     }
 *     // Check specific error codes
 *     if (error.code === 'SELF_LIKE_NOT_ALLOWED') {
 *       // Handle business logic error
 *     }
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * Creates an ApiError instance.
   *
   * @param status - HTTP status code (e.g., 401, 403, 404, 500)
   * @param message - Human-readable error message
   * @param code - Optional machine-readable error code (e.g., 'RATE_LIMIT_EXCEEDED')
   */
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Processes a fetch Response and returns typed JSON data.
 *
 * Throws ApiError for non-2xx responses, parsing the error body for
 * detailed error information.
 *
 * @param response - Fetch Response object to process
 * @returns Parsed JSON response data
 * @throws {ApiError} When response.ok is false
 *
 * @internal
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed', error.code)
  }
  return response.json()
}

// ============ Projects API ============
// CRUD operations for projects ("dishes" in the culinary metaphor).

/**
 * Parameters for fetching a paginated list of projects.
 */
export interface GetProjectsParams {
  /** Maximum number of projects to return (default: 12) */
  limit?: number
  /** Cursor for pagination (project ID to start after) */
  cursor?: string
  /** Filter by platform type: 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER' */
  platform?: string
  /** Search query to filter by title, description, or tags */
  search?: string
  /** Filter projects by author's user ID */
  authorId?: string
}

/**
 * Fetches a paginated list of projects.
 *
 * Supports filtering by platform, searching by text, and cursor-based pagination.
 * Does not require authentication.
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated response with projects and cursor info
 *
 * @example Basic usage
 * ```tsx
 * const { data, hasMore, nextCursor } = await getProjects({ limit: 10 })
 * ```
 *
 * @example With filters
 * ```tsx
 * const webProjects = await getProjects({
 *   platform: 'WEB',
 *   search: 'react',
 *   limit: 20
 * })
 * ```
 *
 * @example Pagination
 * ```tsx
 * const page1 = await getProjects({ limit: 10 })
 * if (page1.hasMore) {
 *   const page2 = await getProjects({ limit: 10, cursor: page1.nextCursor })
 * }
 * ```
 */
export async function getProjects(params: GetProjectsParams = {}): Promise<PaginatedResponse<ProjectResponse>> {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.platform) searchParams.set('platform', params.platform)
  if (params.search) searchParams.set('search', params.search)
  if (params.authorId) searchParams.set('authorId', params.authorId)

  const url = `/api/projects${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await fetch(url)
  return handleResponse<PaginatedResponse<ProjectResponse>>(response)
}

/**
 * Fetches projects with AbortController support for cancellable requests.
 *
 * Identical to {@link getProjects} but accepts an AbortSignal for request
 * cancellation. Use this for search inputs where previous requests should
 * be cancelled when new input arrives.
 *
 * @param params - Query parameters for filtering and pagination
 * @param signal - AbortSignal for request cancellation
 * @returns Paginated response with projects
 * @throws {DOMException} When request is aborted (name: 'AbortError')
 *
 * @example Search with debouncing and abort
 * ```tsx
 * const abortControllerRef = useRef<AbortController>()
 *
 * const handleSearch = async (query: string) => {
 *   // Cancel previous request
 *   abortControllerRef.current?.abort()
 *   abortControllerRef.current = new AbortController()
 *
 *   try {
 *     const results = await getProjectsWithAbort(
 *       { search: query },
 *       abortControllerRef.current.signal
 *     )
 *     setProjects(results.data)
 *   } catch (error) {
 *     if (error instanceof DOMException && error.name === 'AbortError') {
 *       // Request was cancelled, ignore
 *       return
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
export async function getProjectsWithAbort(
  params: GetProjectsParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<ProjectResponse>> {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.platform) searchParams.set('platform', params.platform)
  if (params.search) searchParams.set('search', params.search)
  if (params.authorId) searchParams.set('authorId', params.authorId)

  const url = `/api/projects${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await fetch(url, { signal })
  return handleResponse<PaginatedResponse<ProjectResponse>>(response)
}

/**
 * Fetches a single project by ID.
 *
 * @param id - Project ID
 * @returns Full project data including author info, reactions, and metadata
 * @throws {ApiError} 404 if project not found
 *
 * @example
 * ```tsx
 * const project = await getProject('abc123')
 * console.log(project.title, project.authorName)
 * ```
 */
export async function getProject(id: string): Promise<ProjectResponse> {
  const response = await fetch(`/api/projects/${id}`)
  return handleResponse<ProjectResponse>(response)
}

/**
 * Data required to create a new project.
 */
export interface CreateProjectData {
  /** Project title (max 100 characters) */
  title: string
  /** Full markdown description (AI-generated or manual) */
  description: string
  /** Short tagline for cards (max 80 characters) */
  shortDescription: string
  /** Array of tags for categorization */
  tags: string[]
  /** URL to project thumbnail image */
  imageUrl: string
  /** URL to live project or demo */
  link: string
  /** Optional URL to GitHub repository */
  githubUrl?: string
  /** Project platform type */
  platform: ProjectPlatform
}

/**
 * Creates a new project.
 *
 * Requires authentication. The authenticated user becomes the project author.
 *
 * @param data - Project data to create
 * @returns The created project with generated ID and timestamps
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 if validation fails
 *
 * @example
 * ```tsx
 * const newProject = await createProject({
 *   title: '나의 사이드 프로젝트',
 *   description: '## 프로젝트 소개\n...',
 *   shortDescription: '메이커를 위한 생산성 도구',
 *   tags: ['React', 'TypeScript', '생산성'],
 *   imageUrl: 'https://example.com/thumbnail.png',
 *   link: 'https://myproject.com',
 *   githubUrl: 'https://github.com/user/repo',
 *   platform: 'WEB'
 * })
 * ```
 */
export async function createProject(data: CreateProjectData): Promise<ProjectResponse> {
  const response = await fetchWithAuth('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleResponse<ProjectResponse>(response)
}

/**
 * Updates an existing project.
 *
 * Requires authentication. Only the project owner can update their project.
 * Supports partial updates - only provided fields are modified.
 *
 * @param id - Project ID to update
 * @param data - Partial project data to update
 * @returns The updated project
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the project owner
 * @throws {ApiError} 404 if project not found
 *
 * @example
 * ```tsx
 * // Update only the description
 * const updated = await updateProject('abc123', {
 *   description: '## 업데이트된 설명\n...'
 * })
 *
 * // Update multiple fields
 * const updated = await updateProject('abc123', {
 *   title: '새로운 제목',
 *   tags: ['React', 'Next.js']
 * })
 * ```
 */
export async function updateProject(id: string, data: Partial<CreateProjectData>): Promise<ProjectResponse> {
  const response = await fetchWithAuth(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return handleResponse<ProjectResponse>(response)
}

/**
 * Deletes a project.
 *
 * Requires authentication. Only the project owner can delete their project.
 * This action is irreversible and also removes associated comments and reactions.
 *
 * @param id - Project ID to delete
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the project owner
 * @throws {ApiError} 404 if project not found
 *
 * @example
 * ```tsx
 * await deleteProject('abc123')
 * // Optionally invalidate cache after deletion
 * invalidateCache('projects')
 * ```
 */
export async function deleteProject(id: string): Promise<void> {
  const response = await fetchWithAuth(`/api/projects/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed', error.code)
  }
}

// ============ Likes API ============
// Like/unlike functionality for projects. Users cannot like their own projects.

/**
 * Toggles the like status for a project.
 *
 * If the user has already liked the project, removes the like.
 * If not liked, adds a like. Uses Firestore transactions for consistency.
 *
 * @param projectId - Project ID to toggle like on
 * @returns Current like status and updated like count
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 with code 'SELF_LIKE_NOT_ALLOWED' if liking own project
 * @throws {ApiError} 404 if project not found
 *
 * @example
 * ```tsx
 * const { liked, likes } = await toggleLike('abc123')
 * console.log(liked ? '좋아요!' : '좋아요 취소')
 * console.log(`총 ${likes}개의 좋아요`)
 * ```
 */
export async function toggleLike(projectId: string): Promise<{ liked: boolean; likes: number }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/like`, {
    method: 'POST',
  })
  return handleResponse<{ liked: boolean; likes: number }>(response)
}

/**
 * Checks if the authenticated user has liked a project.
 *
 * @param projectId - Project ID to check
 * @returns Whether the current user has liked this project
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const { liked } = await checkLiked('abc123')
 * setIsLiked(liked)
 * ```
 */
export async function checkLiked(projectId: string): Promise<{ liked: boolean }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/like`)
  return handleResponse<{ liked: boolean }>(response)
}

/**
 * Gets all project IDs liked by a user.
 *
 * Useful for displaying which projects in a list the current user has liked.
 *
 * @param userId - User ID to fetch likes for
 * @returns Array of project IDs the user has liked
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const { likedProjectIds } = await getUserLikes(userId)
 * const isLiked = likedProjectIds.includes(projectId)
 * ```
 */
export async function getUserLikes(userId: string): Promise<{ likedProjectIds: string[] }> {
  const response = await fetchWithAuth(`/api/users/${userId}/likes`)
  return handleResponse<{ likedProjectIds: string[] }>(response)
}

// ============ Reactions API ============
// Emoji reactions for projects. Available reactions: fire, clap, party, idea, love
// Users cannot react to their own projects.

/**
 * Toggles an emoji reaction on a project.
 *
 * If the user has already reacted with this emoji, removes the reaction.
 * If not reacted, adds the reaction. Each user can have multiple different
 * reactions on the same project.
 *
 * @param projectId - Project ID to react to
 * @param emoji - Reaction key: 'fire' | 'clap' | 'party' | 'idea' | 'love'
 * @returns Current reaction status and updated reaction counts
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 with code 'SELF_REACTION_NOT_ALLOWED' if reacting to own project
 * @throws {ApiError} 404 with code 'PROJECT_NOT_FOUND' if project doesn't exist
 *
 * @example
 * ```tsx
 * const { reacted, reactions } = await toggleReaction('abc123', 'fire')
 * console.log(reacted ? '🔥 추가!' : '🔥 취소')
 * console.log(`🔥 ${reactions.fire || 0}개`)
 * ```
 */
export async function toggleReaction(projectId: string, emoji: string): Promise<{ reacted: boolean; reactions: Reactions }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  })
  return handleResponse<{ reacted: boolean; reactions: Reactions }>(response)
}

/**
 * Gets reaction counts and the current user's reactions for a project.
 *
 * @param projectId - Project ID to get reactions for
 * @returns Total reaction counts and array of reaction keys the user has used
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const { reactions, userReactions } = await getUserReactions('abc123')
 * console.log(`🔥 ${reactions.fire || 0}, 👏 ${reactions.clap || 0}`)
 * console.log('내 리액션:', userReactions) // ['fire', 'love']
 * ```
 */
export async function getUserReactions(projectId: string): Promise<{ reactions: Reactions; userReactions: string[] }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/reactions`)
  return handleResponse<{ reactions: Reactions; userReactions: string[] }>(response)
}

// ============ Combined User Interactions API ============
// Fetch both liked status and user reactions in parallel to reduce API calls.

/**
 * Combined user interaction data for a project.
 */
export interface UserInteractions {
  /** Whether the current user has liked this project */
  liked: boolean
  /** Array of reaction keys the user has used (e.g., ['fire', 'love']) */
  userReactions: string[]
  /** Total reaction counts for the project */
  reactions: Reactions
}

/**
 * Fetches both like status and reactions for a project in parallel.
 *
 * Optimized helper that combines {@link checkLiked} and {@link getUserReactions}
 * into a single call, reducing the number of round trips needed when loading
 * a project detail page.
 *
 * @param projectId - Project ID to fetch interactions for
 * @returns Combined like status and reaction data
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const { liked, userReactions, reactions } = await getUserInteractions('abc123')
 *
 * setIsLiked(liked)
 * setMyReactions(new Set(userReactions))
 * setReactionCounts(reactions)
 * ```
 */
export async function getUserInteractions(projectId: string): Promise<UserInteractions> {
  const [likeStatus, reactionsData] = await Promise.all([
    checkLiked(projectId),
    getUserReactions(projectId),
  ])

  return {
    liked: likeStatus.liked,
    userReactions: reactionsData.userReactions,
    reactions: reactionsData.reactions,
  }
}

// ============ Comments API ============
// Public comments on projects. Anyone can view, authenticated users can comment.

/**
 * Fetches all comments for a project.
 *
 * Returns comments in chronological order (oldest first).
 * Does not require authentication.
 *
 * @param projectId - Project ID to fetch comments for
 * @returns Array of comments with author info
 *
 * @example
 * ```tsx
 * const comments = await getProjectComments('abc123')
 * comments.forEach(comment => {
 *   console.log(`${comment.authorName}: ${comment.content}`)
 * })
 * ```
 */
export async function getProjectComments(projectId: string): Promise<CommentResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/comments`)
  const result = await handleResponse<{ data: CommentResponse[] }>(response)
  return result.data
}

/**
 * Creates a new comment on a project.
 *
 * @param projectId - Project ID to comment on
 * @param content - Comment text content
 * @returns The created comment with generated ID and author info
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 if content is empty or too long
 *
 * @example
 * ```tsx
 * const comment = await createComment('abc123', '멋진 프로젝트네요!')
 * setComments(prev => [...prev, comment])
 * ```
 */
export async function createComment(projectId: string, content: string): Promise<CommentResponse> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return handleResponse<CommentResponse>(response)
}

/**
 * Deletes a comment.
 *
 * Only the comment author can delete their own comments.
 *
 * @param commentId - Comment ID to delete
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the comment author
 * @throws {ApiError} 404 if comment not found
 *
 * @example
 * ```tsx
 * await deleteComment('comment123')
 * setComments(prev => prev.filter(c => c.id !== 'comment123'))
 * ```
 */
export async function deleteComment(commentId: string): Promise<void> {
  const response = await fetchWithAuth(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed', error.code)
  }
}

// ============ Whispers API ============
// Private feedback messages sent directly to project authors.
// Only visible to the project author.

/**
 * Fetches all whispers (private feedback) received by the authenticated user.
 *
 * Returns whispers for all projects owned by the current user,
 * sorted by creation date (newest first).
 *
 * @returns Array of whispers with sender and project info
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const whispers = await getWhispers()
 * const unread = whispers.filter(w => !w.isRead)
 * console.log(`${unread.length}개의 새 귓속말`)
 * ```
 */
export async function getWhispers(): Promise<WhisperResponse[]> {
  const response = await fetchWithAuth('/api/whispers')
  const result = await handleResponse<{ data: WhisperResponse[] }>(response)
  return result.data
}

/**
 * Sends a private whisper (feedback) to a project author.
 *
 * Whispers are only visible to the project author. The sender's identity
 * is included so authors know who sent the feedback.
 *
 * @param data - Whisper data including project info and message content
 * @param data.projectId - ID of the project being commented on
 * @param data.projectTitle - Title of the project (denormalized for display)
 * @param data.projectAuthorId - User ID of the project author (recipient)
 * @param data.content - Whisper message content
 * @returns The created whisper
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 if content is empty
 *
 * @example
 * ```tsx
 * await createWhisper({
 *   projectId: 'abc123',
 *   projectTitle: '멋진 프로젝트',
 *   projectAuthorId: 'user456',
 *   content: '이 기능 정말 좋아요! 혹시 오픈소스로 공개 계획 있으신가요?'
 * })
 * ```
 */
export async function createWhisper(data: {
  projectId: string
  projectTitle: string
  projectAuthorId: string
  content: string
}): Promise<WhisperResponse> {
  const response = await fetchWithAuth('/api/whispers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleResponse<WhisperResponse>(response)
}

/**
 * Marks a whisper as read.
 *
 * Only the whisper recipient (project author) can mark whispers as read.
 *
 * @param whisperId - Whisper ID to mark as read
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the whisper recipient
 * @throws {ApiError} 404 if whisper not found
 *
 * @example
 * ```tsx
 * await markWhisperAsRead('whisper123')
 * setWhispers(prev => prev.map(w =>
 *   w.id === 'whisper123' ? { ...w, isRead: true } : w
 * ))
 * ```
 */
export async function markWhisperAsRead(whisperId: string): Promise<void> {
  const response = await fetchWithAuth(`/api/whispers/${whisperId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isRead: true }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed', error.code)
  }
}

// ============ Users API ============
// User profile management. "Chefs" in the SideDish culinary metaphor.

/**
 * Fetches a user's public profile.
 *
 * Uses caching (5-minute TTL) and request deduplication to minimize
 * redundant requests when multiple components need the same user data.
 *
 * @param userId - Firebase UID of the user
 * @returns User profile data
 * @throws {ApiError} 404 if user not found
 *
 * @example
 * ```tsx
 * const user = await getUser('user123')
 * console.log(`${user.name}님의 프로필`)
 * ```
 */
export async function getUser(userId: string): Promise<UserResponse> {
  const cacheKey = `user:${userId}`

  // Check cache first
  const cached = getCached<UserResponse>(cacheKey, USER_CACHE_TTL)
  if (cached) {
    return cached
  }

  // Use deduplication to prevent multiple simultaneous requests for same user
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetch(`/api/users/${userId}`)
    const data = await handleResponse<UserResponse>(response)
    setCache(cacheKey, data)
    return data
  })
}

/**
 * Updates a user's profile.
 *
 * Only the user themselves can update their own profile.
 * Supports partial updates - only provided fields are modified.
 *
 * @param userId - User ID to update
 * @param data - Partial profile data to update
 * @param data.name - Optional new display name
 * @param data.avatarUrl - Optional new avatar URL
 * @returns The updated user profile
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the profile owner
 *
 * @example
 * ```tsx
 * const updated = await updateUser(user.id, {
 *   name: '새로운 닉네임'
 * })
 * // Remember to invalidate cache after update
 * invalidateCache(`user:${user.id}`)
 * ```
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string
    avatarUrl?: string
    agreements?: {
      termsOfService: boolean
      privacyPolicy: boolean
      marketing: boolean
    }
    isProfileComplete?: boolean
  }
): Promise<UserResponse> {
  const response = await fetchWithAuth(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  const result = await handleResponse<UserResponse>(response)

  // 캐시 자동 무효화
  invalidateCache(`user:${userId}`)

  return result
}

/**
 * Withdraws (soft deletes) a user account.
 *
 * Marks the user as withdrawn without permanently deleting data.
 * Data is retained for legal compliance (1 year for identity info,
 * 3 months for access logs).
 *
 * @param userId - User ID to withdraw
 * @param reason - Reason for withdrawal (required)
 * @param feedback - Optional feedback about inconveniences
 * @returns Success status
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if not the account owner
 * @throws {ApiError} 400 if already withdrawn or invalid reason
 */
export async function withdrawUser(
  userId: string,
  reason: string,
  feedback?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth(`/api/users/${userId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ reason, feedback }),
  })
  const result = await handleResponse<{ success: boolean; message: string }>(response)

  // 캐시 무효화
  invalidateCache(`user:${userId}`)

  return result
}

// ============ Image Upload API ============
// Upload images to Vercel Blob storage with automatic optimization.

/**
 * Uploads an image file to Vercel Blob storage.
 *
 * The server automatically optimizes images:
 * - Resizes to max 1200x1200 (preserving aspect ratio)
 * - Converts to WebP format for smaller file sizes
 * - Animated GIFs are preserved without conversion
 *
 * @param file - Image file to upload (JPEG, PNG, WebP, or GIF)
 * @returns Object containing the public URL of the uploaded image
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 400 if file is not an image or exceeds size limit
 * @throws {ApiError} 500 if upload fails
 *
 * @example
 * ```tsx
 * const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0]
 *   if (!file) return
 *
 *   try {
 *     const { url } = await uploadImage(file)
 *     setImageUrl(url)
 *   } catch (error) {
 *     if (error instanceof ApiError && error.status === 400) {
 *       alert('이미지 파일만 업로드 가능합니다')
 *     }
 *   }
 * }
 * ```
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const headers: HeadersInit = {}
  if (getIdToken) {
    const token = await getIdToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse<{ url: string }>(response)
}

// ============ AI Generation API ============
// Gemini AI-powered content generation for project descriptions.
// Rate limited: 3 generations per draft, 10 per day, 5-second cooldown.

/**
 * Result from AI content generation.
 */
export interface AiGenerationResult {
  /** Generated short description (tagline, max 80 chars) */
  shortDescription: string
  /** Generated full markdown description */
  description: string
  /** Generated tags for the project */
  tags: string[]
  /** Unix timestamp when content was generated */
  generatedAt: number
  /** Updated usage information after generation */
  usage: {
    /** Remaining generations for this draft */
    remainingForDraft: number
    /** Remaining generations for today */
    remainingForDay: number
    /** Maximum generations per draft (3) */
    maxPerDraft: number
    /** Maximum generations per day (10) */
    maxPerDay: number
  }
}

/**
 * AI generation usage and rate limit information.
 */
export interface AiUsageInfo {
  /** Remaining generations for this draft */
  remainingForDraft: number
  /** Remaining generations for today */
  remainingForDay: number
  /** Maximum generations per draft (3) */
  maxPerDraft: number
  /** Maximum generations per day (10) */
  maxPerDay: number
  /** Cooldown time remaining in milliseconds (5000ms between generations) */
  cooldownMs: number
}

/**
 * Error response structure for AI generation failures.
 */
export interface AiGenerationError {
  /** Error message */
  error: string
  /** Error code: 'RATE_LIMIT_EXCEEDED', 'COOLDOWN_ACTIVE', etc. */
  code?: string
  /** Remaining draft generations (if rate limited) */
  remainingForDraft?: number
  /** Remaining daily generations (if rate limited) */
  remainingForDay?: number
  /** Cooldown time remaining in ms (if in cooldown) */
  cooldownRemaining?: number
}

/**
 * Generates AI-powered content for a project.
 *
 * Uses Gemini AI to transform a basic description into polished Korean content
 * with a culinary/chef theme. Generates short description, full markdown
 * description, and relevant tags.
 *
 * Rate limits:
 * - 3 generations per draft
 * - 10 generations per day per user
 * - 5-second cooldown between generations
 *
 * @param draftId - Unique ID for the draft (used for per-draft rate limiting)
 * @param description - Raw project description to transform
 * @returns Generated content with usage info
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 429 with code 'RATE_LIMIT_EXCEEDED' if limit reached
 * @throws {ApiError} 429 with code 'COOLDOWN_ACTIVE' if in cooldown period
 * @throws {ApiError} 500 if AI generation fails
 *
 * @example
 * ```tsx
 * try {
 *   const result = await generateAiContent(draftId, rawDescription)
 *   setShortDesc(result.shortDescription)
 *   setDescription(result.description)
 *   setTags(result.tags)
 *
 *   // Update UI with remaining usage
 *   setRemainingGenerations(result.usage.remainingForDraft)
 * } catch (error) {
 *   if (error instanceof ApiError && error.code === 'RATE_LIMIT_EXCEEDED') {
 *     alert('오늘 AI 생성 횟수를 모두 사용했습니다')
 *   }
 * }
 * ```
 */
export async function generateAiContent(draftId: string, description: string): Promise<AiGenerationResult> {
  const response = await fetchWithAuth('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ draftId, description }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'AI 생성에 실패했습니다.', error.code)
  }

  return response.json()
}

/**
 * Gets current AI usage information for a draft.
 *
 * Uses caching (1-minute TTL) and request deduplication to avoid
 * excessive API calls when checking usage status.
 *
 * @param draftId - Draft ID to check usage for
 * @returns Current usage limits and cooldown status
 * @throws {ApiError} 401 if not authenticated
 *
 * @example
 * ```tsx
 * const usage = await getAiUsageInfo(draftId)
 *
 * if (usage.remainingForDraft === 0) {
 *   showMessage('이 초안에서는 더 이상 AI 생성을 사용할 수 없습니다')
 * } else if (usage.cooldownMs > 0) {
 *   showMessage(`${Math.ceil(usage.cooldownMs / 1000)}초 후에 다시 시도해주세요`)
 * }
 * ```
 */
export async function getAiUsageInfo(draftId: string): Promise<AiUsageInfo> {
  const cacheKey = `ai-usage:${draftId}`

  // Check cache first (1 minute TTL)
  const cached = getCached<AiUsageInfo>(cacheKey, AI_USAGE_CACHE_TTL)
  if (cached) {
    return cached
  }

  // Use deduplication to prevent multiple simultaneous requests
  return deduplicatedFetch(cacheKey, async () => {
    const response = await fetchWithAuth(`/api/ai/generate?draftId=${encodeURIComponent(draftId)}`)
    const data = await handleResponse<AiUsageInfo>(response)
    setCache(cacheKey, data)
    return data
  })
}

/**
 * Invalidates the cached AI usage info for a draft.
 *
 * Call this after a successful AI generation to ensure the next
 * usage check reflects the updated limits.
 *
 * @param draftId - Draft ID to invalidate cache for
 *
 * @example
 * ```tsx
 * const result = await generateAiContent(draftId, description)
 * invalidateAiUsageCache(draftId) // Clear stale usage data
 * ```
 */
export function invalidateAiUsageCache(draftId: string): void {
  invalidateCache(`ai-usage:${draftId}`)
}
