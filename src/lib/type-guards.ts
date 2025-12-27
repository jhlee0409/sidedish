/**
 * 타입 가드 및 안전한 타입 변환 유틸리티
 * 타입 단언(Type Assertion) 대신 런타임 검증을 통한 안전한 변환
 */

/**
 * 값이 문자열인지 검증하고 안전하게 변환
 * @param value - 검증할 값
 * @param fallback - 문자열이 아닐 경우 기본값
 * @returns 검증된 문자열
 *
 * @example
 * ```ts
 * const name = ensureString(userData.name, 'Anonymous')
 * // userData.name이 문자열이면 그 값, 아니면 'Anonymous'
 * ```
 */
export function ensureString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * 값이 불리언인지 검증하고 안전하게 변환
 * @param value - 검증할 값
 * @param fallback - 불리언이 아닐 경우 기본값
 * @returns 검증된 불리언
 *
 * @example
 * ```ts
 * const isComplete = ensureBoolean(userData.isProfileComplete, false)
 * // userData.isProfileComplete가 boolean이면 그 값, 아니면 false
 * ```
 */
export function ensureBoolean(value: unknown, fallback: boolean = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * 값이 숫자인지 검증하고 안전하게 변환
 * @param value - 검증할 값
 * @param fallback - 숫자가 아닐 경우 기본값
 * @returns 검증된 숫자
 *
 * @example
 * ```ts
 * const age = ensureNumber(userData.age, 0)
 * // userData.age가 number면 그 값, 아니면 0
 * ```
 */
export function ensureNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && !isNaN(value) ? value : fallback
}

/**
 * 값이 배열인지 검증하고 안전하게 변환
 * @param value - 검증할 값
 * @param fallback - 배열이 아닐 경우 기본값
 * @returns 검증된 배열
 *
 * @example
 * ```ts
 * const tags = ensureArray(data.tags, [])
 * // data.tags가 배열이면 그 값, 아니면 빈 배열
 * ```
 */
export function ensureArray<T = unknown>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback
}

/**
 * 값이 객체인지 검증하고 안전하게 변환
 * @param value - 검증할 값
 * @param fallback - 객체가 아닐 경우 기본값
 * @returns 검증된 객체
 *
 * @example
 * ```ts
 * const metadata = ensureObject(data.metadata, {})
 * // data.metadata가 객체면 그 값, 아니면 빈 객체
 * ```
 */
export function ensureObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown,
  fallback: T = {} as T
): T {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as T)
    : fallback
}

/**
 * 문자열 타입 가드
 * @param value - 검증할 값
 * @returns 문자열 여부
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 불리언 타입 가드
 * @param value - 검증할 값
 * @returns 불리언 여부
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 숫자 타입 가드
 * @param value - 검증할 값
 * @returns 숫자 여부 (NaN 제외)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 배열 타입 가드
 * @param value - 검증할 값
 * @returns 배열 여부
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 객체 타입 가드 (null 제외)
 * @param value - 검증할 값
 * @returns 객체 여부
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
