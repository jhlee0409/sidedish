import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App
let adminDb: Firestore

// Server-side Firebase Admin initialization
// For server-side operations in API routes
function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  // Debug logging
  console.log('Firebase Admin Config Check:')
  console.log('- FIREBASE_PROJECT_ID:', projectId ? 'SET' : 'NOT SET')
  console.log('- FIREBASE_CLIENT_EMAIL:', clientEmail ? 'SET' : 'NOT SET')
  console.log('- FIREBASE_PRIVATE_KEY:', privateKey ? `SET (length: ${privateKey.length})` : 'NOT SET')

  // Check if service account credentials are available
  if (clientEmail && privateKey) {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n')
    console.log('- Private key starts with:', formattedPrivateKey.substring(0, 30))

    return {
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId: projectId,
    }
  }

  console.warn('Firebase Admin: Running without service account credentials (limited functionality)')
  // Fallback to project ID only (limited functionality, no token verification)
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
} as const

export { adminApp, adminDb }
