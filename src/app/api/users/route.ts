import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CreateUserInput, UserResponse } from '@/lib/db-types'
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
      return {
        id: doc.id,
        name: data.name,
        avatarUrl: data.avatarUrl || '',
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

    // If deviceId is provided, check if user already exists
    if (body.deviceId) {
      const existingDoc = await db.collection(COLLECTIONS.USERS).doc(body.deviceId).get()
      if (existingDoc.exists) {
        const data = existingDoc.data()!
        return NextResponse.json({
          id: existingDoc.id,
          name: data.name,
          avatarUrl: data.avatarUrl || '',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })
      }
    }

    const now = Timestamp.now()
    const userId = body.deviceId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId)

    const userData = {
      id: userId,
      name: body.name || 'Anonymous Chef',
      avatarUrl: body.avatarUrl || '',
      createdAt: now,
      updatedAt: now,
    }

    await userRef.set(userData)

    const response: UserResponse = {
      id: userId,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
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
