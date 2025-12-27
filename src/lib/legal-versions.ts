/**
 * 약관 버전 관리 시스템
 *
 * 모든 약관의 버전 정보를 중앙에서 관리합니다.
 * 약관 변경 시 이 파일만 수정하면 모든 페이지에 자동 반영됩니다.
 *
 * 법적 요구사항:
 * - 일반 변경: 시행 7일 전 공지
 * - 중요 변경 (수집/이용/제3자 제공 등): 시행 30일 전 공지 + 별도 동의
 * - 이전 버전 확인 가능하도록 변경 이력 공개 필수
 *
 * @see https://www.privacy.go.kr - 개인정보 포털
 * @see 개인정보보호법 제30조, 시행령 제31조
 */

// ==================== Types ====================

export interface LegalVersion {
  /** 버전 번호 (예: "1.0", "1.1", "2.0") */
  version: string
  /** 시행일 (YYYY.MM.DD 형식) */
  effectiveDate: string
  /** 변경 내용 요약 */
  summary: string
  /** 변경 유형: minor(일반), major(중요-30일 사전고지 필요) */
  changeType: 'initial' | 'minor' | 'major'
  /** 상세 변경 내역 (신구대비용) */
  changes?: {
    section: string
    before?: string
    after: string
  }[]
}

export interface LegalDocument {
  /** 문서 제목 */
  title: string
  /** 문서 타입 */
  type: 'terms' | 'privacy'
  /** 현재 버전 (versions 배열의 첫 번째 항목) */
  currentVersion: LegalVersion
  /** 모든 버전 히스토리 (최신순) */
  versions: LegalVersion[]
}

// ==================== Version History ====================

/**
 * 서비스 이용약관 버전 히스토리
 * - 새 버전 추가 시 배열 맨 앞에 추가
 * - changeType이 'major'면 30일 전 공지 필요
 */
export const TERMS_VERSIONS: LegalVersion[] = [
  {
    version: '1.0',
    effectiveDate: '2025.12.26',
    summary: '서비스 이용약관 최초 제정',
    changeType: 'initial',
  },
]

/**
 * 개인정보 처리방침 버전 히스토리
 * - 새 버전 추가 시 배열 맨 앞에 추가
 * - changeType이 'major'면 30일 전 공지 필요
 */
export const PRIVACY_VERSIONS: LegalVersion[] = [
  {
    version: '1.0',
    effectiveDate: '2025.01.01',
    summary: '개인정보 처리방침 최초 제정',
    changeType: 'initial',
  },
]

// ==================== Document Objects ====================

export const TERMS_DOCUMENT: LegalDocument = {
  title: '서비스 이용약관',
  type: 'terms',
  currentVersion: TERMS_VERSIONS[0],
  versions: TERMS_VERSIONS,
}

export const PRIVACY_DOCUMENT: LegalDocument = {
  title: '개인정보 처리방침',
  type: 'privacy',
  currentVersion: PRIVACY_VERSIONS[0],
  versions: PRIVACY_VERSIONS,
}

// ==================== Helper Functions ====================

/**
 * 버전 정보를 포맷팅된 문자열로 반환
 * @example "v1.0 (2025.01.01 시행)"
 */
export function formatVersionInfo(version: LegalVersion): string {
  return `v${version.version} (${version.effectiveDate} 시행)`
}

/**
 * 짧은 버전 정보 반환
 * @example "v1.0"
 */
export function formatVersionShort(version: LegalVersion): string {
  return `v${version.version}`
}

/**
 * 시행일만 반환
 * @example "2025.01.01"
 */
export function getEffectiveDate(version: LegalVersion): string {
  return version.effectiveDate
}

/**
 * 변경 유형에 따른 사전 고지 기간 반환
 */
export function getNoticeRequirement(changeType: LegalVersion['changeType']): string {
  switch (changeType) {
    case 'initial':
      return '최초 제정'
    case 'minor':
      return '7일 전 공지'
    case 'major':
      return '30일 전 공지 (중요 변경)'
    default:
      return ''
  }
}

/**
 * 변경 유형에 따른 배지 스타일 반환
 */
export function getChangeTypeBadgeStyle(changeType: LegalVersion['changeType']): string {
  switch (changeType) {
    case 'initial':
      return 'bg-blue-100 text-blue-700'
    case 'minor':
      return 'bg-slate-100 text-slate-700'
    case 'major':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

/**
 * 변경 유형 라벨 반환
 */
export function getChangeTypeLabel(changeType: LegalVersion['changeType']): string {
  switch (changeType) {
    case 'initial':
      return '최초 제정'
    case 'minor':
      return '일반 변경'
    case 'major':
      return '중요 변경'
    default:
      return ''
  }
}
