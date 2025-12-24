import { describe, it, expect } from 'vitest'
import {
  nicknameSchema,
  optionalUrlSchema,
  requiredUrlSchema,
  imageUrlSchema,
  platformSchema,
  storeTypeSchema,
  tagSchema,
  tagsSchema,
  projectLinkSchema,
  projectLinksSchema,
  fileSizeSchema,
  imageTypeSchema,
  optionalTextSchema,
  requiredTextSchema,
} from '@/lib/schemas/common'

describe('nicknameSchema', () => {
  it('should accept valid Korean nicknames', () => {
    const result = nicknameSchema.safeParse('홍길동')
    expect(result.success).toBe(true)
  })

  it('should accept valid English nicknames', () => {
    const result = nicknameSchema.safeParse('John Doe')
    expect(result.success).toBe(true)
  })

  it('should accept mixed nicknames with underscore', () => {
    const result = nicknameSchema.safeParse('개발자_dev123')
    expect(result.success).toBe(true)
  })

  it('should reject nicknames shorter than minimum', () => {
    const result = nicknameSchema.safeParse('홍')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2자')
    }
  })

  it('should reject nicknames longer than maximum', () => {
    const result = nicknameSchema.safeParse('가'.repeat(25))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20자')
    }
  })

  it('should reject nicknames with special characters', () => {
    const invalidNames = ['test@name', 'name#123', 'user!', 'hello$world']
    invalidNames.forEach(name => {
      const result = nicknameSchema.safeParse(name)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('특수문자')
      }
    })
  })
})

describe('optionalUrlSchema', () => {
  it('should accept valid URLs', () => {
    const result = optionalUrlSchema.safeParse('https://example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })

  it('should accept empty string', () => {
    const result = optionalUrlSchema.safeParse('')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('')
    }
  })

  it('should trim whitespace URLs', () => {
    const result = optionalUrlSchema.safeParse('  https://example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      // transform 후 pipe로 URL 검증 통과
      expect(result.data).toBe('https://example.com')
    }
  })

  it('should return empty string for whitespace-only input', () => {
    const result = optionalUrlSchema.safeParse('   ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('')
    }
  })

  it('should reject invalid URLs', () => {
    const result = optionalUrlSchema.safeParse('not-a-url')
    expect(result.success).toBe(false)
  })
})

describe('requiredUrlSchema', () => {
  it('should accept valid URLs', () => {
    const result = requiredUrlSchema.safeParse('https://github.com/user/repo')
    expect(result.success).toBe(true)
  })

  it('should reject empty string', () => {
    const result = requiredUrlSchema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('입력')
    }
  })

  it('should reject invalid URLs', () => {
    // 스키마가 없는 문자열은 URL이 아님
    const result = requiredUrlSchema.safeParse('not-a-url')
    expect(result.success).toBe(false)
  })
})

describe('platformSchema', () => {
  it('should accept valid platforms', () => {
    // ALLOWED_PLATFORMS: WEB, APP, MOBILE, DESKTOP, GAME, EXTENSION, LIBRARY, DESIGN, OTHER
    const validPlatforms = ['WEB', 'APP', 'MOBILE', 'DESKTOP', 'GAME', 'EXTENSION', 'LIBRARY', 'DESIGN', 'OTHER']
    validPlatforms.forEach(platform => {
      const result = platformSchema.safeParse(platform)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid platforms', () => {
    const result = platformSchema.safeParse('INVALID')
    expect(result.success).toBe(false)
    // 에러가 발생함을 확인
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })

  it('should reject lowercase platforms', () => {
    const result = platformSchema.safeParse('web')
    expect(result.success).toBe(false)
  })
})

describe('storeTypeSchema', () => {
  it('should accept valid store types', () => {
    // ALLOWED_STORE_TYPES: APP_STORE, PLAY_STORE, GALAXY_STORE, MAC_APP_STORE, WINDOWS_STORE,
    // DIRECT_DOWNLOAD, STEAM, EPIC_GAMES, ITCH_IO, GOG, CHROME_WEB_STORE, FIREFOX_ADDONS,
    // EDGE_ADDONS, VS_CODE, NPM, PYPI, WEBSITE, GITHUB, FIGMA, NOTION, OTHER
    const validTypes = ['WEBSITE', 'APP_STORE', 'PLAY_STORE', 'GITHUB', 'FIGMA', 'NOTION', 'OTHER']
    validTypes.forEach(type => {
      const result = storeTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid store types', () => {
    // 'WEB'은 ALLOWED_STORE_TYPES에 없음 (WEBSITE 사용)
    const result = storeTypeSchema.safeParse('WEB')
    expect(result.success).toBe(false)
  })
})

describe('tagSchema', () => {
  it('should accept valid tags and transform to lowercase', () => {
    const result = tagSchema.safeParse('React')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('react') // transformed to lowercase
    }
  })

  it('should trim whitespace and transform to lowercase', () => {
    const result = tagSchema.safeParse('  TypeScript  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('typescript')
    }
  })

  it('should reject empty tags', () => {
    const result = tagSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject tags exceeding max length', () => {
    const result = tagSchema.safeParse('a'.repeat(25))
    expect(result.success).toBe(false)
  })
})

describe('tagsSchema', () => {
  it('should accept valid tags array', () => {
    const result = tagsSchema.safeParse(['React', 'TypeScript', 'Node.js'])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'typescript', 'node.js'])
    }
  })

  it('should deduplicate tags', () => {
    const result = tagsSchema.safeParse(['React', 'REACT', 'react'])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react'])
    }
  })

  it('should default to empty array', () => {
    const result = tagsSchema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })

  it('should reject more than 5 tags', () => {
    const result = tagsSchema.safeParse(['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('5개')
    }
  })
})

describe('projectLinkSchema', () => {
  it('should accept valid project link', () => {
    const validLink = {
      id: 'link-1',
      storeType: 'WEBSITE',
      url: 'https://example.com',
      isPrimary: true,
    }
    const result = projectLinkSchema.safeParse(validLink)
    expect(result.success).toBe(true)
  })

  it('should accept link with label', () => {
    const validLink = {
      id: 'link-2',
      storeType: 'GITHUB',
      url: 'https://github.com/user/repo',
      label: 'GitHub Repository',
      isPrimary: false,
    }
    const result = projectLinkSchema.safeParse(validLink)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('GitHub Repository')
    }
  })

  it('should default label to empty string when not provided', () => {
    const validLink = {
      id: 'link-3',
      storeType: 'WEBSITE',
      url: 'https://example.com',
      isPrimary: false,
    }
    const result = projectLinkSchema.safeParse(validLink)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('')
    }
  })

  it('should reject invalid URL in link', () => {
    const invalidLink = {
      id: 'link-3',
      storeType: 'WEBSITE',
      url: 'not-a-url',
      isPrimary: false,
    }
    const result = projectLinkSchema.safeParse(invalidLink)
    expect(result.success).toBe(false)
  })

  it('should reject invalid store type', () => {
    const invalidLink = {
      id: 'link-4',
      storeType: 'INVALID_STORE',
      url: 'https://example.com',
      isPrimary: false,
    }
    const result = projectLinkSchema.safeParse(invalidLink)
    expect(result.success).toBe(false)
  })
})

describe('projectLinksSchema', () => {
  it('should accept valid links array', () => {
    const links = [
      { id: 'link-1', storeType: 'WEBSITE', url: 'https://example.com', isPrimary: true },
      { id: 'link-2', storeType: 'GITHUB', url: 'https://github.com/user', isPrimary: false },
    ]
    const result = projectLinksSchema.safeParse(links)
    expect(result.success).toBe(true)
  })

  it('should reject duplicate IDs', () => {
    const links = [
      { id: 'same-id', storeType: 'WEBSITE', url: 'https://example.com', isPrimary: true },
      { id: 'same-id', storeType: 'GITHUB', url: 'https://github.com/user', isPrimary: false },
    ]
    const result = projectLinksSchema.safeParse(links)
    expect(result.success).toBe(false)
    if (!result.success) {
      // superRefine에서 중복 체크
      const hasIssue = result.error.issues.some(i => i.message.includes('중복'))
      expect(hasIssue).toBe(true)
    }
  })

  it('should reject multiple primary links', () => {
    const links = [
      { id: 'link-1', storeType: 'WEBSITE', url: 'https://example1.com', isPrimary: true },
      { id: 'link-2', storeType: 'GITHUB', url: 'https://github.com/user', isPrimary: true },
    ]
    const result = projectLinksSchema.safeParse(links)
    expect(result.success).toBe(false)
    if (!result.success) {
      // superRefine에서 대표 링크 체크
      const hasIssue = result.error.issues.some(i => i.message.includes('대표 링크'))
      expect(hasIssue).toBe(true)
    }
  })

  it('should reject more than max links', () => {
    const links = Array.from({ length: 11 }, (_, i) => ({
      id: `link-${i}`,
      storeType: 'WEBSITE' as const,
      url: `https://example${i}.com`,
      isPrimary: i === 0,
    }))
    const result = projectLinksSchema.safeParse(links)
    expect(result.success).toBe(false)
  })
})

describe('fileSizeSchema', () => {
  it('should accept valid file sizes', () => {
    const result = fileSizeSchema.safeParse(1024 * 1024) // 1MB
    expect(result.success).toBe(true)
  })

  it('should reject files exceeding max size', () => {
    const result = fileSizeSchema.safeParse(10 * 1024 * 1024) // 10MB
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('MB')
    }
  })
})

describe('imageTypeSchema', () => {
  it('should accept valid image types', () => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    validTypes.forEach(type => {
      const result = imageTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid image types', () => {
    const result = imageTypeSchema.safeParse('image/svg+xml')
    expect(result.success).toBe(false)
    // 에러가 발생함을 확인
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('optionalTextSchema', () => {
  it('should accept valid text', () => {
    const schema = optionalTextSchema(100, '설명')
    const result = schema.safeParse('유효한 텍스트')
    expect(result.success).toBe(true)
  })

  it('should trim whitespace', () => {
    const schema = optionalTextSchema(100, '설명')
    const result = schema.safeParse('  텍스트  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('텍스트')
    }
  })

  it('should transform undefined to empty string', () => {
    const schema = optionalTextSchema(100, '설명')
    const result = schema.safeParse(undefined)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('')
    }
  })

  it('should reject text exceeding max length', () => {
    const schema = optionalTextSchema(10, '설명')
    const result = schema.safeParse('이것은 매우 긴 텍스트입니다')
    expect(result.success).toBe(false)
  })
})

describe('requiredTextSchema', () => {
  it('should accept valid text within range', () => {
    const schema = requiredTextSchema(5, 100, '제목')
    const result = schema.safeParse('유효한 제목입니다')
    expect(result.success).toBe(true)
  })

  it('should reject text shorter than minimum', () => {
    const schema = requiredTextSchema(5, 100, '제목')
    const result = schema.safeParse('짧')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('5자')
    }
  })

  it('should reject text exceeding maximum', () => {
    const schema = requiredTextSchema(1, 10, '제목')
    const result = schema.safeParse('이것은 매우 긴 제목입니다')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10자')
    }
  })
})
