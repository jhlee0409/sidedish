import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CreateUserInput, UserResponse, UserAgreementsResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'

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

      // 약관 동의 정보 변환
      let agreements: UserAgreementsResponse | undefined
      if (data.agreements) {
        agreements = {
          termsOfService: data.agreements.termsOfService || false,
          privacyPolicy: data.agreements.privacyPolicy || false,
          marketing: data.agreements.marketing || false,
          agreedAt: data.agreements.agreedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      }

      return {
        id: doc.id,
        name: data.name,
        avatarUrl: data.avatarUrl || '',
        agreements,
        isProfileComplete: data.isProfileComplete || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
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

        // 약관 동의 정보 변환
        let agreements: UserAgreementsResponse | undefined
        if (data.agreements) {
          agreements = {
            termsOfService: data.agreements.termsOfService || false,
            privacyPolicy: data.agreements.privacyPolicy || false,
            marketing: data.agreements.marketing || false,
            agreedAt: data.agreements.agreedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          }
        }

        return NextResponse.json({
          id: existingDoc.id,
          name: data.name,
          avatarUrl: data.avatarUrl || '',
          agreements,
          isProfileComplete: data.isProfileComplete || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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

    // 약관 동의 응답 변환
    let agreementsResponse: UserAgreementsResponse | undefined
    if (body.agreements) {
      agreementsResponse = {
        termsOfService: body.agreements.termsOfService,
        privacyPolicy: body.agreements.privacyPolicy,
        marketing: body.agreements.marketing,
        agreedAt: now.toDate().toISOString(),
      }
    }

    const response: UserResponse = {
      id: userId,
      name: userData.name as string,
      avatarUrl: userData.avatarUrl as string,
      agreements: agreementsResponse,
      isProfileComplete: userData.isProfileComplete as boolean,
      createdAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: '사용자 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
