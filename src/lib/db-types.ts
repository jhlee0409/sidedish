// Firestore Document Types
// These types represent how data is stored in Firestore

import { Timestamp } from 'firebase-admin/firestore'

export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'

// Reaction types - strongly typed reaction keys
export type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love'

// Reactions can be partial since not all reactions may have counts
export type Reactions = Partial<Record<ReactionKey, number>>

// Firestore document structure for Projects
export interface ProjectDoc {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  authorId: string
  authorName: string
  likes: number
  reactions: Reactions
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Firestore document structure for Users
export interface UserDoc {
  id: string
  name: string
  avatarUrl: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Firestore document structure for Comments
export interface CommentDoc {
  id: string
  projectId: string
  authorId: string
  authorName: string
  avatarUrl?: string
  content: string
  createdAt: Timestamp
}

// Firestore document structure for Likes (subcollection or separate collection)
export interface LikeDoc {
  id: string
  projectId: string
  userId: string
  createdAt: Timestamp
}

// Firestore document structure for Whispers (private feedback)
export interface WhisperDoc {
  id: string
  projectId: string
  projectTitle: string
  projectAuthorId: string
  senderName: string
  senderId?: string
  content: string
  isRead: boolean
  createdAt: Timestamp
}

// API Request/Response types
export interface CreateProjectInput {
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  authorId: string
  authorName: string
  link: string
  githubUrl?: string
  platform: ProjectPlatform
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  shortDescription?: string
  tags?: string[]
  imageUrl?: string
  link?: string
  githubUrl?: string
  platform?: ProjectPlatform
}

export interface CreateCommentInput {
  projectId: string
  authorId: string
  authorName: string
  avatarUrl?: string
  content: string
}

export interface CreateWhisperInput {
  projectId: string
  projectTitle: string
  projectAuthorId: string
  senderName: string
  senderId?: string
  content: string
}

export interface CreateUserInput {
  name: string
  avatarUrl?: string
}

export interface UpdateUserInput {
  name?: string
  avatarUrl?: string
}

// API Response types (serialized for JSON)
export interface ProjectResponse {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  authorId: string
  authorName: string
  likes: number
  reactions: Reactions
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: string
  updatedAt: string
}

export interface UserResponse {
  id: string
  name: string
  avatarUrl: string
  createdAt: string
}

export interface CommentResponse {
  id: string
  projectId: string
  authorId: string
  authorName: string
  avatarUrl?: string
  content: string
  createdAt: string
}

export interface WhisperResponse {
  id: string
  projectId: string
  projectTitle: string
  senderName: string
  content: string
  isRead: boolean
  createdAt: string
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}
