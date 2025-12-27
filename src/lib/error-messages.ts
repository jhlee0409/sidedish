/**
 * API 에러 메시지 상수
 * 모든 API 라우트에서 사용하는 에러 메시지를 중앙 관리
 *
 * @remarks
 * - 메시지 변경 시 한 곳만 수정
 * - 일관된 사용자 경험 제공
 * - 향후 i18n 확장 용이
 */

export const ERROR_MESSAGES = {
  // ==================== 일반 에러 ====================
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다.',
  RATE_LIMIT_EXCEEDED: '요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',

  // ==================== 프로젝트 관련 ====================
  PROJECTS_FETCH_FAILED: '프로젝트 목록을 불러오는데 실패했습니다.',
  PROJECT_FETCH_FAILED: '프로젝트를 불러오는데 실패했습니다.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  PROJECT_CREATE_FAILED: '프로젝트 생성에 실패했습니다.',
  PROJECT_UPDATE_FAILED: '프로젝트 수정에 실패했습니다.',
  PROJECT_DELETE_FAILED: '프로젝트 삭제에 실패했습니다.',
  PROJECT_UNAUTHORIZED: '프로젝트 수정 권한이 없습니다.',

  // ==================== 사용자 관련 ====================
  USERS_FETCH_FAILED: '사용자 목록을 불러오는데 실패했습니다.',
  USER_FETCH_FAILED: '사용자 정보를 불러오는데 실패했습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_CREATE_FAILED: '사용자 생성에 실패했습니다.',
  USER_UPDATE_FAILED: '사용자 정보 수정에 실패했습니다.',
  USER_DELETE_FAILED: '사용자 삭제에 실패했습니다.',
  USER_WITHDRAWAL_FAILED: '회원 탈퇴에 실패했습니다.',

  // ==================== 댓글 관련 ====================
  COMMENTS_FETCH_FAILED: '댓글 목록을 불러오는데 실패했습니다.',
  COMMENT_FETCH_FAILED: '댓글을 불러오는데 실패했습니다.',
  COMMENT_NOT_FOUND: '댓글을 찾을 수 없습니다.',
  COMMENT_CREATE_FAILED: '댓글 작성에 실패했습니다.',
  COMMENT_UPDATE_FAILED: '댓글 수정에 실패했습니다.',
  COMMENT_DELETE_FAILED: '댓글 삭제에 실패했습니다.',
  COMMENT_UNAUTHORIZED: '댓글 수정 권한이 없습니다.',

  // ==================== 위스퍼 (피드백) 관련 ====================
  WHISPERS_FETCH_FAILED: '위스퍼 목록을 불러오는데 실패했습니다.',
  WHISPER_FETCH_FAILED: '위스퍼를 불러오는데 실패했습니다.',
  WHISPER_NOT_FOUND: '위스퍼를 찾을 수 없습니다.',
  WHISPER_CREATE_FAILED: '위스퍼 전송에 실패했습니다.',
  WHISPER_UPDATE_FAILED: '위스퍼 수정에 실패했습니다.',
  WHISPER_DELETE_FAILED: '위스퍼 삭제에 실패했습니다.',
  WHISPER_UNAUTHORIZED: '위스퍼 접근 권한이 없습니다.',

  // ==================== 좋아요 관련 ====================
  LIKES_FETCH_FAILED: '좋아요 목록을 불러오는데 실패했습니다.',
  LIKE_FETCH_FAILED: '좋아요 정보를 불러오는데 실패했습니다.',
  LIKE_CHECK_FAILED: '좋아요 상태 확인에 실패했습니다.',
  LIKE_TOGGLE_FAILED: '좋아요 처리에 실패했습니다.',
  LIKE_CREATE_FAILED: '좋아요 추가에 실패했습니다.',
  LIKE_DELETE_FAILED: '좋아요 취소에 실패했습니다.',

  // ==================== 리액션 관련 ====================
  REACTIONS_FETCH_FAILED: '리액션 목록을 불러오는데 실패했습니다.',
  REACTION_TOGGLE_FAILED: '리액션 처리에 실패했습니다.',
  REACTION_CREATE_FAILED: '리액션 추가에 실패했습니다.',
  REACTION_DELETE_FAILED: '리액션 취소에 실패했습니다.',

  // ==================== 프로젝트 업데이트 (마일스톤/개발일지) 관련 ====================
  UPDATES_FETCH_FAILED: '업데이트 목록을 불러오는데 실패했습니다.',
  UPDATE_FETCH_FAILED: '업데이트를 불러오는데 실패했습니다.',
  UPDATE_NOT_FOUND: '업데이트를 찾을 수 없습니다.',
  UPDATE_CREATE_FAILED: '업데이트 작성에 실패했습니다.',
  UPDATE_UPDATE_FAILED: '업데이트 수정에 실패했습니다.',
  UPDATE_DELETE_FAILED: '업데이트 삭제에 실패했습니다.',
  UPDATE_UNAUTHORIZED: '업데이트 수정 권한이 없습니다.',

  // ==================== 업로드 관련 ====================
  UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  UPLOAD_NO_FILE: '업로드할 파일이 없습니다.',
  UPLOAD_INVALID_TYPE: '지원하지 않는 파일 형식입니다.',
  UPLOAD_SIZE_EXCEEDED: '파일 크기가 너무 큽니다.',
  UPLOAD_VALIDATION_FAILED: '파일 검증에 실패했습니다.',

  // ==================== AI 관련 ====================
  AI_GENERATE_FAILED: 'AI 콘텐츠 생성에 실패했습니다.',
  AI_USAGE_FETCH_FAILED: 'AI 사용량 정보를 불러오는데 실패했습니다.',
  AI_RATE_LIMIT: 'AI 생성 횟수를 초과했습니다.',
  AI_INVALID_INPUT: '입력 내용이 너무 짧습니다.',
  AI_SERVICE_UNAVAILABLE: 'AI 서비스를 일시적으로 사용할 수 없습니다.',

  // ==================== 프로모션 (소셜 미디어) 관련 ====================
  PROMOTION_FAILED: '소셜 미디어 홍보에 실패했습니다.',
  PROMOTION_RATE_LIMIT: '홍보 횟수 제한을 초과했습니다.',
  PROMOTION_COOLDOWN: '이 프로젝트는 최근에 홍보되었습니다. 잠시 후 다시 시도해주세요.',
  PROMOTION_SERVICE_UNAVAILABLE: '소셜 미디어 서비스를 일시적으로 사용할 수 없습니다.',

  // ==================== 통계 관련 ====================
  STATS_FETCH_FAILED: '통계를 불러오는데 실패했습니다.',

  // ==================== 다이제스트 (Deprecated) 관련 ====================
  DIGESTS_FETCH_FAILED: '다이제스트 목록을 불러오는데 실패했습니다.',
  DIGEST_FETCH_FAILED: '다이제스트를 불러오는데 실패했습니다.',
  DIGEST_NOT_FOUND: '다이제스트를 찾을 수 없습니다.',
  DIGEST_CREATE_FAILED: '다이제스트 생성에 실패했습니다.',
  DIGEST_UPDATE_FAILED: '다이제스트 수정에 실패했습니다.',
  DIGEST_DELETE_FAILED: '다이제스트 삭제에 실패했습니다.',

  // ==================== 관리자 관련 ====================
  ADMIN_ONLY: '관리자만 접근할 수 있습니다.',
  ADMIN_SEED_FAILED: '시드 데이터 생성에 실패했습니다.',
} as const

/**
 * 에러 메시지 키 타입
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES

/**
 * 에러 메시지를 안전하게 가져오는 헬퍼 함수
 * @param key - 에러 메시지 키
 * @returns 에러 메시지 문자열
 *
 * @example
 * ```ts
 * import { getErrorMessage } from '@/lib/error-messages'
 *
 * const message = getErrorMessage('PROJECT_NOT_FOUND')
 * // "프로젝트를 찾을 수 없습니다."
 * ```
 */
export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key]
}
