import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { DigestDoc, DigestSubscriptionDoc } from '@/lib/digest-types'
import { getMultiCityWeather, SupportedCity } from '@/services/weatherService'
import { generateDigestEmailData } from '@/services/digestGeneratorService'
import { sendBulkDigestEmails } from '@/services/emailService'
import { Timestamp } from 'firebase-admin/firestore'

/** Cron Job 인증을 위한 secret 검증 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('CRON_SECRET is not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * POST /api/cron/digest - Cron으로 호출되는 다이제스트 발송 엔드포인트
 *
 * 이 엔드포인트는 Vercel Cron Jobs에 의해 스케줄에 따라 호출됩니다.
 * 보안을 위해 CRON_SECRET 검증이 필요합니다.
 */
export async function POST(request: NextRequest) {
  // Cron secret 검증
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0')
    const currentTime = `${currentHour}:00`

    console.log(`[Cron] Running digest cron at ${now.toISOString()}, target time: ${currentTime}`)

    // 1. 현재 시간에 발송해야 하는 활성화된 다이제스트 조회
    const digestsSnapshot = await db
      .collection(COLLECTIONS.DIGESTS)
      .where('isActive', '==', true)
      .where('config.deliveryTime', '==', currentTime)
      .get()

    if (digestsSnapshot.empty) {
      console.log(`[Cron] No digests scheduled for ${currentTime}`)
      return NextResponse.json({
        message: 'No digests to send',
        time: currentTime,
      })
    }

    const results: Array<{
      digestId: string
      digestName: string
      subscriberCount: number
      sent: number
      failed: number
    }> = []

    // 2. 각 다이제스트에 대해 처리
    for (const digestDoc of digestsSnapshot.docs) {
      const digest = digestDoc.data() as DigestDoc
      console.log(`[Cron] Processing digest: ${digest.name} (${digest.id})`)

      try {
        // 3. 해당 다이제스트의 활성 구독자 조회
        const subscriptionsSnapshot = await db
          .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
          .where('digestId', '==', digest.id)
          .where('isActive', '==', true)
          .get()

        if (subscriptionsSnapshot.empty) {
          console.log(`[Cron] No subscribers for digest: ${digest.name}`)
          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: 0,
            sent: 0,
            failed: 0,
          })
          continue
        }

        const subscribers = subscriptionsSnapshot.docs.map(
          (doc) => doc.data() as DigestSubscriptionDoc
        )
        const subscriberEmails = subscribers.map((s) => s.userEmail)

        console.log(`[Cron] Found ${subscriberEmails.length} subscribers for ${digest.name}`)

        // 4. 날씨 데이터 조회 (날씨 다이제스트인 경우)
        if (digest.category === 'weather') {
          // 설정된 도시들의 날씨 데이터 조회
          const cities = (digest.config.cities as SupportedCity[]) || ['seoul']
          const weatherData = await getMultiCityWeather(cities)

          // 5. AI로 다이제스트 콘텐츠 생성
          const digestEmailData = await generateDigestEmailData(weatherData)

          // 6. 구독자들에게 이메일 발송
          const emailResult = await sendBulkDigestEmails(subscriberEmails, digestEmailData)

          console.log(
            `[Cron] Email sent for ${digest.name}: ${emailResult.success}/${emailResult.total}`
          )

          // 7. 발송 로그 기록
          await db.collection(COLLECTIONS.DIGEST_LOGS).add({
            digestId: digest.id,
            digestName: digest.name,
            sentAt: Timestamp.now(),
            subscriberCount: subscriberEmails.length,
            successCount: emailResult.success,
            failedCount: emailResult.failed,
            content: {
              subject: digestEmailData.subject,
              previewText: digestEmailData.previewText,
            },
          })

          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: subscriberEmails.length,
            sent: emailResult.success,
            failed: emailResult.failed,
          })
        } else {
          // 다른 카테고리의 다이제스트는 추후 구현
          console.log(`[Cron] Skipping non-weather digest: ${digest.name} (${digest.category})`)
          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: subscriberEmails.length,
            sent: 0,
            failed: 0,
          })
        }
      } catch (digestError) {
        console.error(`[Cron] Error processing digest ${digest.name}:`, digestError)
        results.push({
          digestId: digest.id,
          digestName: digest.name,
          subscriberCount: 0,
          sent: 0,
          failed: -1, // -1은 처리 자체 실패를 의미
        })
      }
    }

    console.log(`[Cron] Completed. Results:`, results)

    return NextResponse.json({
      message: 'Digest cron completed',
      time: currentTime,
      processedDigests: digestsSnapshot.size,
      results,
    })
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/digest - Cron 상태 확인용 엔드포인트
 */
export async function GET(request: NextRequest) {
  // Cron secret 검증
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()

    // 활성 다이제스트 수
    const activeDigestsCount = await db
      .collection(COLLECTIONS.DIGESTS)
      .where('isActive', '==', true)
      .count()
      .get()

    // 활성 구독 수
    const activeSubscriptionsCount = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('isActive', '==', true)
      .count()
      .get()

    // 최근 발송 로그
    const recentLogs = await db
      .collection(COLLECTIONS.DIGEST_LOGS)
      .orderBy('sentAt', 'desc')
      .limit(5)
      .get()

    return NextResponse.json({
      status: 'healthy',
      activeDigests: activeDigestsCount.data().count,
      activeSubscriptions: activeSubscriptionsCount.data().count,
      recentLogs: recentLogs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Cron] Health check error:', error)
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
