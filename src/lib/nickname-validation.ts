/**
 * 닉네임 검증 유틸리티
 *
 * 금지어 목록 및 닉네임 유효성 검사 기능을 제공합니다.
 * - 운영진 사칭 방지
 * - 기본 욕설/비속어 필터링
 * - 부적절한 닉네임 패턴 감지
 */

// ============ 금지어 목록 ============

/**
 * 운영진 사칭 방지용 금지어
 */
export const ADMIN_KEYWORDS = [
  // 한글
  '관리자', '운영자', '운영진', '관리진', '매니저',
  '어드민', '마스터', '사이드디쉬', '사이드디시',
  '셰프장', '총괄', '대표', '공식', '스태프',
  // 영문
  'admin', 'administrator', 'manager', 'master',
  'sidedish', 'official', 'staff', 'moderator', 'mod',
  'system', 'support', 'help', 'service',
] as const

/**
 * 기본 욕설/비속어 목록 (확장 가능)
 * 참고: 실제 서비스에서는 KISO KSS API 연동 권장
 */
export const PROFANITY_KEYWORDS = [
  // 기본 욕설 (일부만 포함, 실제로는 더 확장 필요)
  '시발', '씨발', '씨빨', '씨팔', 'ㅅㅂ', 'ㅆㅂ',
  '개새끼', '개새기', '개색기', '개세끼', 'ㄱㅅㄲ',
  '병신', '븅신', 'ㅂㅅ',
  '지랄', '좆', '씹', '엿먹',
  '느금마', '느금', '니미', '니엄마', '니애미',
  'fuck', 'shit', 'damn', 'bitch', 'asshole',
] as const

/**
 * 부적절한 패턴 (정규식)
 */
export const INAPPROPRIATE_PATTERNS = [
  // 숫자/특수문자 조합으로 욕설 표현 시도
  /시[0-9@#$%^&*]+발/i,
  /ㅅ[0-9@#$%^&*]+ㅂ/i,
  /개[0-9@#$%^&*]+끼/i,
  // 반복 문자 (스팸성)
  /(.)\1{4,}/,  // 같은 문자 5회 이상 반복
] as const

// ============ 검증 함수 ============

export interface NicknameValidationResult {
  valid: boolean
  error?: string
  errorType?: 'admin' | 'profanity' | 'pattern' | 'length' | 'format'
}

/**
 * 닉네임에 운영진 관련 키워드가 포함되어 있는지 확인
 */
export function containsAdminKeyword(nickname: string): boolean {
  const normalized = nickname.toLowerCase().replace(/\s+/g, '')
  return ADMIN_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  )
}

/**
 * 닉네임에 욕설/비속어가 포함되어 있는지 확인
 */
export function containsProfanity(nickname: string): boolean {
  const normalized = nickname.toLowerCase().replace(/\s+/g, '')
  return PROFANITY_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  )
}

/**
 * 닉네임이 부적절한 패턴과 일치하는지 확인
 */
export function matchesInappropriatePattern(nickname: string): boolean {
  return INAPPROPRIATE_PATTERNS.some(pattern => pattern.test(nickname))
}

/**
 * 닉네임 종합 검증
 */
export function validateNickname(nickname: string): NicknameValidationResult {
  // 빈 값 체크
  if (!nickname || nickname.trim().length === 0) {
    return {
      valid: false,
      error: '닉네임을 입력해주세요.',
      errorType: 'length',
    }
  }

  const trimmed = nickname.trim()

  // 길이 체크
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: '닉네임은 2자 이상이어야 합니다.',
      errorType: 'length',
    }
  }

  if (trimmed.length > 20) {
    return {
      valid: false,
      error: '닉네임은 20자 이하여야 합니다.',
      errorType: 'length',
    }
  }

  // 허용 문자 체크 (한글, 영문, 숫자, 밑줄, 공백)
  if (!/^[가-힣a-zA-Z0-9_\s]+$/.test(trimmed)) {
    return {
      valid: false,
      error: '닉네임에 특수문자는 사용할 수 없습니다.',
      errorType: 'format',
    }
  }

  // 운영진 사칭 체크
  if (containsAdminKeyword(trimmed)) {
    return {
      valid: false,
      error: '운영진으로 오인될 수 있는 닉네임은 사용할 수 없습니다.',
      errorType: 'admin',
    }
  }

  // 욕설/비속어 체크
  if (containsProfanity(trimmed)) {
    return {
      valid: false,
      error: '부적절한 단어가 포함된 닉네임은 사용할 수 없습니다.',
      errorType: 'profanity',
    }
  }

  // 부적절한 패턴 체크
  if (matchesInappropriatePattern(trimmed)) {
    return {
      valid: false,
      error: '부적절한 패턴의 닉네임은 사용할 수 없습니다.',
      errorType: 'pattern',
    }
  }

  return { valid: true }
}

/**
 * Zod 리파인용 검증 함수
 * 사용법: .refine(isValidNickname, { message: '...' })
 */
export function isValidNickname(nickname: string): boolean {
  return validateNickname(nickname).valid
}

/**
 * Zod superRefine용 검증 함수
 * 세부적인 에러 메시지 반환
 */
export function getNicknameError(nickname: string): string | undefined {
  const result = validateNickname(nickname)
  return result.error
}
