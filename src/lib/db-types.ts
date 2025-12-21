// Firestore Document Types
// These types represent how data is stored in Firestore

import { Timestamp } from 'firebase-admin/firestore'

import { UserRole } from './admin-constants'

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
  isBeta?: boolean // 베타/개발중 표시
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User agreements for terms and marketing consent
export interface UserAgreements {
  termsOfService: boolean // 서비스 이용약관 동의 (필수)
  privacyPolicy: boolean // 개인정보 처리방침 동의 (필수)
  marketing: boolean // 마케팅 수신 동의 (선택)
  agreedAt: Timestamp // 동의 시점
}

// Firestore document structure for Users
export interface UserDoc {
  id: string
  email?: string // 이메일 (권한 체크용)
  name: string
  avatarUrl: string
  role?: UserRole // 유저 역할 (user, admin, master)
  agreements?: UserAgreements // 회원가입 시 동의 정보
  isProfileComplete: boolean // 프로필 설정 완료 여부
  isWithdrawn?: boolean // 탈퇴 여부 (soft delete)
  withdrawnAt?: Timestamp // 탈퇴 시점
  withdrawalReason?: string // 탈퇴 사유
  withdrawalFeedback?: string // 불편 사항 피드백
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

// Project Update Types (마일스톤 + 메이커로그)
export type ProjectUpdateType = 'milestone' | 'devlog'

// Firestore document structure for Project Updates
export interface ProjectUpdateDoc {
  id: string
  projectId: string
  authorId: string
  authorName: string
  type: ProjectUpdateType
  title: string           // 마일스톤: "v1.0 출시", 개발로그: "로그인 기능 구현 중"
  content: string         // 마크다운 내용
  version?: string        // 마일스톤용 버전 (예: "1.0.0", "Beta 2")
  emoji?: string          // 마일스톤용 이모지 (🎉, 🚀, 🐛, ✨ 등)
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
  isBeta?: boolean
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
  isBeta?: boolean
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

// Project Update Input/Response types
export interface CreateProjectUpdateInput {
  projectId: string
  type: ProjectUpdateType
  title: string
  content: string
  version?: string
  emoji?: string
}

export interface ProjectUpdateResponse {
  id: string
  projectId: string
  authorId: string
  authorName: string
  type: ProjectUpdateType
  title: string
  content: string
  version?: string
  emoji?: string
  createdAt: string
}

// API Request types for user agreements (without Timestamp)
export interface CreateUserAgreementsInput {
  termsOfService: boolean
  privacyPolicy: boolean
  marketing: boolean
}

export interface CreateUserInput {
  name: string
  avatarUrl?: string
  agreements?: CreateUserAgreementsInput
  isProfileComplete?: boolean
}

export interface UpdateUserInput {
  name?: string
  avatarUrl?: string
  agreements?: CreateUserAgreementsInput
  isProfileComplete?: boolean
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
  isBeta?: boolean
  createdAt: string
  updatedAt: string
}

// API Response type for user agreements
export interface UserAgreementsResponse {
  termsOfService: boolean
  privacyPolicy: boolean
  marketing: boolean
  agreedAt: string
}

export interface UserResponse {
  id: string
  name: string
  avatarUrl: string
  role?: UserRole
  agreements?: UserAgreementsResponse
  isProfileComplete: boolean
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
