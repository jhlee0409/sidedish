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

export async function getUserLikes(userId: string): Promise<{ projectIds: string[] }> {
  const response = await fetchWithAuth(`/api/users/${userId}/likes`)
  return handleResponse<{ projectIds: string[] }>(response)
}

// ============ Reactions API ============

export async function addReaction(projectId: string, emoji: string): Promise<{ reactions: Record<string, number> }> {
  const response = await fetchWithAuth(`/api/projects/${projectId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  })
  return handleResponse<{ reactions: Record<string, number> }>(response)
}

// ============ Comments API ============

export async function getProjectComments(projectId: string): Promise<CommentResponse[]> {
  const response = await fetch(`/api/projects/${projectId}/comments`)
  return handleResponse<CommentResponse[]>(response)
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
  return handleResponse<WhisperResponse[]>(response)
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
  const response = await fetch(`/api/users/${userId}`)
  return handleResponse<UserResponse>(response)
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
