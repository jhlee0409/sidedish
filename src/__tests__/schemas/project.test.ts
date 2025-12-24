import { describe, it, expect } from 'vitest'
import {
  projectFormSchema,
  projectFormDefaultValues,
  projectUpdateFormSchema,
  projectUpdateTypeSchema,
  commentFormSchema,
  whisperFormSchema,
} from '@/lib/schemas/project'

describe('projectFormSchema', () => {
  describe('valid submissions', () => {
    it('should accept minimal valid project', () => {
      const validProject = {
        title: '나의 첫 프로젝트',
        shortDescription: '간단한 소개입니다',
        description: '',
        tags: [],
        imageUrl: '',
        link: '',
        githubUrl: '',
        links: [],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(validProject)
      expect(result.success).toBe(true)
    })

    it('should accept full valid project', () => {
      const validProject = {
        title: '사이드디시 프로젝트',
        shortDescription: 'AI 기반 프로젝트 마켓플레이스입니다.',
        description: '## 프로젝트 소개\n\n개발자들을 위한 사이드 프로젝트 공유 플랫폼입니다.',
        tags: ['React', 'Next.js', 'Firebase'],
        imageUrl: 'https://example.com/image.png',
        link: 'https://sidedish.app',
        githubUrl: 'https://github.com/user/sidedish',
        links: [
          { id: 'link-1', storeType: 'WEB', url: 'https://sidedish.app', label: '', isPrimary: true },
          { id: 'link-2', storeType: 'GITHUB', url: 'https://github.com/user/sidedish', label: '', isPrimary: false },
        ],
        platform: 'WEB',
        isBeta: true,
      }
      const result = projectFormSchema.safeParse(validProject)
      expect(result.success).toBe(true)
    })

    it('should work with default values', () => {
      // Add required fields to defaults
      const projectWithDefaults = {
        ...projectFormDefaultValues,
        title: '테스트 프로젝트',
        shortDescription: '테스트입니다',
      }
      const result = projectFormSchema.safeParse(projectWithDefaults)
      expect(result.success).toBe(true)
    })
  })

  describe('title validation', () => {
    it('should reject empty title', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '',
        shortDescription: '설명',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title')
      }
    })

    it('should reject title shorter than minimum', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '짧',
        shortDescription: '설명',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })

    it('should reject title longer than maximum', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '가'.repeat(150),
        shortDescription: '설명',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('shortDescription validation', () => {
    it('should reject empty shortDescription', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('shortDescription')
      }
    })

    it('should reject shortDescription longer than maximum', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '가'.repeat(100),
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('tags validation', () => {
    it('should accept valid tags array', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '설명입니다',
        tags: ['React', 'NextJS'],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual(['React', 'NextJS'])
      }
    })

    it('should reject tags exceeding max count', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '설명입니다',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('platform validation', () => {
    it('should accept all valid platforms', () => {
      const platforms = ['WEB', 'APP', 'MOBILE', 'DESKTOP', 'GAME', 'EXTENSION', 'LIBRARY', 'DESIGN', 'OTHER']
      platforms.forEach(platform => {
        const project = {
          ...projectFormDefaultValues,
          title: '제목입니다',
          shortDescription: '설명입니다',
          platform,
        }
        const result = projectFormSchema.safeParse(project)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid platform', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '설명입니다',
        platform: 'INVALID',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('URL fields', () => {
    it('should accept valid URLs', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '설명입니다',
        link: 'https://example.com',
        githubUrl: 'https://github.com/user/repo',
        imageUrl: 'https://example.com/image.png',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })

    it('should accept any string for URL fields (simplified schema)', () => {
      // 주의: projectFormSchema는 RHF zodResolver 호환성을 위해 단순화되어 있음
      // URL 유효성 검사는 서버 사이드에서 별도로 수행됨
      const project = {
        ...projectFormDefaultValues,
        title: '제목입니다',
        shortDescription: '설명입니다',
        link: 'any-string',
        githubUrl: 'any-string',
        imageUrl: 'any-string',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })
})

describe('projectUpdateFormSchema', () => {
  describe('devlog type', () => {
    it('should accept valid devlog update', () => {
      const update = {
        type: 'devlog',
        title: '개발 일지 첫 번째',
        content: '오늘은 기능 A를 구현했습니다.',
        emoji: '🚀',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should accept devlog without version', () => {
      const update = {
        type: 'devlog',
        title: '버그 수정',
        content: '버그를 수정했습니다.',
        emoji: '🐛',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(true)
    })
  })

  describe('milestone type', () => {
    it('should accept valid milestone update', () => {
      const update = {
        type: 'milestone',
        title: '버전 1.0 출시',
        content: '드디어 첫 번째 정식 버전을 출시했습니다!',
        version: 'v1.0.0',
        emoji: '🎉',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should accept milestone with valid emojis', () => {
      // MILESTONE_EMOJIS에 정의된 이모지만 허용됨
      const validEmojis = ['🎉', '🚀', '✨', '🐛', '🔧', '📦', '🎨', '⚡', '🔒', '📝']
      validEmojis.forEach(emoji => {
        const update = {
          type: 'milestone',
          title: '마일스톤',
          content: '내용입니다',
          emoji,
        }
        const result = projectUpdateFormSchema.safeParse(update)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('validation errors', () => {
    it('should reject empty title', () => {
      const update = {
        type: 'devlog',
        title: '',
        content: '내용입니다',
        emoji: '🚀',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject empty content', () => {
      const update = {
        type: 'devlog',
        title: '제목입니다',
        content: '',
        emoji: '🚀',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject title exceeding max length', () => {
      const update = {
        type: 'devlog',
        title: '가'.repeat(150),
        content: '내용입니다',
        emoji: '🚀',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject invalid type', () => {
      const update = {
        type: 'invalid',
        title: '제목',
        content: '내용',
        emoji: '🚀',
      }
      const result = projectUpdateFormSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })
})

describe('projectUpdateTypeSchema', () => {
  it('should accept devlog', () => {
    expect(projectUpdateTypeSchema.safeParse('devlog').success).toBe(true)
  })

  it('should accept milestone', () => {
    expect(projectUpdateTypeSchema.safeParse('milestone').success).toBe(true)
  })

  it('should reject invalid types', () => {
    expect(projectUpdateTypeSchema.safeParse('blog').success).toBe(false)
    expect(projectUpdateTypeSchema.safeParse('').success).toBe(false)
  })
})

describe('commentFormSchema', () => {
  it('should accept valid comments', () => {
    const result = commentFormSchema.safeParse({ content: '좋은 프로젝트네요!' })
    expect(result.success).toBe(true)
  })

  it('should reject empty comments', () => {
    const result = commentFormSchema.safeParse({ content: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('입력')
    }
  })

  it('should reject comments exceeding max length', () => {
    const result = commentFormSchema.safeParse({ content: '가'.repeat(1001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('1000자')
    }
  })
})

describe('whisperFormSchema', () => {
  it('should accept valid whispers', () => {
    const result = whisperFormSchema.safeParse({ content: '비공개 피드백입니다.' })
    expect(result.success).toBe(true)
  })

  it('should reject empty whispers', () => {
    const result = whisperFormSchema.safeParse({ content: '' })
    expect(result.success).toBe(false)
  })

  it('should reject whispers exceeding max length', () => {
    const result = whisperFormSchema.safeParse({ content: '가'.repeat(2001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2000자')
    }
  })
})
