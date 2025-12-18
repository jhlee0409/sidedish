/**
 * 관리자 권한 유틸리티 (서버 전용)
 * 클라이언트에서는 admin-constants.ts를 사용하세요.
 */

import { getAdminDb, COLLECTIONS } from './firebase-admin'

// 클라이언트에서도 사용할 수 있는 타입과 상수를 re-export
export {
  type UserRole,
  ROLE_LEVELS,
  isAdmin,
  isMaster,
  hasPermission,
} from './admin-constants'

import { type UserRole } from './admin-constants'

/**
 * 이메일로 유저 역할 확인 (서버 전용)
 * Firestore users 컬렉션에서 role 필드 조회
 */
export async function getUserRole(email: string): Promise<UserRole> {
  if (!email) return 'user'

  // Firestore에서 역할 조회
  try {
    const db = getAdminDb()
    const userSnapshot = await db
      .collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data()
      if (userData.role && ['admin', 'master'].includes(userData.role)) {
        return userData.role as UserRole
      }
    }
  } catch (error) {
    console.error('Error checking user role:', error)
  }

  return 'user'
}

/**
 * UID로 유저 역할 확인 (서버 전용)
 */
export async function getUserRoleByUid(uid: string): Promise<UserRole> {
  try {
    const db = getAdminDb()
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get()

    if (userDoc.exists) {
      const userData = userDoc.data()

      // 저장된 역할 반환
      if (userData?.role && ['admin', 'master'].includes(userData.role)) {
        return userData.role as UserRole
      }
    }
  } catch (error) {
    console.error('Error checking user role by UID:', error)
  }

  return 'user'
}
