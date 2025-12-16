import { Project, ReactionKey, Reactions } from './types'

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

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: '제주, 느리게 걷기',
    shortDescription: '제주도의 숨겨진 산책로와 감성 카페를 소개하는 사진 에세이',
    description: '유명 관광지보다는 현지인들만 아는 조용한 숲길과 바다 풍경을 담았습니다. 직접 찍은 필름 사진과 함께 그날의 감정을 기록한 디지털 에세이북입니다.',
    tags: ['여행', '에세이', '사진', '제주도'],
    imageUrl: 'https://picsum.photos/seed/jeju/600/400',
    author: 'FilmWalker',
    likes: 342,
    reactions: { fire: 12, clap: 45, love: 89 },
    comments: [
      { id: 'c1', author: 'Traveler_Kim', content: '사진 색감이 너무 좋아요! 어떤 카메라 쓰시나요?', createdAt: new Date('2024-01-16') },
      { id: 'c2', author: 'JejuLover', content: '다음 휴가 때 꼭 가봐야겠네요.', createdAt: new Date('2024-01-18') }
    ],
    link: 'https://brunch.co.kr/@example',
    platform: 'WEB',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'CodeSnippet',
    shortDescription: '자주 쓰는 코드 조각을 저장하고 공유하는 클라우드 클립보드',
    description: '개발자들이 자주 사용하는 유틸리티 함수나 보일러플레이트 코드를 클라우드에 저장하고, 팀원들과 손쉽게 공유할 수 있는 생산성 도구입니다.',
    tags: ['Tech', '생산성', '개발도구', 'React'],
    imageUrl: 'https://picsum.photos/seed/code/600/400',
    author: 'DevKim',
    likes: 124,
    reactions: { fire: 56, party: 23 },
    comments: [
      { id: 'c1', author: 'JuniorDev', content: '진짜 필요했던 기능이에요. VSCode 익스텐션도 있나요?', createdAt: new Date('2023-10-16') }
    ],
    link: 'https://github.com/example/codesnippet',
    githubUrl: 'https://github.com/example/codesnippet',
    platform: 'WEB',
    createdAt: new Date('2023-10-15')
  },
  {
    id: '3',
    title: 'Morning Routine Club',
    shortDescription: '미라클 모닝을 실천하는 사람들의 아침 인증 커뮤니티 앱',
    description: '매일 아침 6시, 자신의 아침 루틴을 사진으로 인증하고 서로 응원하는 커뮤니티입니다. 작심삼일을 넘어서 습관을 만들고 싶은 사람들을 위한 공간입니다.',
    tags: ['라이프스타일', '커뮤니티', '자기계발', '습관'],
    imageUrl: 'https://picsum.photos/seed/morning/600/400',
    author: 'Sunrise',
    likes: 512,
    reactions: { clap: 120, idea: 200 },
    comments: [],
    link: 'https://example.com/morning',
    platform: 'APP',
    createdAt: new Date('2023-11-02')
  },
  {
    id: '4',
    title: 'RetroLog 테마',
    shortDescription: '티스토리 및 벨로그를 위한 80년대 레트로 감성 스킨',
    description: '도트 그래픽과 8비트 감성을 담은 블로그 테마 스킨입니다. 설치만 하면 누구나 자신만의 레트로한 블로그를 꾸밀 수 있습니다.',
    tags: ['디자인', '테마', '레트로', '블로그'],
    imageUrl: 'https://picsum.photos/seed/retro/600/400',
    author: 'PixelArtist',
    likes: 215,
    reactions: { love: 40, party: 88 },
    comments: [],
    link: 'https://retrolog.io',
    githubUrl: 'https://github.com/pixel/retro',
    platform: 'DESIGN',
    createdAt: new Date('2023-09-20')
  },
  {
    id: '5',
    title: 'Space Dodger',
    shortDescription: '우주를 배경으로 펼쳐지는 하이퍼 캐주얼 슈팅 게임',
    description: 'HTML5 Canvas로 제작된 웹 게임입니다. 쏟아지는 운석을 피하고 최고 점수에 도전하세요. 모바일과 데스크탑 모두 지원합니다.',
    tags: ['게임', '웹게임', '킬링타임', 'Canvas'],
    imageUrl: 'https://picsum.photos/seed/game/600/400',
    author: 'GameDev_Lee',
    likes: 189,
    reactions: { fire: 67, idea: 90 },
    comments: [],
    link: 'https://itch.io/example',
    platform: 'GAME',
    createdAt: new Date('2023-12-01')
  },
  {
    id: '6',
    title: 'IndieMaker Map',
    shortDescription: '전 세계 디지털 노마드들의 위치와 프로젝트 지도',
    description: '디지털 노마드들이 현재 어디서 일하고 있는지 지도 위에 표시합니다. 주변에 있는 동료를 찾고 오프라인 밋업을 가질 수 있습니다.',
    tags: ['Tech', '지도', '노마드', '커뮤니티'],
    imageUrl: 'https://picsum.photos/seed/map/600/400',
    author: 'NomadLife',
    likes: 156,
    reactions: { clap: 33, party: 41 },
    comments: [],
    link: 'https://indiemap.world',
    platform: 'WEB',
    createdAt: new Date('2023-08-10')
  }
]
