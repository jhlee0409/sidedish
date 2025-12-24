/**
 * 프로젝트 관련 Zod 스키마
 *
 * 프로젝트 등록/수정 폼에서 사용되는 스키마를 정의합니다.
 */

import { z } from 'zod'
import { PROJECT_CONSTRAINTS, MILESTONE_EMOJIS } from '@/lib/form-constants'
import {
  nicknameSchema,
  optionalUrlSchema,
  imageUrlSchema,
  platformSchema,
  tagsSchema,
  projectLinksSchema,
  optionalTextSchema,
  requiredTextSchema,
} from './common'

// ============ 프로젝트 폼 스키마 ============

/**
 * 프로젝트 등록/수정 폼 스키마
 *
 * 주의: react-hook-form zodResolver 호환을 위해 .default() 사용 금지
 * 기본값은 useForm의 defaultValues에서 설정
 */
export const projectFormSchema = z.object({
  title: z
    .string()
    .min(PROJECT_CONSTRAINTS.TITLE_MIN_LENGTH, `제목은 ${PROJECT_CONSTRAINTS.TITLE_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(PROJECT_CONSTRAINTS.TITLE_MAX_LENGTH, `제목은 ${PROJECT_CONSTRAINTS.TITLE_MAX_LENGTH}자 이하여야 합니다.`),

  shortDescription: z
    .string()
    .min(1, '한 줄 소개를 입력해주세요.')
    .max(PROJECT_CONSTRAINTS.SHORT_DESC_MAX_LENGTH, `한 줄 소개는 ${PROJECT_CONSTRAINTS.SHORT_DESC_MAX_LENGTH}자 이하여야 합니다.`),

  description: z
    .string()
    .max(PROJECT_CONSTRAINTS.DESC_MAX_LENGTH, `설명은 ${PROJECT_CONSTRAINTS.DESC_MAX_LENGTH}자 이하여야 합니다.`),

  tags: z.array(z.string().min(1).max(PROJECT_CONSTRAINTS.TAG_MAX_LENGTH)).max(PROJECT_CONSTRAINTS.MAX_TAGS),

  imageUrl: z.string(),

  link: z.string(),

  githubUrl: z.string(),

  links: z.array(z.object({
    id: z.string(),
    storeType: z.string(),
    url: z.string(),
    label: z.string(),
    isPrimary: z.boolean(),
  })),

  platform: platformSchema,

  isBeta: z.boolean(),
})

export type ProjectFormData = z.infer<typeof projectFormSchema>

/**
 * 프로젝트 등록 폼 기본값
 */
export const projectFormDefaultValues: ProjectFormData = {
  title: '',
  shortDescription: '',
  description: '',
  tags: [],
  imageUrl: '',
  link: '',
  githubUrl: '',
  links: [],
  platform: 'WEB',
  isBeta: false,
}

// ============ 프로젝트 업데이트(개발로그/마일스톤) 스키마 ============

/**
 * 프로젝트 업데이트 타입
 */
export const projectUpdateTypeSchema = z.enum(['devlog', 'milestone'], {
  message: '올바른 기록 유형을 선택해주세요.',
})

export type ProjectUpdateType = z.infer<typeof projectUpdateTypeSchema>

/**
 * 마일스톤 이모지
 */
const milestoneEmojiValues = MILESTONE_EMOJIS.map(e => e.emoji) as [string, ...string[]]
export const milestoneEmojiSchema = z.enum(milestoneEmojiValues, {
  message: '올바른 아이콘을 선택해주세요.',
})

/**
 * 프로젝트 업데이트 폼 스키마
 *
 * 주의: react-hook-form zodResolver 호환을 위해 .default() 사용 금지
 */
export const projectUpdateFormSchema = z
  .object({
    type: projectUpdateTypeSchema,
    title: z
      .string()
      .min(1, '제목을 입력해주세요.')
      .max(100, '제목은 100자 이하여야 합니다.'),
    content: z
      .string()
      .min(1, '내용을 입력해주세요.')
      .max(5000, '내용은 5000자 이하여야 합니다.'),
    version: z
      .string()
      .max(20, '버전은 20자 이하여야 합니다.'),
    emoji: z.string(),
  })
  .superRefine((data, ctx) => {
    // milestone 타입일 때만 emoji 필수
    if (data.type === 'milestone' && !data.emoji) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '마일스톤에는 아이콘을 선택해주세요.',
        path: ['emoji'],
      })
    }
  })

export type ProjectUpdateFormData = z.infer<typeof projectUpdateFormSchema>

/**
 * 프로젝트 업데이트 폼 기본값
 */
export const projectUpdateFormDefaultValues: ProjectUpdateFormData = {
  type: 'devlog',
  title: '',
  content: '',
  version: '',
  emoji: '🚀',
}

// ============ 댓글 스키마 ============

/**
 * 댓글 폼 스키마
 */
export const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(1000, '댓글은 1000자 이하여야 합니다.'),
})

export type CommentFormData = z.infer<typeof commentFormSchema>

// ============ 귓속말 스키마 ============

/**
 * 귓속말 폼 스키마
 */
export const whisperFormSchema = z.object({
  content: z
    .string()
    .min(1, '귓속말 내용을 입력해주세요.')
    .max(2000, '귓속말은 2000자 이하여야 합니다.'),
})

export type WhisperFormData = z.infer<typeof whisperFormSchema>
