import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App
let adminDb: Firestore

// Server-side Firebase Admin initialization
// For server-side operations in API routes
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
}

export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      // In production, use service account or default credentials
      // For development without service account, use project ID only
      adminApp = initializeApp(firebaseAdminConfig)
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
