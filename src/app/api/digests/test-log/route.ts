/**
 * 테스트용 어제 날씨 로그 생성 API
 * POST /api/digests/test-log
 *
 * 개발/테스트 환경에서만 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * 어제 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getYesterdayDateString(): string {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  kstDate.setDate(kstDate.getDate() - 1)
  return kstDate.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, userId, location, feelsLike, weatherMain } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const yesterday = getYesterdayDateString()

    // 어제 날짜로 테스트 로그 생성
    const logData = {
      subscriptionId,
      userId: userId || 'test-user',
      location: location || {
        lat: 37.5665,
        lon: 126.978,
        address: '서울',
      },
      date: yesterday,
      feelsLike: feelsLike ?? 5, // 기본값: 5도 (오늘보다 따뜻하게)
      temperature: (feelsLike ?? 5) + 2,
      precipitation: 0,
      precipitationProbability: 20,
      airQuality: 'good',
      weatherMain: weatherMain || 'Clear',
      createdAt: Timestamp.now(),
    }

    // 기존 로그 확인
    const existingSnapshot = await db
      .collection(COLLECTIONS.WEATHER_LOGS)
      .where('subscriptionId', '==', subscriptionId)
      .where('date', '==', yesterday)
      .limit(1)
      .get()

    let docId: string

    if (!existingSnapshot.empty) {
      // 기존 로그 업데이트
      docId = existingSnapshot.docs[0].id
      await existingSnapshot.docs[0].ref.update(logData)
    } else {
      // 새 로그 생성
      const docRef = db.collection(COLLECTIONS.WEATHER_LOGS).doc()
      docId = docRef.id
      await docRef.set({
        id: docId,
        ...logData,
      })
    }

    return NextResponse.json({
      success: true,
      message: `어제(${yesterday}) 날씨 로그가 생성되었습니다`,
      data: {
        id: docId,
        date: yesterday,
        ...logData,
      },
    })
  } catch (error) {
    console.error('Test log creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test log' },
      { status: 500 }
    )
  }
}

// 현재 로그 확인용 GET
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId query param is required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()

    const snapshot = await db
      .collection(COLLECTIONS.WEATHER_LOGS)
      .where('subscriptionId', '==', subscriptionId)
      .orderBy('date', 'desc')
      .limit(5)
      .get()

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    })
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    )
  }
}
