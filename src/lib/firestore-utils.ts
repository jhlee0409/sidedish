/**
 * Firestore 유틸리티 함수
 * Firestore 데이터를 API 응답 형식으로 변환하는 공통 함수 모음
 */

import { Timestamp } from 'firebase-admin/firestore'
import type { UserAgreements } from '@/lib/db-types'

/**
 * 공용 응답 타입 (API 응답용)
 */
export interface UserAgreementsResponse {
  termsOfService: boolean
  privacyPolicy: boolean
  marketing: boolean
  agreedAt: string
}

export interface PromotionPostsResponse {
  x?: string | null
  linkedin?: string | null
  facebook?: string | null
  threads?: string | null
  promotedAt: string
}

/**
 * Firestore Timestamp를 ISO 문자열로 안전하게 변환
 * @param timestamp - Firestore Timestamp 또는 undefined
 * @returns ISO 8601 형식 문자열
 *
 * @example
 * ```ts
 * const iso = timestampToISO(data.createdAt)
 * // "2025-12-26T10:30:00.000Z"
 * ```
 */
export function timestampToISO(timestamp: Timestamp | undefined): string {
  return timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
}

/**
 * 여러 Timestamp 필드를 한번에 변환
 * @param data - 변환할 데이터 객체
 * @param fields - 변환할 필드 이름 배열
 * @returns 변환된 ISO 문자열 맵
 *
 * @example
 * ```ts
 * const timestamps = convertTimestamps(data, ['createdAt', 'updatedAt'])
 * // { createdAt: "2025-12-26T...", updatedAt: "2025-12-26T..." }
 *
 * const response = {
 *   ...data,
 *   ...timestamps,
 * }
 * ```
 */
export function convertTimestamps<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Record<string, string> {
  const result: Record<string, string> = {}
  fields.forEach((field) => {
    result[field as string] = timestampToISO(data[field] as Timestamp)
  })
  return result
}

/**
 * Firestore UserAgreements를 API 응답 형식으로 변환
 * @param agreements - Firestore에 저장된 약관 동의 정보
 * @returns API 응답용 UserAgreementsResponse 또는 undefined
 *
 * @example
 * ```ts
 * const agreementsResponse = convertUserAgreements(data.agreements)
 * // {
 * //   termsOfService: true,
 * //   privacyPolicy: true,
 * //   marketing: false,
 * //   agreedAt: "2025-12-26T10:30:00.000Z"
 * // }
 * ```
 */
export function convertUserAgreements(
  agreements: UserAgreements | undefined
): UserAgreementsResponse | undefined {
  if (!agreements) return undefined

  return {
    termsOfService: agreements.termsOfService || false,
    privacyPolicy: agreements.privacyPolicy || false,
    marketing: agreements.marketing || false,
    agreedAt: timestampToISO(agreements.agreedAt),
  }
}

/**
 * Firestore PromotionPosts를 API 응답 형식으로 변환
 * @param posts - Firestore에 저장된 소셜 미디어 게시물 정보
 * @returns API 응답용 PromotionPostsResponse 또는 undefined
 *
 * @example
 * ```ts
 * const promotionPosts = convertPromotionPosts(data.promotionPosts)
 * // {
 * //   x: "https://x.com/...",
 * //   linkedin: null,
 * //   facebook: "https://facebook.com/...",
 * //   threads: null,
 * //   promotedAt: "2025-12-26T10:30:00.000Z"
 * // }
 * ```
 */
export function convertPromotionPosts(
  posts: Record<string, unknown> | undefined
): PromotionPostsResponse | undefined {
  if (!posts) return undefined

  return {
    x: (posts.x as string | null) || null,
    linkedin: (posts.linkedin as string | null) || null,
    facebook: (posts.facebook as string | null) || null,
    threads: (posts.threads as string | null) || null,
    promotedAt: (posts.promotedAt as string) || new Date().toISOString(),
  }
}
