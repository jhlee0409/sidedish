/**
 * 페이지네이션 헬퍼 함수
 * Firestore 커서 기반 페이지네이션을 위한 공통 유틸리티
 */

import type { DocumentSnapshot, Query } from 'firebase-admin/firestore'

/**
 * 페이지네이션 결과 타입
 */
export interface PaginationResult<T> {
  /** 실제 데이터 배열 (limit만큼) */
  docs: T[]
  /** 다음 페이지가 있는지 여부 */
  hasMore: boolean
  /** 다음 페이지를 위한 커서 (마지막 문서의 ID) */
  nextCursor?: string
}

/**
 * Firestore 쿼리에 커서 기반 페이지네이션 적용
 *
 * @param query - Firestore 쿼리 (orderBy까지 적용된 상태)
 * @param options - 페이지네이션 옵션
 * @returns 페이지네이션 결과
 *
 * @example
 * ```ts
 * const cursor = searchParams.get('cursor')
 * const cursorDoc = cursor
 *   ? await db.collection('projects').doc(cursor).get()
 *   : null
 *
 * const query = db.collection('projects').orderBy('createdAt', 'desc')
 *
 * const result = await applyPagination(query, {
 *   limit: 20,
 *   cursorDoc,
 * })
 *
 * // result.docs: QueryDocumentSnapshot[]
 * // result.hasMore: boolean
 * // result.nextCursor: string | undefined
 * ```
 */
export async function applyPagination<T extends DocumentSnapshot>(
  query: Query<FirebaseFirestore.DocumentData>,
  options: {
    /** 페이지당 항목 수 */
    limit: number
    /** 커서 문서 스냅샷 (선택) - startAfter()에 사용 */
    cursorDoc?: DocumentSnapshot | null
    /** 문서에서 ID를 추출하는 함수 (기본: doc.id) */
    getDocId?: (doc: T) => string
  }
): Promise<PaginationResult<T>> {
  const { limit, cursorDoc, getDocId = (doc) => doc.id } = options

  // 커서가 있으면 해당 문서부터 시작
  let paginatedQuery = query
  if (cursorDoc && cursorDoc.exists) {
    paginatedQuery = query.startAfter(cursorDoc)
  }

  // limit + 1개 조회 (hasMore 판단용)
  const snapshot = await paginatedQuery.limit(limit + 1).get()

  // 실제 데이터는 limit개만
  const hasMore = snapshot.docs.length > limit
  const docs = snapshot.docs.slice(0, limit) as T[]

  // 다음 커서는 마지막 문서의 ID
  const nextCursor = hasMore && docs.length > 0
    ? getDocId(docs[docs.length - 1])
    : undefined

  return {
    docs,
    hasMore,
    nextCursor,
  }
}

/**
 * limit 값을 검증하고 안전한 범위로 제한
 *
 * @param requestedLimit - 요청된 limit 값
 * @param defaultLimit - 기본값 (요청이 없을 때)
 * @param maxLimit - 최대 허용값
 * @returns 검증된 limit 값
 *
 * @example
 * ```ts
 * const limit = validateLimit(
 *   searchParams.get('limit'),
 *   20,  // 기본값
 *   100  // 최대값
 * )
 * // "50" → 50
 * // "200" → 100 (최대값으로 제한)
 * // null → 20 (기본값)
 * // "abc" → 20 (기본값)
 * ```
 */
export function validatePaginationLimit(
  requestedLimit: string | null | undefined,
  defaultLimit: number = 20,
  maxLimit: number = 100
): number {
  if (!requestedLimit) return defaultLimit

  const parsed = parseInt(requestedLimit, 10)

  // NaN이거나 0 이하면 기본값
  if (isNaN(parsed) || parsed <= 0) return defaultLimit

  // maxLimit을 초과하면 제한
  return Math.min(parsed, maxLimit)
}
