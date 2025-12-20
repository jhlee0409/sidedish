/**
 * 날씨 로그 서비스 - 어제 날씨 비교를 위한 DB 저장/조회
 * 하루치만 저장하고 다음날 삭제
 */

import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WeatherLogDoc, UserLocation, AirQualityLevel } from '@/lib/digest-types'
import { CompactWeatherData } from './weatherService'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date()
  // KST 기준으로 날짜 계산 (UTC+9)
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  return kstDate.toISOString().split('T')[0]
}

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

/**
 * 오늘 날씨 데이터를 DB에 저장 (내일 비교용)
 */
export async function saveWeatherLog(
  subscriptionId: string,
  userId: string,
  weather: CompactWeatherData
): Promise<void> {
  const db = getAdminDb()
  const today = getTodayDateString()

  // 기존 로그가 있으면 업데이트, 없으면 생성
  const existingSnapshot = await db
    .collection(COLLECTIONS.WEATHER_LOGS)
    .where('subscriptionId', '==', subscriptionId)
    .where('date', '==', today)
    .limit(1)
    .get()

  const logData = {
    subscriptionId,
    userId,
    location: weather.location,
    date: today,
    feelsLike: weather.feelsLike,
    temperature: weather.temperature,
    precipitation: weather.precipitation,
    precipitationProbability: weather.precipitationProbability,
    airQuality: weather.airQuality,
    weatherMain: weather.weatherMain,
    createdAt: Timestamp.now(),
  }

  if (!existingSnapshot.empty) {
    // 기존 로그 업데이트
    await existingSnapshot.docs[0].ref.update(logData)
  } else {
    // 새 로그 생성
    const docRef = db.collection(COLLECTIONS.WEATHER_LOGS).doc()
    await docRef.set({
      id: docRef.id,
      ...logData,
    })
  }
}

/**
 * 어제 날씨 데이터 조회
 */
export async function getYesterdayWeatherLog(
  subscriptionId: string
): Promise<{
  feelsLike: number
  temperature: number
  precipitation: number
  precipitationProbability: number
  airQuality: AirQualityLevel
  weatherMain: string
} | null> {
  const db = getAdminDb()
  const yesterday = getYesterdayDateString()

  const snapshot = await db
    .collection(COLLECTIONS.WEATHER_LOGS)
    .where('subscriptionId', '==', subscriptionId)
    .where('date', '==', yesterday)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const data = snapshot.docs[0].data() as WeatherLogDoc
  return {
    feelsLike: data.feelsLike,
    temperature: data.temperature,
    precipitation: data.precipitation,
    precipitationProbability: data.precipitationProbability,
    airQuality: data.airQuality,
    weatherMain: data.weatherMain,
  }
}

/**
 * 오래된 날씨 로그 삭제 (어제 이전 데이터)
 */
export async function cleanupOldWeatherLogs(): Promise<number> {
  const db = getAdminDb()
  const yesterday = getYesterdayDateString()

  // 어제보다 오래된 로그 조회
  const oldLogsSnapshot = await db
    .collection(COLLECTIONS.WEATHER_LOGS)
    .where('date', '<', yesterday)
    .get()

  if (oldLogsSnapshot.empty) {
    return 0
  }

  // 배치로 삭제
  const batch = db.batch()
  oldLogsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  return oldLogsSnapshot.size
}

/**
 * 특정 구독의 모든 날씨 로그 삭제 (구독 해지 시)
 */
export async function deleteWeatherLogsForSubscription(subscriptionId: string): Promise<void> {
  const db = getAdminDb()

  const snapshot = await db
    .collection(COLLECTIONS.WEATHER_LOGS)
    .where('subscriptionId', '==', subscriptionId)
    .get()

  if (snapshot.empty) {
    return
  }

  const batch = db.batch()
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  await batch.commit()
}
