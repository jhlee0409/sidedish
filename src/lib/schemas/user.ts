/**
 * 사용자 관련 Zod 스키마
 *
 * 회원가입, 프로필 수정, 회원 탈퇴 등 사용자 관련 폼에서 사용되는 스키마를 정의합니다.
 */

import { z } from 'zod'
import { nicknameSchema, imageUrlSchema } from './common'

// ============ 회원가입 스키마 ============

/**
 * 회원가입 프로필 폼 스키마
 */
export const signupFormSchema = z.object({
  name: nicknameSchema,
  avatarUrl: imageUrlSchema,
  ageConfirmation: z.literal(true, {
    message: '만 14세 이상임을 확인해주세요.',
  }),
  termsOfService: z.literal(true, {
    message: '서비스 이용약관에 동의해주세요.',
  }),
  privacyPolicy: z.literal(true, {
    message: '개인정보 처리방침에 동의해주세요.',
  }),
  marketing: z.boolean(),
})

export type SignupFormData = z.infer<typeof signupFormSchema>

/**
 * 회원가입 폼 기본값
 */
export const signupFormDefaultValues = {
  name: '',
  avatarUrl: '',
  ageConfirmation: false as unknown as true,
  termsOfService: false as unknown as true,
  privacyPolicy: false as unknown as true,
  marketing: false,
}

// ============ 프로필 수정 스키마 ============

/**
 * 프로필 수정 폼 스키마
 */
export const profileEditFormSchema = z.object({
  name: nicknameSchema,
  avatarUrl: imageUrlSchema,
})

export type ProfileEditFormData = z.infer<typeof profileEditFormSchema>

/**
 * 프로필 수정 폼 기본값 생성
 */
export const createProfileEditDefaultValues = (
  currentName: string = '',
  currentAvatarUrl: string = ''
): ProfileEditFormData => ({
  name: currentName,
  avatarUrl: currentAvatarUrl,
})

// ============ 회원 탈퇴 스키마 ============

/**
 * 탈퇴 사유 목록
 */
export const WITHDRAWAL_REASONS = [
  '사이드 프로젝트 활동을 종료했어요',
  '사용 빈도가 낮아요',
  '다른 플랫폼을 이용 중이에요',
  '원하는 기능이 없어요',
  '이용이 불편하고 장애가 많아요',
  '개인정보 보호 목적이에요',
  '기타',
] as const

export type WithdrawalReason = typeof WITHDRAWAL_REASONS[number]

/**
 * 불편 사항 목록
 */
export const INCONVENIENCE_OPTIONS = [
  '프로젝트 등록 과정이 복잡해요',
  '원하는 기능이 부족해요',
  'AI 생성 결과가 만족스럽지 않아요',
  '다른 유저를 찾기 어려워요',
  '로딩이 느리거나 버그가 있어요',
  '디자인이 마음에 안 들어요',
  '특별히 불편한 점은 없었어요',
  '직접 입력',
] as const

export type InconvenienceOption = typeof INCONVENIENCE_OPTIONS[number]

/**
 * 회원 탈퇴 폼 스키마 - 사유 선택 단계
 */
export const withdrawalReasonFormSchema = z
  .object({
    selectedReason: z.enum(WITHDRAWAL_REASONS, {
      message: '탈퇴 사유를 선택해주세요.',
    }),
    customReason: z
      .string()
      .max(200, '탈퇴 사유는 200자 이하여야 합니다.')
      .optional()
      .transform(val => val?.trim() || ''),
  })
  .superRefine((data, ctx) => {
    // '기타' 선택 시 customReason 필수
    if (data.selectedReason === '기타' && !data.customReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '탈퇴 사유를 입력해주세요.',
        path: ['customReason'],
      })
    }
  })

export type WithdrawalReasonFormData = z.infer<typeof withdrawalReasonFormSchema>

/**
 * 회원 탈퇴 폼 스키마 - 피드백 단계
 */
export const withdrawalFeedbackFormSchema = z.object({
  selectedFeedback: z
    .array(z.enum(INCONVENIENCE_OPTIONS))
    .default([]),
  customFeedback: z
    .string()
    .max(500, '피드백은 500자 이하여야 합니다.')
    .optional()
    .transform(val => val?.trim() || ''),
})

export type WithdrawalFeedbackFormData = z.infer<typeof withdrawalFeedbackFormSchema>

/**
 * 회원 탈퇴 폼 스키마 - 최종 확인 단계
 */
export const withdrawalConfirmFormSchema = z.object({
  confirmText: z.literal('탈퇴합니다', {
    message: '"탈퇴합니다"를 정확히 입력해주세요.',
  }),
})

export type WithdrawalConfirmFormData = z.infer<typeof withdrawalConfirmFormSchema>

/**
 * 회원 탈퇴 전체 폼 스키마 (통합)
 *
 * 주의: react-hook-form zodResolver 호환을 위해 .default() 사용 금지
 */
export const withdrawalFullFormSchema = z.object({
  selectedReason: z.enum(WITHDRAWAL_REASONS),
  customReason: z.string().max(200),
  selectedFeedback: z.array(z.enum(INCONVENIENCE_OPTIONS)),
  customFeedback: z.string().max(500),
  confirmText: z.string(),
})

export type WithdrawalFullFormData = z.infer<typeof withdrawalFullFormSchema>

/**
 * 회원 탈퇴 폼 기본값
 */
export const withdrawalFormDefaultValues: WithdrawalFullFormData = {
  selectedReason: WITHDRAWAL_REASONS[0],
  customReason: '',
  selectedFeedback: [],
  customFeedback: '',
  confirmText: '',
}
