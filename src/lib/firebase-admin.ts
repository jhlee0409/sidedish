/**
 * Firebase Admin SDK - Server-Only Module
 *
 * 2025 베스트 프랙티스 적용:
 * - server-only import: 빌드 타임에 클라이언트 번들 유입 차단
 * - Singleton pattern: 핫 리로드 시 다중 인스턴스 방지
 * - 환경 변수 유연성: 여러 인증 방식 지원
 *
 * @see https://www.jamesshopland.com/blog/nextjs-firebase-admin-sdk/
 * @see https://firebase.google.com/docs/admin/setup
 */

import 'server-only'

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App | undefined
let adminDb: Firestore | undefined

// Server-side Firebase Admin initialization
// For server-side operations in API routes
function getFirebaseAdminConfig() {
  // Option 1: Full JSON service account key (recommended)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey)
      console.log('Firebase Admin: Using FIREBASE_SERVICE_ACCOUNT_KEY')
      return {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }
    } catch (e) {
      console.error('Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e)
    }
  }

  // Option 2: Individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (clientEmail && privateKey) {
    console.log('Firebase Admin: Using individual env vars')
    return {
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      projectId: projectId,
    }
  }

  console.warn('Firebase Admin: No credentials configured')
  return {
    projectId: projectId,
  }
}

/**
 * Singleton Admin App Initializer
 *
 * 패턴: Lazy initialization with memoization
 * - 첫 호출 시에만 초기화
 * - 이후 호출은 캐시된 인스턴스 반환
 * - 핫 리로드 시 기존 인스턴스 재사용
 */
export function getAdminApp(): App {
  if (!adminApp) {
    // Check if already initialized by Next.js hot reload
    const existingApps = getApps()
    if (existingApps.length > 0) {
      adminApp = existingApps[0]
      console.log('Firebase Admin: Reusing existing app instance')
    } else {
      adminApp = initializeApp(getFirebaseAdminConfig())
      console.log('Firebase Admin: New app instance created')
    }
  }
  return adminApp
}

/**
 * Singleton Firestore Instance
 *
 * 패턴: Lazy initialization
 * - Admin App 초기화 후 Firestore 인스턴스 생성
 * - 전역 변수로 캐싱하여 재사용
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp())
    console.log('Firebase Admin: Firestore instance created')
  }
  return adminDb
}

// Collection names as constants
export const COLLECTIONS = {
  PROJECTS: 'projects',
  USERS: 'users',
  COMMENTS: 'comments',
  LIKES: 'likes',
  WHISPERS: 'whispers',
  AI_USAGE: 'aiUsage',
  REACTIONS: 'reactions',
  PROJECT_UPDATES: 'projectUpdates', // 마일스톤 + 메이커로그
  // 다이제스트 (도시락) 시스템
  DIGESTS: 'digests',
  DIGEST_SUBSCRIPTIONS: 'digest_subscriptions',
  DIGEST_LOGS: 'digest_logs',
  WEATHER_LOGS: 'weather_logs',
} as const

export { adminApp, adminDb }
