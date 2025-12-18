/**
 * 관리자 권한 상수 (클라이언트에서도 사용 가능)
 */

/** 유저 역할 */
export type UserRole = 'user' | 'admin' | 'master'

/** 마스터 계정 이메일 목록 */
export const MASTER_EMAILS = [
  'relee6203@gmail.com',
] as const

/** 역할별 권한 레벨 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  master: 2,
}

/**
 * 관리자 이상 권한 확인
 */
export function isAdmin(role: UserRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS.admin
}

/**
 * 마스터 권한 확인
 */
export function isMaster(role: UserRole): boolean {
  return role === 'master'
}

/**
 * 권한 레벨 비교
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}

/**
 * 이메일로 마스터 여부 확인 (클라이언트용)
 */
export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return MASTER_EMAILS.includes(email as typeof MASTER_EMAILS[number])
}
