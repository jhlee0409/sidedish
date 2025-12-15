import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App
let adminDb: Firestore

// Server-side Firebase Admin initialization
// For server-side operations in API routes
function getFirebaseAdminConfig() {
  // Check if service account credentials are available
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Private key needs to have newlines restored (Vercel escapes them)
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    }
  }

  // Fallback to project ID only (limited functionality, no token verification)
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
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
} as const

export { adminApp, adminDb }
