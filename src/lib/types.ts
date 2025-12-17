export interface Comment {
  id: string
  author: string
  content: string
  createdAt: Date
  avatarUrl?: string
}

export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'

// Reaction types - strongly typed reaction keys
export type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love'

// Reactions can be partial since not all reactions may have counts
export type Reactions = Partial<Record<ReactionKey, number>>

export interface Project {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  author: string
  likes: number
  reactions: Reactions
  comments: Comment[]
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Date
}

export type CreateProjectInput = Omit<Project, 'id' | 'likes' | 'createdAt' | 'reactions' | 'comments'>

export interface UserAgreements {
  termsOfService: boolean
  privacyPolicy: boolean
  marketing: boolean
  agreedAt: Date
}

export interface User {
  id: string
  name: string
  avatarUrl: string
  agreements?: UserAgreements
  isProfileComplete: boolean
  createdAt: Date
}

export interface UserComment extends Comment {
  projectId: string
  projectTitle: string
}

export interface Whisper {
  id: string
  projectId: string
  projectTitle: string
  senderName: string
  content: string
  createdAt: Date
  isRead: boolean
}

// AI Generation Types
export interface AiGeneratedContent {
  shortDescription: string
  description: string
  tags: string[]
  generatedAt: number // timestamp
}

export interface AiGenerationCandidate {
  id: string
  content: AiGeneratedContent
  isSelected: boolean
}

export interface DraftData {
  id: string // unique draft ID
  title: string
  shortDescription: string
  description: string
  tags: string[]
  imageUrl: string
  link: string
  githubUrl: string
  platform: ProjectPlatform
  aiCandidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
  generationCount: number
  lastSavedAt: number
  createdAt: number
}
