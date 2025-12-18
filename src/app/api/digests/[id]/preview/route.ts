import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { DigestDoc, DigestPreviewResponse, SupportedCity } from '@/lib/digest-types'
import { getMultiCityWeather, generateWeatherRecommendations } from '@/services/weatherService'

interface RouteParams {
  params: Promise<{ id: string }>
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
        const cities = (digestData.config.cities as SupportedCity[]) || ['seoul']
        const weatherData = await getMultiCityWeather(cities)

        // 첫 번째 도시 기준으로 추천 정보 생성
        const firstCity = weatherData.cities[0]
        const recommendations = generateWeatherRecommendations(firstCity.today)

        const response: DigestPreviewResponse = {
          digestId: digestData.id,
          digestName: digestData.name,
          weather: {
            cities: weatherData.cities.map((city) => ({
              city: city.city,
              today: {
                city: city.today.city,
                cityKo: city.today.cityKo,
                current: {
                  temp: city.today.current.temp,
                  feelsLike: city.today.current.feelsLike,
                  tempMin: city.today.current.tempMin,
                  tempMax: city.today.current.tempMax,
                  humidity: city.today.current.humidity,
                  windSpeed: city.today.current.windSpeed,
                  visibility: city.today.current.visibility,
                  weather: city.today.current.weather,
                },
              },
            })),
          },
          recommendations,
          generatedAt: new Date().toISOString(),
        }

        return NextResponse.json(response)
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
