import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { getUserRole, isAdmin } from '@/lib/admin-utils'
import { DigestDoc, SupportedCity } from '@/lib/digest-types'
import { getMultiCityWeather } from '@/services/weatherService'
import { generateDigestEmailData } from '@/services/digestGeneratorService'
import { sendDigestEmail } from '@/services/emailService'

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

    // 관리자 권한 체크
    const userRole = await getUserRole(user.email || '')
    if (!isAdmin(userRole)) {
      return forbiddenResponse('관리자만 테스트 발송을 할 수 있습니다.')
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
      const cities = (digest.config.cities as SupportedCity[]) || ['seoul']

      console.log(`[Test Send] Fetching weather for cities: ${cities.join(', ')}`)
      const weatherData = await getMultiCityWeather(cities)

      console.log(`[Test Send] Generating digest content with AI`)
      const digestEmailData = await generateDigestEmailData(weatherData)

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
    return NextResponse.json(
      {
        error: '테스트 발송 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    )
  }
}
