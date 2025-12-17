import { NextRequest, NextResponse } from 'next/server'
import { getAdminApp } from './firebase-admin'
import { getAuth, DecodedIdToken } from 'firebase-admin/auth'

export interface AuthenticatedUser {
  uid: string
  email: string | undefined
  name: string | undefined
  picture: string | undefined
}

// Verify Firebase ID token from request
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: No Bearer token')
      return null
    }

    const token = authHeader.split('Bearer ')[1]
    if (!token) {
      console.log('Auth failed: Empty token')
      return null
    }

    // Check if credentials are configured (support both methods)
    const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const hasIndividualCreds = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY

    if (!hasServiceAccountKey && !hasIndividualCreds) {
      console.error('Auth failed: Neither FIREBASE_SERVICE_ACCOUNT_KEY nor FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY configured')
      return null
    }

    const adminApp = getAdminApp()
    const auth = getAuth(adminApp)
    const decodedToken: DecodedIdToken = await auth.verifyIdToken(token)

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Middleware helper for protected routes
export async function requireAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await verifyAuth(request)

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  return handler(user, request)
}

// Unauthorized response helper
export function unauthorizedResponse(message = '인증이 필요합니다.'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 })
}

// Forbidden response helper
export function forbiddenResponse(message = '권한이 없습니다.'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 })
}
