import { Project, User, UserComment, Whisper, UserData } from './types'

const STORAGE_KEYS = {
  USER: 'sidedish_user',
  PROJECTS: 'sidedish_projects',
  LIKED_PROJECTS: 'sidedish_liked_projects',
  COMMENTS: 'sidedish_user_comments',
  WHISPERS: 'sidedish_whispers',
} as const

// Default user
const DEFAULT_USER: User = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  name: 'Anonymous Chef',
  avatarUrl: '',
  createdAt: new Date(),
}

// User Management
export function getUser(): User {
  if (typeof window === 'undefined') return DEFAULT_USER

  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return { ...parsed, createdAt: new Date(parsed.createdAt) }
    } catch {
      return DEFAULT_USER
    }
  }

  // Initialize default user
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER))
  return DEFAULT_USER
}

export function updateUser(updates: Partial<User>): User {
  const current = getUser()
  const updated = { ...current, ...updates }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated))
  return updated
}

// Project Management
export function getMyProjects(): Project[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return parsed.map((p: Project & { createdAt: string }) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }))
  } catch {
    return []
  }
}

export function saveProject(project: Project): void {
  const projects = getMyProjects()
  const existingIndex = projects.findIndex(p => p.id === project.id)

  if (existingIndex >= 0) {
    projects[existingIndex] = project
  } else {
    projects.unshift(project)
  }

  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
}

export function deleteProject(projectId: string): void {
  const projects = getMyProjects().filter(p => p.id !== projectId)
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
}

export function getProjectById(projectId: string): Project | null {
  const projects = getMyProjects()
  return projects.find(p => p.id === projectId) || null
}

// Liked Projects
export function getLikedProjectIds(): string[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEYS.LIKED_PROJECTS)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function toggleLikeProject(projectId: string): boolean {
  const liked = getLikedProjectIds()
  const index = liked.indexOf(projectId)

  if (index >= 0) {
    liked.splice(index, 1)
    localStorage.setItem(STORAGE_KEYS.LIKED_PROJECTS, JSON.stringify(liked))
    return false
  } else {
    liked.push(projectId)
    localStorage.setItem(STORAGE_KEYS.LIKED_PROJECTS, JSON.stringify(liked))
    return true
  }
}

export function isProjectLiked(projectId: string): boolean {
  return getLikedProjectIds().includes(projectId)
}

// User Comments
export function getUserComments(): UserComment[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return parsed.map((c: UserComment & { createdAt: string }) => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }))
  } catch {
    return []
  }
}

export function saveUserComment(comment: UserComment): void {
  const comments = getUserComments()
  comments.unshift(comment)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
}

export function deleteUserComment(commentId: string): void {
  const comments = getUserComments().filter(c => c.id !== commentId)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
}

// Whispers (Feedback)
export function getWhispers(): Whisper[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEYS.WHISPERS)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return parsed.map((w: Whisper & { createdAt: string }) => ({
      ...w,
      createdAt: new Date(w.createdAt)
    }))
  } catch {
    return []
  }
}

export function saveWhisper(whisper: Whisper): void {
  const whispers = getWhispers()
  whispers.unshift(whisper)
  localStorage.setItem(STORAGE_KEYS.WHISPERS, JSON.stringify(whispers))
}

export function markWhisperAsRead(whisperId: string): void {
  const whispers = getWhispers()
  const whisper = whispers.find(w => w.id === whisperId)
  if (whisper) {
    whisper.isRead = true
    localStorage.setItem(STORAGE_KEYS.WHISPERS, JSON.stringify(whispers))
  }
}

export function getUnreadWhisperCount(): number {
  return getWhispers().filter(w => !w.isRead).length
}

// Get all user data
export function getUserData(): UserData {
  return {
    user: getUser(),
    likedProjectIds: getLikedProjectIds(),
    comments: getUserComments(),
    whispers: getWhispers(),
  }
}
