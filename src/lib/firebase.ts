import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let analytics: Analytics | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
    return null
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getDb(): Firestore | null {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!db) {
    db = getFirestore(firebaseApp)
  }
  return db
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!auth) {
    auth = getAuth(firebaseApp)
  }
  return auth
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null

  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null

  if (!analytics) {
    const supported = await isSupported()
    if (supported) {
      analytics = getAnalytics(firebaseApp)
    }
  }
  return analytics
}

// Auth providers
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

// Sign in with Google
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

// Sign in with GitHub
export async function signInWithGithub(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  const result = await signInWithPopup(auth, githubProvider)
  return result.user
}

// Sign out
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  await firebaseSignOut(auth)
}

// Auth state observer
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  const auth = getFirebaseAuth()
  if (!auth) {
    // If Firebase is not configured, immediately call with null and return a no-op unsubscribe
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// Export types
export type { FirebaseUser }

// Export for direct usage
export { app, db, auth, analytics }
