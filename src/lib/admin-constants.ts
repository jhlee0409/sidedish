/**
 * 관리자 권한 상수 (클라이언트에서도 사용 가능)
 */

/** 유저 역할 */
export type UserRole = 'user' | 'admin' | 'master'

/** 역할별 권한 레벨 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  master: 2,
}

/**
 * 관리자 이상 권한 확인
 */
export function isAdmin(role: UserRole | undefined): boolean {
  if (!role) return false
  return ROLE_LEVELS[role] >= ROLE_LEVELS.admin
}

/**
 * 마스터 권한 확인
 */
export function isMaster(role: UserRole | undefined): boolean {
  return role === 'master'
}

/**
 * 권한 레벨 비교
 */
export function hasPermission(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}
