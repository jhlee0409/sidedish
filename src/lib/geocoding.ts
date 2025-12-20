/**
 * Geocoding 서비스 - BigDataCloud API를 사용한 좌표→주소 변환
 * 클라이언트 사이드에서 API 키 없이 무료로 사용 가능
 */

import { UserLocation } from './digest-types'

/** BigDataCloud API 응답 타입 */
interface BigDataCloudResponse {
  latitude: number
  longitude: number
  localityLanguageRequested: string
  continent: string
  continentCode: string
  countryName: string
  countryCode: string
  principalSubdivision: string // 시/도 (예: "Seoul", "Gyeonggi-do")
  principalSubdivisionCode: string
  city: string // 시 (예: "Seoul")
  locality: string // 구/군 (예: "Gangnam-gu")
  postcode: string
  plusCode: string
  localityInfo: {
    administrative: Array<{
      name: string
      description: string
      order: number
      adminLevel: number
      isoCode?: string
      wikidataId?: string
      geonameId?: number
    }>
    informative: Array<{
      name: string
      description: string
      order: number
    }>
  }
}

/**
 * 좌표를 한글 주소로 변환
 * @param lat 위도
 * @param lon 경도
 * @returns UserLocation (위도, 경도, 주소)
 */
export async function reverseGeocode(lat: number, lon: number): Promise<UserLocation> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data: BigDataCloudResponse = await response.json()

    // 한글 주소 조합 (시/도 + 구/군)
    // localityInfo.administrative에서 한글 이름 추출
    const adminInfo = data.localityInfo?.administrative || []

    // adminLevel 순서대로 정렬 (낮은 숫자가 상위 행정구역)
    const sortedAdmin = [...adminInfo].sort((a, b) => a.adminLevel - b.adminLevel)

    // 시/도 찾기 (adminLevel 4 또는 최상위)
    const province = sortedAdmin.find(a => a.adminLevel === 4) || sortedAdmin[0]
    // 시/군/구 찾기 (adminLevel 6 또는 7)
    const district = sortedAdmin.find(a => a.adminLevel === 6 || a.adminLevel === 7)

    let address = ''

    if (province?.name) {
      // "Seoul" -> "서울", "Gyeonggi-do" -> "경기" 등 정리
      address = cleanProvinceName(province.name)
    }

    if (district?.name) {
      // "Gangnam-gu" -> "강남구" 등 정리
      const districtName = cleanDistrictName(district.name)
      if (districtName && !address.includes(districtName)) {
        address = address ? `${address} ${districtName}` : districtName
      }
    }

    // 주소가 비어있으면 기본값 사용
    if (!address) {
      address = data.city || data.locality || '위치 정보 없음'
    }

    return {
      lat,
      lon,
      address,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    // 오류 발생 시 기본값 반환
    return {
      lat,
      lon,
      address: '위치 정보를 가져올 수 없습니다',
    }
  }
}

/**
 * 시/도 이름 정리 (영문 → 한글 매핑 또는 정리)
 */
function cleanProvinceName(name: string): string {
  const provinceMap: Record<string, string> = {
    'Seoul': '서울',
    'Busan': '부산',
    'Daegu': '대구',
    'Incheon': '인천',
    'Gwangju': '광주',
    'Daejeon': '대전',
    'Ulsan': '울산',
    'Sejong': '세종',
    'Gyeonggi-do': '경기',
    'Gangwon-do': '강원',
    'Chungcheongbuk-do': '충북',
    'Chungcheongnam-do': '충남',
    'Jeollabuk-do': '전북',
    'Jellanam-do': '전남',
    'Gyeongsangbuk-do': '경북',
    'Gyeongsangnam-do': '경남',
    'Jeju-do': '제주',
    // 한글 이름이 이미 들어오는 경우
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '경기도': '경기',
    '강원도': '강원',
    '충청북도': '충북',
    '충청남도': '충남',
    '전라북도': '전북',
    '전라남도': '전남',
    '경상북도': '경북',
    '경상남도': '경남',
    '제주특별자치도': '제주',
  }

  return provinceMap[name] || name
}

/**
 * 구/군 이름 정리
 */
function cleanDistrictName(name: string): string {
  // "-gu", "-si", "-gun" 등 영문 접미사 제거하고 한글 형태로
  const cleaned = name
    .replace(/-gu$/i, '구')
    .replace(/-si$/i, '시')
    .replace(/-gun$/i, '군')
    .replace(/-dong$/i, '동')
    .replace(/-eup$/i, '읍')
    .replace(/-myeon$/i, '면')

  return cleaned
}

/**
 * 브라우저 Geolocation API를 사용하여 현재 위치 가져오기
 * @returns Promise<GeolocationPosition>
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation이 지원되지 않는 브라우저입니다.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('위치 정보 접근 권한이 거부되었습니다.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('위치 정보를 사용할 수 없습니다.'))
            break
          case error.TIMEOUT:
            reject(new Error('위치 정보 요청 시간이 초과되었습니다.'))
            break
          default:
            reject(new Error('알 수 없는 오류가 발생했습니다.'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분간 캐시
      }
    )
  })
}

/**
 * 현재 위치를 가져와서 주소로 변환
 * @returns Promise<UserLocation>
 */
export async function getCurrentLocation(): Promise<UserLocation> {
  const position = await getCurrentPosition()
  const { latitude, longitude } = position.coords
  return reverseGeocode(latitude, longitude)
}
