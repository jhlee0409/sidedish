import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { DigestDoc, UserLocation } from '@/lib/digest-types'
import { getCompactWeather, compareWeather, getOutfitRecommendation, needsUmbrella } from '@/services/weatherService'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** 미리보기용 기본 위치 (서울) */
const DEFAULT_LOCATION: UserLocation = {
  lat: 37.5665,
  lon: 126.978,
  address: '서울',
}

/**
 * GET /api/digests/[id]/preview - 다이제스트 미리보기
 * 인증 불필요 (공개 미리보기)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = getAdminDb()

    // ID 또는 slug로 다이제스트 조회
    let digestDoc = await db.collection(COLLECTIONS.DIGESTS).doc(id).get()

    // ID로 찾지 못하면 slug로 시도
    if (!digestDoc.exists) {
      const slugQuery = await db
        .collection(COLLECTIONS.DIGESTS)
        .where('slug', '==', id)
        .where('isActive', '==', true)
        .limit(1)
        .get()

      if (slugQuery.empty) {
        return NextResponse.json(
          { error: '다이제스트를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      digestDoc = slugQuery.docs[0]
    }

    const digestData = digestDoc.data() as DigestDoc

    if (!digestData.isActive) {
      return NextResponse.json(
        { error: '현재 이용할 수 없는 다이제스트입니다.' },
        { status: 400 }
      )
    }

    // 날씨 다이제스트인 경우 날씨 데이터 조회
    if (digestData.category === 'weather') {
      try {
        const todayWeather = await getCompactWeather(DEFAULT_LOCATION)
        const comparison = compareWeather(todayWeather, undefined)

        return NextResponse.json({
          digestId: digestData.id,
          digestName: digestData.name,
          weather: {
            location: todayWeather.location.address,
            feelsLike: todayWeather.feelsLike,
            temperature: todayWeather.temperature,
            tempMin: todayWeather.tempMin,
            tempMax: todayWeather.tempMax,
            precipitationProbability: todayWeather.precipitationProbability,
            airQuality: todayWeather.airQuality,
            weatherMain: todayWeather.weatherMain,
          },
          recommendations: {
            outfit: getOutfitRecommendation(todayWeather.feelsLike),
            umbrella: needsUmbrella(todayWeather),
            activities: [],
          },
          generatedAt: new Date().toISOString(),
        })
      } catch (weatherError) {
        console.error('Weather data fetch error:', weatherError)
        // 날씨 데이터 조회 실패 시 기본 응답
        return NextResponse.json({
          digestId: digestData.id,
          digestName: digestData.name,
          weather: null,
          recommendations: null,
          generatedAt: new Date().toISOString(),
          error: '날씨 데이터를 불러오는데 실패했습니다.',
        })
      }
    }

    // 다른 카테고리는 기본 응답
    return NextResponse.json({
      digestId: digestData.id,
      digestName: digestData.name,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching digest preview:', error)
    return NextResponse.json(
      { error: '미리보기를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
