import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

/**
 * WebView/인앱 브라우저 감지
 * Google OAuth는 WebView에서 차단됨 (disallowed_useragent 오류)
 * 카카오톡, 네이버, Instagram, Facebook 등의 인앱 브라우저 감지
 */
export function isWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || ''

  // 일반적인 WebView 패턴
  const webViewPatterns = [
    /FBAN|FBAV/i, // Facebook App
    /Instagram/i, // Instagram
    /KAKAOTALK/i, // 카카오톡
    /NAVER/i, // 네이버 앱
    /Line/i, // LINE
    /wv\)/i, // Android WebView
    /WebView/i, // Generic WebView
  ]

  // iOS WebView 감지 (standalone 모드가 아닌 경우)
  const isIOSWebView =
    /iPhone|iPod|iPad/i.test(userAgent) &&
    !/Safari/i.test(userAgent) &&
    !/CriOS/i.test(userAgent) // Chrome iOS 제외

  // Android WebView 감지
  const isAndroidWebView =
    /Android/i.test(userAgent) && /wv\)|Version\/[\d.]+.*Chrome/i.test(userAgent)

  return (
    webViewPatterns.some((pattern) => pattern.test(userAgent)) ||
    isIOSWebView ||
    isAndroidWebView
  )
}

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
// WebView에서는 signInWithRedirect 사용, 일반 브라우저에서는 signInWithPopup 사용
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  try {
    if (isWebView()) {
      // WebView에서는 redirect 방식 사용 (페이지 이동 후 돌아옴)
      await signInWithRedirect(auth, googleProvider)
      return null // redirect 후에는 null 반환, onAuthChange에서 처리됨
    } else {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    }
  } catch (error) {
    await handleAuthError(auth, error as AuthError)
    throw error // TypeScript needs this, but handleAuthError always throws
  }
}

// Sign in with GitHub
// WebView에서는 signInWithRedirect 사용, 일반 브라우저에서는 signInWithPopup 사용
export async function signInWithGithub(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Please set the NEXT_PUBLIC_FIREBASE_* environment variables.')
  }
  try {
    if (isWebView()) {
      // WebView에서는 redirect 방식 사용 (페이지 이동 후 돌아옴)
      await signInWithRedirect(auth, githubProvider)
      return null // redirect 후에는 null 반환, onAuthChange에서 처리됨
    } else {
      const result = await signInWithPopup(auth, githubProvider)
      return result.user
    }
  } catch (error) {
    await handleAuthError(auth, error as AuthError)
    throw error // TypeScript needs this, but handleAuthError always throws
  }
}

// Handle redirect result after returning from OAuth provider
// 앱 초기화 시 호출하여 redirect 로그인 결과를 처리
export async function handleRedirectResult(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth()
  if (!auth) return null

  try {
    const result = await getRedirectResult(auth)
    return result?.user || null
  } catch (error) {
    // Redirect 결과 처리 중 에러 발생 시 로그만 남기고 null 반환
    console.error('Redirect result error:', error)
    return null
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
