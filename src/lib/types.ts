export interface Comment {
  id: string
  author: string
  content: string
  createdAt: Date
  avatarUrl?: string
}

export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'

export interface Project {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  author: string
  likes: number
  reactions: { [key: string]: number }
  comments: Comment[]
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Date
}

export type CreateProjectInput = Omit<Project, 'id' | 'likes' | 'createdAt' | 'reactions' | 'comments'>

export interface User {
  id: string
  name: string
  avatarUrl: string
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

export interface UserData {
  user: User
  likedProjectIds: string[]
  comments: UserComment[]
  whispers: Whisper[]
}
