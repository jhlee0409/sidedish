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

let app: FirebaseApp
let db: Firestore
let auth: Auth
let analytics: Analytics | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null

  if (!analytics) {
    const supported = await isSupported()
    if (supported) {
      analytics = getAnalytics(getFirebaseApp())
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
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

// Sign in with GitHub
export async function signInWithGithub(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth()
  const result = await signInWithPopup(auth, githubProvider)
  return result.user
}

// Sign out
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await firebaseSignOut(auth)
}

// Auth state observer
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

// Export types
export type { FirebaseUser }

// Export for direct usage
export { app, db, auth, analytics }
