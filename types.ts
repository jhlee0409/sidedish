
export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  avatarUrl?: string; // Optional avatar
}

export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER';

export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  tags: string[];
  imageUrl: string;
  author: string;
  likes: number;
  reactions: { [key: string]: number }; // e.g., { 'fire': 10, 'clap': 5 }
  comments: Comment[];
  link: string;
  githubUrl?: string; // Optional GitHub repository link
  platform: ProjectPlatform; // Platform type
  createdAt: Date;
}

export type CreateProjectInput = Omit<Project, 'id' | 'likes' | 'createdAt' | 'reactions' | 'comments'>;

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}
