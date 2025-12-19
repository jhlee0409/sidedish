import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App
let adminDb: Firestore

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

export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      adminApp = initializeApp(getFirebaseAdminConfig())
    } else {
      adminApp = getApps()[0]
    }
  }
  return adminApp
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp())
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
  // 다이제스트 (도시락) 시스템
  DIGESTS: 'digests',
  DIGEST_SUBSCRIPTIONS: 'digest_subscriptions',
  DIGEST_LOGS: 'digest_logs',
  WEATHER_LOGS: 'weather_logs',
} as const

export { adminApp, adminDb }
