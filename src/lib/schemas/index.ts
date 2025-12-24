/**
 * Zod 스키마 모음
 *
 * 모든 폼 검증 스키마를 중앙에서 관리하고 내보냅니다.
 */

// ============ 공통 스키마 ============
export {
  // 기본 스키마
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
  // 타입
  type PlatformType,
  type StoreType,
  type ProjectLink,
  type TagsInput,
  type TagsOutput,
  type ProjectLinksInput,
  type ProjectLinksOutput,
} from './common'

// ============ 프로젝트 스키마 ============
export {
  // 프로젝트 폼
  projectFormSchema,
  projectFormDefaultValues,
  type ProjectFormData,
  // 프로젝트 업데이트
  projectUpdateTypeSchema,
  milestoneEmojiSchema,
  projectUpdateFormSchema,
  projectUpdateFormDefaultValues,
  type ProjectUpdateType,
  type ProjectUpdateFormData,
  // 댓글
  commentFormSchema,
  type CommentFormData,
  // 귓속말
  whisperFormSchema,
  type WhisperFormData,
} from './project'

// ============ 사용자 스키마 ============
export {
  // 회원가입
  signupFormSchema,
  signupFormDefaultValues,
  type SignupFormData,
  // 프로필 수정
  profileEditFormSchema,
  createProfileEditDefaultValues,
  type ProfileEditFormData,
  // 회원 탈퇴
  WITHDRAWAL_REASONS,
  INCONVENIENCE_OPTIONS,
  withdrawalReasonFormSchema,
  withdrawalFeedbackFormSchema,
  withdrawalConfirmFormSchema,
  withdrawalFullFormSchema,
  withdrawalFormDefaultValues,
  type WithdrawalReason,
  type InconvenienceOption,
  type WithdrawalReasonFormData,
  type WithdrawalFeedbackFormData,
  type WithdrawalConfirmFormData,
  type WithdrawalFullFormData,
} from './user'
