import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CreateUserInput, UserResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { convertTimestamps, convertUserAgreements } from '@/lib/firestore-utils'
import { handleApiError } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { ensureString, ensureBoolean } from '@/lib/type-guards'

// GET /api/users - List all users (limited use case)
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const users: UserResponse[] = snapshot.docs.map(doc => {
      const data = doc.data()
      const timestamps = convertTimestamps(data, ['createdAt'])

      return {
        id: doc.id,
        name: data.name,
        avatarUrl: data.avatarUrl || '',
        agreements: convertUserAgreements(data.agreements),
        isProfileComplete: data.isProfileComplete || false,
        createdAt: timestamps.createdAt,
      }
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    return handleApiError(error, 'GET /api/users', ERROR_MESSAGES.USERS_FETCH_FAILED)
  }
}

// POST /api/users - Create a new user (or get existing by device ID)
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body: CreateUserInput & { deviceId?: string } = await request.json()
    const now = Timestamp.now()

    // If deviceId is provided, check if user already exists
    if (body.deviceId) {
      const existingDoc = await db.collection(COLLECTIONS.USERS).doc(body.deviceId).get()
      if (existingDoc.exists) {
        const data = existingDoc.data()!
        const timestamps = convertTimestamps(data, ['createdAt'])

        return NextResponse.json({
          id: existingDoc.id,
          name: data.name,
          avatarUrl: data.avatarUrl || '',
          agreements: convertUserAgreements(data.agreements),
          isProfileComplete: data.isProfileComplete || false,
          createdAt: timestamps.createdAt,
        })
      }
    }

    const userId = body.deviceId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId)

    const userData: Record<string, unknown> = {
      id: userId,
      name: body.name || 'Anonymous Chef',
      avatarUrl: body.avatarUrl || '',
      isProfileComplete: body.isProfileComplete || false,
      createdAt: now,
      updatedAt: now,
    }

    // 약관 동의 정보 추가
    if (body.agreements) {
      userData.agreements = {
        termsOfService: body.agreements.termsOfService,
        privacyPolicy: body.agreements.privacyPolicy,
        marketing: body.agreements.marketing,
        agreedAt: now,
      }
    }

    await userRef.set(userData)

    const timestamps = convertTimestamps({ createdAt: now }, ['createdAt'])

    const response: UserResponse = {
      id: userId,
      name: ensureString(userData.name, 'Anonymous Chef'),
      avatarUrl: ensureString(userData.avatarUrl),
      agreements: body.agreements
        ? convertUserAgreements({
            ...body.agreements,
            agreedAt: now,
          })
        : undefined,
      isProfileComplete: ensureBoolean(userData.isProfileComplete),
      createdAt: timestamps.createdAt,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/users', ERROR_MESSAGES.USER_CREATE_FAILED)
  }
}
