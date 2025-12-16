// API Client for making authenticated requests

import {
  ProjectResponse,
  CommentResponse,
  WhisperResponse,
  UserResponse,
  PaginatedResponse,
  ProjectPlatform,
} from './db-types'

type GetIdToken = () => Promise<string | null>

let getIdToken: GetIdToken | null = null

// Initialize the API client with the auth function
export function initApiClient(tokenGetter: GetIdToken) {
  getIdToken = tokenGetter
}

// ============ Request Cache ============
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_CACHE_TTL = 30 * 1000 // 30 seconds
const USER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes for user profiles
const AI_USAGE_CACHE_TTL = 60 * 1000 // 1 minute for AI usage

function getCached<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const entry = requestCache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data
  }
  requestCache.delete(key)
  return null
}

function setCache<T>(key: string, data: T): void {
  requestCache.set(key, { data, timestamp: Date.now() })
}

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
const pendingRequests = new Map<string, Promise<unknown>>()

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

// Base fetch function with auth
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

// Error class for API errors
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic response handler
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed', error.code)
  }
  return response.json()
}

// ============ Projects API ============

export interface GetProjectsParams {
  limit?: number
  cursor?: string
  platform?: string
  search?: string
  authorId?: string
}

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

// Version with AbortController support for search optimization
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

export async function getProject(id: string): Promise<ProjectResponse> {
  const response = await fetch(`/api/projects/${id}`)
  return handleResponse<ProjectResponse>(response)
}

export interface CreateProjectData {
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  link: string
  githubUrl?: string
  platform: ProjectPlatform
}

export async function createProject(data: CreateProjectData): Promise<ProjectResponse> {
  const response = await fetchWithAuth('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleResponse<ProjectResponse>(response)
}

export async function updateProject(id: string, data: Partial<CreateProjectData>): Promise<ProjectResponse> {
  const response = await fetchWithAuth(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return handleResponse<ProjectResponse>(response)
}

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

export async function toggleLike(projectId: string): Promise<{ liked: boolean; likes: number }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/like`, {
    method: 'POST',
  })
  return handleResponse<{ liked: boolean; likes: number }>(response)
}

export async function checkLiked(projectId: string): Promise<{ liked: boolean }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/like`)
  return handleResponse<{ liked: boolean }>(response)
}

export async function getUserLikes(userId: string): Promise<{ likedProjectIds: string[] }> {
  const response = await fetchWithAuth(`/api/users/${userId}/likes`)
  return handleResponse<{ likedProjectIds: string[] }>(response)
}

// ============ Reactions API ============

export async function toggleReaction(projectId: string, emoji: string): Promise<{ reacted: boolean; reactions: Record<string, number> }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  })
  return handleResponse<{ reacted: boolean; reactions: Record<string, number> }>(response)
}

export async function getUserReactions(projectId: string): Promise<{ reactions: Record<string, number>; userReactions: string[] }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/reactions`)
  return handleResponse<{ reactions: Record<string, number>; userReactions: string[] }>(response)
}

// Keep addReaction for backward compatibility
export async function addReaction(projectId: string, emoji: string): Promise<{ reactions: Record<string, number> }> {
  const result = await toggleReaction(projectId, emoji)
  return { reactions: result.reactions }
}

// ============ Combined User Interactions API ============
// Fetch both liked status and user reactions in parallel to reduce API calls
export interface UserInteractions {
  liked: boolean
  userReactions: string[]
  reactions: Record<string, number>
}

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

export async function getProjectComments(projectId: string): Promise<CommentResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/comments`)
  const result = await handleResponse<{ data: CommentResponse[] }>(response)
  return result.data
}

export async function createComment(projectId: string, content: string): Promise<CommentResponse> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return handleResponse<CommentResponse>(response)
}

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

export async function getWhispers(): Promise<WhisperResponse[]> {
  const response = await fetchWithAuth('/api/whispers')
  const result = await handleResponse<{ data: WhisperResponse[] }>(response)
  return result.data
}

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

export async function createOrUpdateUser(data: { name: string; avatarUrl?: string }): Promise<UserResponse> {
  const response = await fetchWithAuth('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleResponse<UserResponse>(response)
}

export async function updateUser(userId: string, data: { name?: string; avatarUrl?: string }): Promise<UserResponse> {
  const response = await fetchWithAuth(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return handleResponse<UserResponse>(response)
}

// ============ Image Upload API ============

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

export interface AiGenerationResult {
  shortDescription: string
  description: string
  tags: string[]
  generatedAt: number
  usage: {
    remainingForDraft: number
    remainingForDay: number
    maxPerDraft: number
    maxPerDay: number
  }
}

export interface AiUsageInfo {
  remainingForDraft: number
  remainingForDay: number
  maxPerDraft: number
  maxPerDay: number
  cooldownMs: number
}

export interface AiGenerationError {
  error: string
  code?: string
  remainingForDraft?: number
  remainingForDay?: number
  cooldownRemaining?: number
}

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

// Invalidate AI usage cache after generation (called after successful AI generation)
export function invalidateAiUsageCache(draftId: string): void {
  invalidateCache(`ai-usage:${draftId}`)
}
