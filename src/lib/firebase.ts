import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  User as FirebaseUser,
  AuthError,
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

// Auth providers
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

// Helper to get provider display name
function getProviderDisplayName(providerId: string): string {
  if (providerId === 'google.com') return 'Google'
  if (providerId === 'github.com') return 'GitHub'
  return providerId
}

// User-friendly error messages for common Firebase auth errors
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/account-exists-with-different-credential':
      return '이미 다른 소셜 계정으로 가입된 이메일입니다.'
    case 'auth/popup-closed-by-user':
      return '로그인 창이 닫혔습니다. 다시 시도해주세요.'
    case 'auth/cancelled-popup-request':
      return '로그인이 취소되었습니다.'
    case 'auth/popup-blocked':
      return '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
    case 'auth/too-many-requests':
      return '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
    case 'auth/user-disabled':
      return '비활성화된 계정입니다. 관리자에게 문의해주세요.'
    default:
      return '로그인에 실패했습니다. 다시 시도해주세요.'
  }
}

// Handle auth errors with user-friendly messages
async function handleAuthError(auth: Auth, error: AuthError): Promise<never> {
  // Handle account-exists-with-different-credential specially
  if (error.code === 'auth/account-exists-with-different-credential') {
    const email = (error.customData?.email as string) || ''
    if (email) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email)
        if (methods.length > 0) {
          const existingProvider = getProviderDisplayName(methods[0])
          throw new Error(`이미 ${existingProvider} 계정으로 가입된 이메일입니다. ${existingProvider}로 로그인해주세요.`)
        }
      } catch (fetchError) {
        // If it's our custom error, re-throw it
        if (fetchError instanceof Error && fetchError.message.includes('이미')) {
          throw fetchError
        }
        // Otherwise fall through to generic message
      }
    }
  }

  // Throw user-friendly error message
  throw new Error(getAuthErrorMessage(error))
}

// Sign in with Google
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    await handleAuthError(auth, error as AuthError)
    throw error // TypeScript needs this, but handleAuthError always throws
  }
}

// Sign in with GitHub
export async function signInWithGithub(): Promise<FirebaseUser> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  try {
    const result = await signInWithPopup(auth, githubProvider)
    return result.user
  } catch (error) {
    await handleAuthError(auth, error as AuthError)
    throw error // TypeScript needs this, but handleAuthError always throws
  }
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
