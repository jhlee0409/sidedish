import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { DigestDoc, DigestSubscriptionDoc, UserLocation } from '@/lib/digest-types'
import { getCompactWeather, compareWeather } from '@/services/weatherService'
import { generateDigestEmailData, DigestEmailData } from '@/services/digestGeneratorService'
import { sendBulkDigestEmails } from '@/services/emailService'
import {
  saveWeatherLog,
  getYesterdayWeatherLog,
  cleanupOldWeatherLogs,
} from '@/services/weatherLogService'
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

/** 기본 위치 (서울) - 위치 설정 없는 구독자용 */
const DEFAULT_LOCATION: UserLocation = {
  lat: 37.5665,
  lon: 126.978,
  address: '서울',
}

/**
 * POST /api/cron/digest - Cron으로 호출되는 다이제스트 발송 엔드포인트
 *
 * 새로운 로직:
 * 1. 각 구독자의 위치 정보 가져오기
 * 2. 어제 날씨 로그 조회 (DB)
 * 3. 오늘 날씨 조회 (API)
 * 4. 비교 데이터 생성
 * 5. 이메일 발송
 * 6. 오늘 날씨 DB에 저장
 * 7. 오래된 로그 삭제
 */
export async function POST(request: NextRequest) {
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
        // 날씨 다이제스트인 경우에만 처리
        if (digest.category !== 'weather') {
          console.log(`[Cron] Skipping non-weather digest: ${digest.name}`)
          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: 0,
            sent: 0,
            failed: 0,
          })
          continue
        }

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

        console.log(`[Cron] Found ${subscribers.length} subscribers for ${digest.name}`)

        // 4. 각 구독자별로 날씨 데이터 조회 및 이메일 생성
        const subscriberEmails: string[] = []
        const digestDataList: DigestEmailData[] = []

        for (const subscriber of subscribers) {
          try {
            // 위치 정보 가져오기 (없으면 기본값 사용)
            const location = subscriber.settings?.location || DEFAULT_LOCATION

            // 어제 날씨 로그 조회
            const yesterdayLog = await getYesterdayWeatherLog(subscriber.id)

            // 오늘 날씨 조회
            const todayWeather = await getCompactWeather(location)

            // 날씨 비교
            const comparison = compareWeather(todayWeather, yesterdayLog || undefined)

            // 이메일 데이터 생성
            const emailData = generateDigestEmailData(comparison)

            subscriberEmails.push(subscriber.userEmail)
            digestDataList.push(emailData)

            // 오늘 날씨 DB에 저장 (내일 비교용)
            await saveWeatherLog(subscriber.id, subscriber.userId, todayWeather)

            console.log(`[Cron] Prepared email for ${subscriber.userEmail} (${location.address})`)
          } catch (subError) {
            console.error(
              `[Cron] Error preparing email for ${subscriber.userEmail}:`,
              subError
            )
          }
        }

        // 5. 이메일 발송
        if (subscriberEmails.length > 0) {
          const emailResult = await sendBulkDigestEmails(subscriberEmails, digestDataList)

          console.log(
            `[Cron] Email sent for ${digest.name}: ${emailResult.success}/${emailResult.total}`
          )

          // 6. 발송 로그 기록
          await db.collection(COLLECTIONS.DIGEST_LOGS).add({
            digestId: digest.id,
            digestName: digest.name,
            sentAt: Timestamp.now(),
            subscriberCount: subscriberEmails.length,
            successCount: emailResult.success,
            failedCount: emailResult.failed,
          })

          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: subscriberEmails.length,
            sent: emailResult.success,
            failed: emailResult.failed,
          })
        } else {
          results.push({
            digestId: digest.id,
            digestName: digest.name,
            subscriberCount: 0,
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
          failed: -1,
        })
      }
    }

    // 7. 오래된 날씨 로그 정리
    const cleanedLogs = await cleanupOldWeatherLogs()
    if (cleanedLogs > 0) {
      console.log(`[Cron] Cleaned up ${cleanedLogs} old weather logs`)
    }

    console.log(`[Cron] Completed. Results:`, results)

    return NextResponse.json({
      message: 'Digest cron completed',
      time: currentTime,
      processedDigests: digestsSnapshot.size,
      cleanedLogs,
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

    // 날씨 로그 수
    const weatherLogsCount = await db
      .collection(COLLECTIONS.WEATHER_LOGS)
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
      weatherLogs: weatherLogsCount.data().count,
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
