/**
 * 공통 Zod 스키마 정의
 *
 * 여러 폼에서 재사용되는 기본 스키마들을 정의합니다.
 * security-utils.ts의 상수와 form-constants.ts를 기반으로 합니다.
 */

import { z } from 'zod'
import { CONTENT_LIMITS, ALLOWED_PLATFORMS, ALLOWED_STORE_TYPES } from '@/lib/security-utils'
import { PROJECT_CONSTRAINTS, FILE_CONSTRAINTS } from '@/lib/form-constants'

// ============ 기본 문자열 스키마 ============

/**
 * 닉네임 스키마
 * - 2-20자
 * - 한글, 영문, 숫자, 밑줄(_), 공백만 허용
 */
export const nicknameSchema = z
  .string()
  .min(CONTENT_LIMITS.USER_NAME_MIN, `닉네임은 ${CONTENT_LIMITS.USER_NAME_MIN}자 이상이어야 합니다.`)
  .max(CONTENT_LIMITS.USER_NAME_MAX, `닉네임은 ${CONTENT_LIMITS.USER_NAME_MAX}자 이하여야 합니다.`)
  .regex(
    /^[가-힣a-zA-Z0-9_\s]+$/,
    '닉네임에 특수문자는 사용할 수 없습니다.'
  )

/**
 * URL 스키마 (선택적)
 */
export const optionalUrlSchema = z
  .string()
  .url('올바른 URL 형식이 아닙니다.')
  .max(CONTENT_LIMITS.URL_MAX, 'URL이 너무 깁니다.')
  .or(z.literal(''))
  .optional()
  .transform(val => val || '')

/**
 * URL 스키마 (필수)
 */
export const requiredUrlSchema = z
  .string()
  .min(1, 'URL을 입력해주세요.')
  .url('올바른 URL 형식이 아닙니다.')
  .max(CONTENT_LIMITS.URL_MAX, 'URL이 너무 깁니다.')

/**
 * 이미지 URL 스키마 (선택적)
 */
export const imageUrlSchema = z
  .string()
  .url('올바른 이미지 URL 형식이 아닙니다.')
  .max(CONTENT_LIMITS.URL_MAX, 'URL이 너무 깁니다.')
  .or(z.literal(''))
  .optional()
  .transform(val => val || '')

// ============ 플랫폼/타입 스키마 ============

/**
 * 프로젝트 플랫폼 타입
 */
export const platformSchema = z.enum(ALLOWED_PLATFORMS, {
  errorMap: () => ({ message: '올바른 플랫폼 타입을 선택해주세요.' }),
})

export type PlatformType = z.infer<typeof platformSchema>

/**
 * 스토어 타입
 */
export const storeTypeSchema = z.enum(ALLOWED_STORE_TYPES, {
  errorMap: () => ({ message: '올바른 스토어 타입을 선택해주세요.' }),
})

export type StoreType = z.infer<typeof storeTypeSchema>

// ============ 태그 스키마 ============

/**
 * 단일 태그 스키마
 */
export const tagSchema = z
  .string()
  .min(PROJECT_CONSTRAINTS.TAG_MIN_LENGTH, '태그는 1자 이상이어야 합니다.')
  .max(PROJECT_CONSTRAINTS.TAG_MAX_LENGTH, `태그는 ${PROJECT_CONSTRAINTS.TAG_MAX_LENGTH}자 이하여야 합니다.`)
  .transform(val => val.trim().toLowerCase())

/**
 * 태그 배열 스키마
 */
export const tagsSchema = z
  .array(tagSchema)
  .max(PROJECT_CONSTRAINTS.MAX_TAGS, `태그는 최대 ${PROJECT_CONSTRAINTS.MAX_TAGS}개까지 추가할 수 있습니다.`)
  .default([])
  .transform(tags => [...new Set(tags)]) // 중복 제거

// ============ 프로젝트 링크 스키마 ============

/**
 * 단일 프로젝트 링크 스키마
 */
export const projectLinkSchema = z.object({
  id: z.string().min(1).max(CONTENT_LIMITS.PROJECT_LINK_ID_MAX),
  storeType: storeTypeSchema,
  url: requiredUrlSchema,
  label: z
    .string()
    .max(CONTENT_LIMITS.PROJECT_LINK_LABEL_MAX, `라벨은 ${CONTENT_LIMITS.PROJECT_LINK_LABEL_MAX}자 이하여야 합니다.`)
    .optional()
    .transform(val => val?.trim() || undefined),
  isPrimary: z.boolean().default(false),
})

export type ProjectLink = z.infer<typeof projectLinkSchema>

/**
 * 프로젝트 링크 배열 스키마
 */
export const projectLinksSchema = z
  .array(projectLinkSchema)
  .max(CONTENT_LIMITS.PROJECT_LINKS_MAX_COUNT, `링크는 최대 ${CONTENT_LIMITS.PROJECT_LINKS_MAX_COUNT}개까지 추가할 수 있습니다.`)
  .default([])
  .superRefine((links, ctx) => {
    // 중복 ID 체크
    const ids = links.map(l => l.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '링크에 중복된 ID가 있습니다.',
      })
    }

    // 대표 링크는 하나만
    const primaryCount = links.filter(l => l.isPrimary).length
    if (primaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '대표 링크는 하나만 지정할 수 있습니다.',
      })
    }
  })

// ============ 파일 검증 스키마 ============

/**
 * 파일 크기 검증
 */
export const fileSizeSchema = z.number().max(
  FILE_CONSTRAINTS.MAX_SIZE_BYTES,
  `파일 크기는 ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB 이하여야 합니다.`
)

/**
 * 이미지 MIME 타입 검증
 */
export const imageTypeSchema = z.enum(FILE_CONSTRAINTS.ALLOWED_TYPES, {
  errorMap: () => ({ message: 'JPG, PNG, WebP, GIF 형식만 지원합니다.' }),
})

// ============ 일반 텍스트 스키마 ============

/**
 * 일반 텍스트 (선택적, 최대 길이만 제한)
 */
export const optionalTextSchema = (maxLength: number, fieldName: string = '텍스트') =>
  z
    .string()
    .max(maxLength, `${fieldName}은(는) ${maxLength}자 이하여야 합니다.`)
    .optional()
    .transform(val => val?.trim() || '')

/**
 * 필수 텍스트
 */
export const requiredTextSchema = (
  minLength: number,
  maxLength: number,
  fieldName: string = '텍스트'
) =>
  z
    .string()
    .min(minLength, `${fieldName}은(는) ${minLength}자 이상이어야 합니다.`)
    .max(maxLength, `${fieldName}은(는) ${maxLength}자 이하여야 합니다.`)
    .transform(val => val.trim())

// ============ 타입 내보내기 ============

export type TagsInput = z.input<typeof tagsSchema>
export type TagsOutput = z.output<typeof tagsSchema>
export type ProjectLinksInput = z.input<typeof projectLinksSchema>
export type ProjectLinksOutput = z.output<typeof projectLinksSchema>
