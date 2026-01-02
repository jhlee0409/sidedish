export interface Comment {
  id: string
  author: string
  content: string
  createdAt: Date
  avatarUrl?: string
}

// 프로젝트 메뉴 유형
export type ProjectPlatform =
  | 'WEB'        // 웹 서비스/웹앱/SaaS
  | 'MOBILE'     // 모바일 앱 (iOS/Android)
  | 'DESKTOP'    // 데스크탑 앱 (Windows/macOS/Linux)
  | 'GAME'       // 게임 (PC/모바일/콘솔)
  | 'EXTENSION'  // 확장 프로그램 (브라우저, IDE, 에디터)
  | 'LIBRARY'    // 라이브러리/패키지/CLI 도구
  | 'DESIGN'     // 디자인/템플릿/리소스
  | 'OTHER'      // 기타
  | 'APP'        // @deprecated - MOBILE 또는 DESKTOP 사용 권장 (하위 호환용)

// 스토어/플랫폼 타입 (다중 링크용)
export type StoreType =
  // 모바일 앱 스토어
  | 'APP_STORE'         // iOS App Store
  | 'PLAY_STORE'        // Google Play Store
  | 'GALAXY_STORE'      // Samsung Galaxy Store
  // 데스크탑 앱 스토어
  | 'MAC_APP_STORE'     // Mac App Store
  | 'WINDOWS_STORE'     // Microsoft Store
  | 'DIRECT_DOWNLOAD'   // 직접 다운로드 (.exe, .dmg, .zip)
  // 게임 스토어
  | 'STEAM'             // Steam
  | 'EPIC_GAMES'        // Epic Games Store
  | 'ITCH_IO'           // itch.io
  | 'GOG'               // GOG.com
  // 브라우저/에디터 확장
  | 'CHROME_WEB_STORE'  // Chrome Web Store
  | 'FIREFOX_ADDONS'    // Firefox Add-ons
  | 'EDGE_ADDONS'       // Edge Add-ons
  | 'VS_CODE'           // VS Code Marketplace
  // 패키지 저장소
  | 'NPM'               // npm
  | 'PYPI'              // PyPI
  // 일반 링크
  | 'WEBSITE'           // 웹사이트
  | 'GITHUB'            // GitHub
  | 'FIGMA'             // Figma 커뮤니티
  | 'NOTION'            // Notion
  | 'OTHER'             // 기타

// 프로젝트 링크 구조
export interface ProjectLink {
  id: string            // 고유 ID (nanoid 등으로 생성)
  storeType: StoreType  // 스토어 타입
  url: string           // URL
  label?: string        // 커스텀 라벨 (선택)
  isPrimary?: boolean   // 대표 링크 여부
}

// 링크 최대 개수
export const MAX_PROJECT_LINKS = 8

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
  /** @deprecated 하위 호환용 - links 배열 사용 권장 */
  link: string
  /** @deprecated 하위 호환용 - links 배열에 GITHUB 타입으로 추가 권장 */
  githubUrl?: string
  /** 다중 스토어 링크 (최대 8개) */
  links?: ProjectLink[]
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
  /** @deprecated 하위 호환용 - links 배열 사용 권장 */
  link: string
  /** @deprecated 하위 호환용 - links 배열에 GITHUB 타입으로 추가 권장 */
  githubUrl: string
  /** 다중 스토어 링크 (최대 8개) */
  links: ProjectLink[]
  platform: ProjectPlatform
  isBeta: boolean // 베타/개발중 표시
  aiCandidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
  generationCount: number
  lastSavedAt: number
  createdAt: number
  // 홍보 관련
  wantsPromotion?: boolean
  selectedPlatforms?: string[] // SocialPlatform[]
}
