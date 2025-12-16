import { ReactionKey, Reactions } from './types'

// 리액션 이모지 매핑 (DB에는 key로 저장, UI에서는 emoji로 표시)
export const REACTION_EMOJI_MAP: Record<ReactionKey, string> = {
  fire: '🔥',
  clap: '👏',
  party: '🎉',
  idea: '💡',
  love: '🥰',
}

// 역방향 매핑 (이모지 → key) - 기존 데이터 하위 호환성용
export const EMOJI_TO_KEY_MAP: Record<string, ReactionKey> = Object.fromEntries(
  Object.entries(REACTION_EMOJI_MAP).map(([key, emoji]) => [emoji, key])
) as Record<string, ReactionKey>

// 리액션 키 목록
export const REACTION_KEYS: readonly ReactionKey[] = ['fire', 'clap', 'party', 'idea', 'love'] as const

// Type guard to check if a string is a valid ReactionKey
export function isReactionKey(key: string): key is ReactionKey {
  return key in REACTION_EMOJI_MAP
}

// Input type for normalizeReactions - accepts both legacy Record<string, number> and Reactions
type ReactionsInput = Record<string, number> | Reactions

// 기존 이모지 키를 새 키로 변환하는 유틸리티
export function normalizeReactions(reactions: ReactionsInput): Reactions {
  const normalized: Reactions = {}

  for (const [key, count] of Object.entries(reactions)) {
    if (count === undefined) continue
    // 이미 새 키 형식이면 그대로 사용
    if (isReactionKey(key)) {
      normalized[key] = (normalized[key] || 0) + count
    }
    // 이모지 키면 새 키로 변환
    else if (EMOJI_TO_KEY_MAP[key]) {
      const newKey = EMOJI_TO_KEY_MAP[key]
      normalized[newKey] = (normalized[newKey] || 0) + count
    }
    // 알 수 없는 키는 무시
  }

  return normalized
}
