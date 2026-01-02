/**
 * 메뉴 등록/수정 폼 종합 테스트
 *
 * 치명적 버그 방지를 위한 필수 테스트 케이스
 */

import { describe, it, expect } from 'vitest'
import {
  projectFormSchema,
  projectFormDefaultValues,
} from '@/lib/schemas/project'
import { PROJECT_CONSTRAINTS } from '@/lib/form-constants'

describe('메뉴 등록 폼 검증', () => {
  describe('최소 필수 필드만으로 등록 가능', () => {
    it('제목과 한 줄 소개만 있으면 등록 가능해야 함', () => {
      const minimalProject = {
        ...projectFormDefaultValues,
        title: '테스트 프로젝트',
        shortDescription: '한 줄 소개입니다',
      }
      const result = projectFormSchema.safeParse(minimalProject)
      expect(result.success).toBe(true)
    })

    it('선택 필드가 모두 비어있어도 등록 가능해야 함', () => {
      const project = {
        title: '나의 프로젝트',
        shortDescription: '소개글',
        description: '',
        tags: [],
        imageUrl: '',
        link: '',
        githubUrl: '',
        links: [],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('썸네일 없이 등록 가능', () => {
    it('imageUrl이 빈 문자열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '썸네일 없는 프로젝트',
        shortDescription: '소개',
        imageUrl: '',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('링크 없이 등록 가능', () => {
    it('links가 빈 배열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '링크 없는 프로젝트',
        shortDescription: '소개',
        links: [],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })

    it('link, githubUrl이 빈 문자열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '링크 없는 프로젝트',
        shortDescription: '소개',
        link: '',
        githubUrl: '',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('태그 없이 등록 가능', () => {
    it('tags가 빈 배열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '태그 없는 프로젝트',
        shortDescription: '소개',
        tags: [],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('상세 설명 없이 등록 가능', () => {
    it('description이 빈 문자열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '설명 없는 프로젝트',
        shortDescription: '소개',
        description: '',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('links 배열 검증', () => {
    it('링크에 label이 빈 문자열이어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '소개',
        links: [
          { id: 'link-1', storeType: 'WEBSITE', url: 'https://example.com', label: '', isPrimary: true },
        ],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })

    it('여러 링크를 추가해도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '소개',
        links: [
          { id: 'link-1', storeType: 'WEBSITE', url: 'https://example.com', label: '', isPrimary: true },
          { id: 'link-2', storeType: 'GITHUB', url: 'https://github.com/test', label: 'GitHub', isPrimary: false },
          { id: 'link-3', storeType: 'APP_STORE', url: 'https://apps.apple.com/app', label: '', isPrimary: false },
        ],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })

    it('링크의 label이 있어도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '소개',
        links: [
          { id: 'link-1', storeType: 'WEBSITE', url: 'https://example.com', label: '공식 웹사이트', isPrimary: true },
        ],
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('모든 플랫폼 타입 등록 가능', () => {
    const platforms = ['WEB', 'MOBILE', 'DESKTOP', 'GAME', 'EXTENSION', 'LIBRARY', 'DESIGN', 'OTHER', 'APP']

    platforms.forEach(platform => {
      it(`platform이 ${platform}일 때 등록 가능해야 함`, () => {
        const project = {
          ...projectFormDefaultValues,
          title: '프로젝트',
          shortDescription: '소개',
          platform,
        }
        const result = projectFormSchema.safeParse(project)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('isBeta 플래그 검증', () => {
    it('isBeta가 true여도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '베타 프로젝트',
        shortDescription: '소개',
        isBeta: true,
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })

    it('isBeta가 false여도 등록 가능해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '정식 프로젝트',
        shortDescription: '소개',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(true)
    })
  })

  describe('실제 사용 시나리오', () => {
    it('AI 생성 결과로 등록 가능해야 함', () => {
      // AI가 생성한 형태의 데이터
      const aiGeneratedProject = {
        ...projectFormDefaultValues,
        title: 'AI 생성 프로젝트',
        shortDescription: 'AI가 생성한 한 줄 소개입니다.',
        description: '## 프로젝트 소개\n\nAI가 생성한 상세 설명입니다.\n\n### 주요 기능\n- 기능 1\n- 기능 2',
        tags: ['AI', 'Next.js', 'React'],
      }
      const result = projectFormSchema.safeParse(aiGeneratedProject)
      expect(result.success).toBe(true)
    })

    it('수정 페이지에서 불러온 데이터로 저장 가능해야 함', () => {
      // API에서 불러온 데이터 형태
      const loadedProject = {
        title: '기존 프로젝트',
        shortDescription: '기존 소개',
        description: '기존 설명',
        tags: ['tag1', 'tag2'],
        imageUrl: 'https://example.com/image.jpg',
        link: 'https://example.com',
        githubUrl: 'https://github.com/test/repo',
        links: [
          { id: 'link-1', storeType: 'WEBSITE', url: 'https://example.com', label: '', isPrimary: true },
        ],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(loadedProject)
      expect(result.success).toBe(true)
    })

    it('임시저장 후 다시 불러와서 등록 가능해야 함', () => {
      // 임시저장 데이터 형태
      const draftData = {
        title: '임시저장 프로젝트',
        shortDescription: '임시저장 소개',
        description: '임시저장 설명',
        tags: [],
        imageUrl: '',
        link: '',
        githubUrl: '',
        links: [],
        platform: 'MOBILE',
        isBeta: true,
      }
      const result = projectFormSchema.safeParse(draftData)
      expect(result.success).toBe(true)
    })
  })
})

describe('메뉴 등록 실패 케이스 (명확한 에러 메시지 필요)', () => {
  describe('제목 검증', () => {
    it('제목이 없으면 실패해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '',
        shortDescription: '소개',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('title'))).toBe(true)
      }
    })

    it('제목이 1자이면 실패해야 함 (최소 2자)', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '짧',
        shortDescription: '소개',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })

    it('제목이 100자를 초과하면 실패해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '가'.repeat(101),
        shortDescription: '소개',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('한 줄 소개 검증', () => {
    it('한 줄 소개가 없으면 실패해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('shortDescription'))).toBe(true)
      }
    })

    it('한 줄 소개가 80자를 초과하면 실패해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '가'.repeat(81),
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('태그 검증', () => {
    it(`태그가 ${PROJECT_CONSTRAINTS.MAX_TAGS}개를 초과하면 실패해야 함`, () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '소개',
        tags: Array.from({ length: PROJECT_CONSTRAINTS.MAX_TAGS + 1 }, (_, i) => `tag${i + 1}`),
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })

  describe('플랫폼 검증', () => {
    it('잘못된 플랫폼 값이면 실패해야 함', () => {
      const project = {
        ...projectFormDefaultValues,
        title: '프로젝트',
        shortDescription: '소개',
        platform: 'INVALID_PLATFORM',
      }
      const result = projectFormSchema.safeParse(project)
      expect(result.success).toBe(false)
    })
  })
})

describe('메뉴 수정 폼 검증', () => {
  describe('기존 데이터 유지', () => {
    it('기존 프로젝트 데이터를 그대로 저장 가능해야 함', () => {
      const existingProject = {
        title: '기존 프로젝트',
        shortDescription: '기존 소개',
        description: '기존 상세 설명입니다.',
        tags: ['React', 'TypeScript'],
        imageUrl: 'https://example.com/existing.jpg',
        link: 'https://existing-project.com',
        githubUrl: 'https://github.com/user/existing',
        links: [
          { id: 'existing-1', storeType: 'WEBSITE', url: 'https://existing-project.com', label: '공식 사이트', isPrimary: true },
          { id: 'existing-2', storeType: 'GITHUB', url: 'https://github.com/user/existing', label: '', isPrimary: false },
        ],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(existingProject)
      expect(result.success).toBe(true)
    })
  })

  describe('부분 수정', () => {
    it('제목만 변경해도 저장 가능해야 함', () => {
      const modifiedProject = {
        title: '수정된 제목',  // 변경됨
        shortDescription: '기존 소개',
        description: '기존 설명',
        tags: ['tag1'],
        imageUrl: 'https://example.com/image.jpg',
        link: 'https://example.com',
        githubUrl: '',
        links: [],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(modifiedProject)
      expect(result.success).toBe(true)
    })

    it('링크를 모두 삭제해도 저장 가능해야 함', () => {
      const modifiedProject = {
        title: '프로젝트',
        shortDescription: '소개',
        description: '설명',
        tags: [],
        imageUrl: '',
        link: '',
        githubUrl: '',
        links: [],  // 모든 링크 삭제
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(modifiedProject)
      expect(result.success).toBe(true)
    })

    it('태그를 모두 삭제해도 저장 가능해야 함', () => {
      const modifiedProject = {
        title: '프로젝트',
        shortDescription: '소개',
        description: '설명',
        tags: [],  // 모든 태그 삭제
        imageUrl: '',
        link: '',
        githubUrl: '',
        links: [],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(modifiedProject)
      expect(result.success).toBe(true)
    })

    it('썸네일을 삭제해도 저장 가능해야 함', () => {
      const modifiedProject = {
        title: '프로젝트',
        shortDescription: '소개',
        description: '설명',
        tags: [],
        imageUrl: '',  // 썸네일 삭제
        link: '',
        githubUrl: '',
        links: [],
        platform: 'WEB',
        isBeta: false,
      }
      const result = projectFormSchema.safeParse(modifiedProject)
      expect(result.success).toBe(true)
    })
  })
})

describe('엣지 케이스', () => {
  it('제목이 정확히 2자일 때 등록 가능해야 함 (최소 길이)', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '가나',
      shortDescription: '소개',
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('제목이 정확히 100자일 때 등록 가능해야 함 (최대 길이)', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '가'.repeat(100),
      shortDescription: '소개',
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('한 줄 소개가 정확히 1자일 때 등록 가능해야 함 (최소 길이)', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '프로젝트',
      shortDescription: '소',
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('한 줄 소개가 정확히 80자일 때 등록 가능해야 함 (최대 길이)', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '프로젝트',
      shortDescription: '가'.repeat(80),
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it(`태그가 정확히 ${PROJECT_CONSTRAINTS.MAX_TAGS}개일 때 등록 가능해야 함`, () => {
    const project = {
      ...projectFormDefaultValues,
      title: '프로젝트',
      shortDescription: '소개',
      tags: Array.from({ length: PROJECT_CONSTRAINTS.MAX_TAGS }, (_, i) => `tag${i + 1}`),
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('특수문자가 포함된 제목으로 등록 가능해야 함', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '프로젝트 v2.0 (Beta) - 테스트!',
      shortDescription: '소개',
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('이모지가 포함된 제목으로 등록 가능해야 함', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '🚀 프로젝트 출시!',
      shortDescription: '소개',
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })

  it('마크다운이 포함된 설명으로 등록 가능해야 함', () => {
    const project = {
      ...projectFormDefaultValues,
      title: '프로젝트',
      shortDescription: '소개',
      description: `# 제목

## 소제목

- 목록 1
- 목록 2

\`\`\`javascript
console.log('Hello');
\`\`\`

[링크](https://example.com)

> 인용문
`,
    }
    const result = projectFormSchema.safeParse(project)
    expect(result.success).toBe(true)
  })
})
