/**
 * 폼 관련 상수 정의
 *
 * 프로젝트 등록/수정, 파일 업로드, AI 생성 등에 사용되는
 * 모든 제약사항과 설정값을 중앙에서 관리합니다.
 */

// 프로젝트 폼 제약사항
export const PROJECT_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 100,
  SHORT_DESC_MAX_LENGTH: 80,
  DESC_MIN_LENGTH: 30,
  DESC_MAX_LENGTH: 10_000,
  MAX_TAGS: 10,
  TAG_MIN_LENGTH: 1,
  TAG_MAX_LENGTH: 20,
} as const

// 파일 업로드 제약사항
export const FILE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const,
} as const

// AI 생성 제약사항
export const AI_CONSTRAINTS = {
  MAX_PER_DRAFT: 3,
  MAX_PER_DAY: 10,
  COOLDOWN_MS: 5000, // 5초
  COOLDOWN_SECONDS: 5,
  MIN_DESC_LENGTH: 30,
} as const

// 폼 타이밍 관련 상수
export const FORM_TIMING = {
  AUTOSAVE_DELAY_MS: 1000,
  COOLDOWN_CHECK_INTERVAL_MS: 1000,
  WHISPER_SUCCESS_DISPLAY_MS: 3000,
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION_MS: 4000,
} as const

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  PROJECTS_LIMIT: 12,
  COMMENTS_LIMIT: 20,
  UPDATES_LIMIT: 10,
} as const

// 마일스톤 이모지 옵션
export const MILESTONE_EMOJIS = [
  { emoji: '🎉', label: '축하', value: 'celebration' },
  { emoji: '🚀', label: '출시', value: 'launch' },
  { emoji: '✨', label: '새기능', value: 'feature' },
  { emoji: '🐛', label: '버그수정', value: 'bugfix' },
  { emoji: '🔧', label: '개선', value: 'improvement' },
  { emoji: '📦', label: '배포', value: 'deploy' },
  { emoji: '🎨', label: '디자인', value: 'design' },
  { emoji: '⚡', label: '성능', value: 'performance' },
  { emoji: '🔒', label: '보안', value: 'security' },
  { emoji: '📝', label: '문서', value: 'docs' },
  { emoji: '🌟', label: '성과', value: 'achievement' },
  { emoji: '💡', label: '아이디어', value: 'idea' },
] as const

export const ALLOWED_MILESTONE_EMOJIS = MILESTONE_EMOJIS.map(e => e.emoji)

// 에러 메시지 템플릿
export const FORM_ERROR_MESSAGES = {
  TITLE_REQUIRED: '제목을 입력해주세요.',
  TITLE_TOO_SHORT: `제목은 최소 ${PROJECT_CONSTRAINTS.TITLE_MIN_LENGTH}자 이상이어야 합니다.`,
  TITLE_TOO_LONG: `제목은 최대 ${PROJECT_CONSTRAINTS.TITLE_MAX_LENGTH}자까지 입력 가능합니다.`,
  DESC_TOO_SHORT: `설명은 최소 ${PROJECT_CONSTRAINTS.DESC_MIN_LENGTH}자 이상이어야 합니다.`,
  SHORT_DESC_REQUIRED: '한 줄 소개를 입력해주세요.',
  MAX_TAGS_REACHED: `태그는 최대 ${PROJECT_CONSTRAINTS.MAX_TAGS}개까지 추가할 수 있습니다.`,
  FILE_TOO_LARGE: `파일 크기는 ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB 이하여야 합니다.`,
  IMAGE_UPLOAD_FAILED: '이미지 업로드에 실패했습니다. 다시 시도해주세요.',
  AI_LIMIT_DRAFT: (max: number) => `이 프로젝트는 이미 ${max}번 AI 생성을 사용했습니다.`,
  AI_LIMIT_DAY: (max: number) => `오늘의 AI 생성 한도(${max}회)를 모두 사용했습니다.`,
  AI_DESC_TOO_SHORT: (min: number, current: number) =>
    `최소 ${min}자 이상의 설명을 입력해주세요. (현재 ${current}자)`,
  AI_GENERATION_FAILED: 'AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  PROJECT_CREATE_FAILED: '프로젝트 등록에 실패했습니다. 다시 시도해주세요.',
  PROJECT_UPDATE_FAILED: '메뉴 수정에 실패했습니다. 다시 시도해주세요.',
} as const

// 성공 메시지 템플릿
export const FORM_SUCCESS_MESSAGES = {
  PROJECT_CREATED: '새 메뉴가 등록되었습니다!',
  PROJECT_UPDATED: '메뉴가 수정되었습니다!',
  IMAGE_UPLOADED: '이미지가 업로드되었습니다.',
  DRAFT_SAVED: '임시저장되었습니다.',
  WHISPER_SENT: '셰프에게 귓속말을 전달했어요!',
} as const

// Type exports
export type MilestoneEmoji = typeof MILESTONE_EMOJIS[number]['emoji']
