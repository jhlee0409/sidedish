import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { getUserRoleByUid, isAdmin } from '@/lib/admin-utils'
import { DigestDoc, DigestSubscriptionDoc, UserLocation } from '@/lib/digest-types'
import { getCompactWeather, compareWeather } from '@/services/weatherService'
import { generateDigestEmailData } from '@/services/digestGeneratorService'
import { sendDigestEmail } from '@/services/emailService'
import { getYesterdayWeatherLog } from '@/services/weatherLogService'

/** 테스트용 기본 위치 (서울) */
const DEFAULT_LOCATION: UserLocation = {
  lat: 37.5665,
  lon: 126.978,
  address: '서울',
}

/**
 * POST /api/digests/test-send - 테스트 이메일 즉시 발송
 * 관리자 전용
 *
 * Body:
 * - digestId: string - 발송할 다이제스트 ID
 * - email?: string - 받을 이메일 (미입력 시 현재 유저 이메일)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // 관리자 권한 체크 (UID로 조회)
    const userRole = await getUserRoleByUid(user.uid)
    console.log(`[Test Send] User UID: ${user.uid}, Role: ${userRole}`)

    if (!isAdmin(userRole)) {
      return forbiddenResponse('관리자만 테스트 발송을 할 수 있습니다.')
    }

    // 환경 변수 체크
    const missingEnvVars: string[] = []
    if (!process.env.OPENWEATHERMAP_API_KEY) missingEnvVars.push('OPENWEATHERMAP_API_KEY')
    if (!process.env.RESEND_API_KEY) missingEnvVars.push('RESEND_API_KEY')

    if (missingEnvVars.length > 0) {
      console.error(`[Test Send] Missing env vars: ${missingEnvVars.join(', ')}`)
      return NextResponse.json(
        { error: `환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}`, success: false },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { digestId, email } = body

    if (!digestId) {
      return NextResponse.json(
        { error: 'digestId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 발송할 이메일 결정
    const targetEmail = email || user.email
    if (!targetEmail) {
      return NextResponse.json(
        { error: '발송할 이메일 주소가 필요합니다.' },
        { status: 400 }
      )
    }

    // 다이제스트 조회
    const db = getAdminDb()
    const digestDoc = await db.collection(COLLECTIONS.DIGESTS).doc(digestId).get()

    if (!digestDoc.exists) {
      return NextResponse.json(
        { error: '다이제스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const digest = digestDoc.data() as DigestDoc

    // 날씨 다이제스트인 경우
    if (digest.category === 'weather') {
      // 현재 유저의 구독 정보 조회 (위치 및 어제 로그용)
      const subscriptionSnapshot = await db
        .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
        .where('digestId', '==', digestId)
        .where('userId', '==', user.uid)
        .where('isActive', '==', true)
        .limit(1)
        .get()

      let location = DEFAULT_LOCATION
      let yesterdayLog = null

      if (!subscriptionSnapshot.empty) {
        const subscription = subscriptionSnapshot.docs[0].data() as DigestSubscriptionDoc
        location = subscription.settings?.location || DEFAULT_LOCATION

        // 어제 날씨 로그 조회
        yesterdayLog = await getYesterdayWeatherLog(subscription.id)
        console.log(`[Test Send] Found subscription: ${subscription.id}, yesterday log: ${yesterdayLog ? 'exists' : 'none'}`)
      } else {
        console.log(`[Test Send] No subscription found for user, using default location`)
      }

      console.log(`[Test Send] Fetching weather for location: ${location.address}`)
      const todayWeather = await getCompactWeather(location)

      // 어제 데이터와 비교
      const comparison = compareWeather(todayWeather, yesterdayLog || undefined)

      console.log(`[Test Send] Generating email content (yesterday comparison: ${yesterdayLog ? 'yes' : 'no'})`)
      const digestEmailData = generateDigestEmailData(comparison)

      console.log(`[Test Send] Sending email to: ${targetEmail}`)
      const result = await sendDigestEmail(targetEmail, digestEmailData)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || '이메일 발송 실패', success: false },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `테스트 이메일이 ${targetEmail}로 발송되었습니다.`,
        messageId: result.messageId,
        subject: digestEmailData.subject,
      })
    }

    // 다른 카테고리는 아직 미구현
    return NextResponse.json(
      { error: `${digest.category} 카테고리는 아직 지원하지 않습니다.`, success: false },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Test Send] Error:', error)

    // 에러 상세 정보 추출
    let errorMessage = 'Unknown error'
    let errorStack = ''

    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack || ''
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
    }

    console.error('[Test Send] Error message:', errorMessage)
    console.error('[Test Send] Error stack:', errorStack)

    return NextResponse.json(
      {
        error: errorMessage,
        success: false
      },
      { status: 500 }
    )
  }
}
