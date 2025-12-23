/**
 * 스토어/플랫폼 링크 설정
 *
 * 다양한 앱 스토어, 게임 스토어, 확장 마켓플레이스 등의
 * 메타데이터와 UI 설정을 중앙에서 관리합니다.
 */

import {
  Apple,
  Play,
  Monitor,
  Download,
  Gamepad2,
  Chrome,
  Globe,
  Github,
  Package,
  ExternalLink,
  Figma,
  FileText,
} from 'lucide-react'
import { StoreType, ProjectPlatform } from './types'

// 스토어 메타데이터
export interface StoreConfig {
  label: string           // 표시 라벨
  shortLabel: string      // 짧은 라벨 (배지용)
  icon: React.ReactNode   // 아이콘
  placeholder: string     // URL 입력 placeholder
  urlPattern?: RegExp     // URL 검증 패턴 (선택)
  urlHint: string         // URL 힌트
  category: 'mobile' | 'desktop' | 'game' | 'extension' | 'package' | 'general'
}

// 스토어별 설정
export const STORE_CONFIGS: Record<StoreType, StoreConfig> = {
  // 모바일 앱 스토어
  APP_STORE: {
    label: 'App Store (iOS)',
    shortLabel: 'App Store',
    icon: <Apple className="w-4 h-4" />,
    placeholder: 'https://apps.apple.com/app/...',
    urlPattern: /^https:\/\/(apps\.apple\.com|itunes\.apple\.com)\//,
    urlHint: 'apps.apple.com으로 시작하는 링크',
    category: 'mobile',
  },
  PLAY_STORE: {
    label: 'Google Play Store',
    shortLabel: 'Google Play',
    icon: <Play className="w-4 h-4" />,
    placeholder: 'https://play.google.com/store/apps/details?id=...',
    urlPattern: /^https:\/\/play\.google\.com\//,
    urlHint: 'play.google.com으로 시작하는 링크',
    category: 'mobile',
  },
  GALAXY_STORE: {
    label: 'Samsung Galaxy Store',
    shortLabel: 'Galaxy Store',
    icon: <Play className="w-4 h-4" />,
    placeholder: 'https://galaxystore.samsung.com/...',
    urlPattern: /^https:\/\/galaxystore\.samsung\.com\//,
    urlHint: 'galaxystore.samsung.com으로 시작하는 링크',
    category: 'mobile',
  },

  // 데스크탑 앱 스토어
  MAC_APP_STORE: {
    label: 'Mac App Store',
    shortLabel: 'Mac App Store',
    icon: <Apple className="w-4 h-4" />,
    placeholder: 'https://apps.apple.com/app/...',
    urlPattern: /^https:\/\/apps\.apple\.com\//,
    urlHint: 'apps.apple.com으로 시작하는 링크',
    category: 'desktop',
  },
  WINDOWS_STORE: {
    label: 'Microsoft Store',
    shortLabel: 'Microsoft Store',
    icon: <Monitor className="w-4 h-4" />,
    placeholder: 'https://apps.microsoft.com/...',
    urlPattern: /^https:\/\/(apps\.microsoft\.com|www\.microsoft\.com\/store)\//,
    urlHint: 'apps.microsoft.com으로 시작하는 링크',
    category: 'desktop',
  },
  DIRECT_DOWNLOAD: {
    label: '직접 다운로드',
    shortLabel: '다운로드',
    icon: <Download className="w-4 h-4" />,
    placeholder: 'https://example.com/download',
    urlHint: '다운로드 페이지 링크',
    category: 'desktop',
  },

  // 게임 스토어
  STEAM: {
    label: 'Steam',
    shortLabel: 'Steam',
    icon: <Gamepad2 className="w-4 h-4" />,
    placeholder: 'https://store.steampowered.com/app/...',
    urlPattern: /^https:\/\/store\.steampowered\.com\//,
    urlHint: 'store.steampowered.com으로 시작하는 링크',
    category: 'game',
  },
  EPIC_GAMES: {
    label: 'Epic Games Store',
    shortLabel: 'Epic Games',
    icon: <Gamepad2 className="w-4 h-4" />,
    placeholder: 'https://store.epicgames.com/...',
    urlPattern: /^https:\/\/(store\.epicgames\.com|www\.epicgames\.com\/store)\//,
    urlHint: 'store.epicgames.com으로 시작하는 링크',
    category: 'game',
  },
  ITCH_IO: {
    label: 'itch.io',
    shortLabel: 'itch.io',
    icon: <Gamepad2 className="w-4 h-4" />,
    placeholder: 'https://username.itch.io/game-name',
    urlPattern: /^https:\/\/[\w-]+\.itch\.io\//,
    urlHint: 'itch.io 프로필 또는 게임 링크',
    category: 'game',
  },
  GOG: {
    label: 'GOG.com',
    shortLabel: 'GOG',
    icon: <Gamepad2 className="w-4 h-4" />,
    placeholder: 'https://www.gog.com/game/...',
    urlPattern: /^https:\/\/(www\.)?gog\.com\//,
    urlHint: 'gog.com으로 시작하는 링크',
    category: 'game',
  },

  // 브라우저/에디터 확장
  CHROME_WEB_STORE: {
    label: 'Chrome Web Store',
    shortLabel: 'Chrome',
    icon: <Chrome className="w-4 h-4" />,
    placeholder: 'https://chrome.google.com/webstore/detail/...',
    urlPattern: /^https:\/\/chrome\.google\.com\/webstore\//,
    urlHint: 'chrome.google.com/webstore로 시작하는 링크',
    category: 'extension',
  },
  FIREFOX_ADDONS: {
    label: 'Firefox Add-ons',
    shortLabel: 'Firefox',
    icon: <Globe className="w-4 h-4" />,
    placeholder: 'https://addons.mozilla.org/...',
    urlPattern: /^https:\/\/addons\.mozilla\.org\//,
    urlHint: 'addons.mozilla.org로 시작하는 링크',
    category: 'extension',
  },
  EDGE_ADDONS: {
    label: 'Edge Add-ons',
    shortLabel: 'Edge',
    icon: <Globe className="w-4 h-4" />,
    placeholder: 'https://microsoftedge.microsoft.com/addons/...',
    urlPattern: /^https:\/\/microsoftedge\.microsoft\.com\/addons\//,
    urlHint: 'microsoftedge.microsoft.com/addons로 시작하는 링크',
    category: 'extension',
  },
  VS_CODE: {
    label: 'VS Code Marketplace',
    shortLabel: 'VS Code',
    icon: <Package className="w-4 h-4" />,
    placeholder: 'https://marketplace.visualstudio.com/items?itemName=...',
    urlPattern: /^https:\/\/marketplace\.visualstudio\.com\//,
    urlHint: 'marketplace.visualstudio.com으로 시작하는 링크',
    category: 'extension',
  },

  // 패키지 저장소
  NPM: {
    label: 'npm',
    shortLabel: 'npm',
    icon: <Package className="w-4 h-4" />,
    placeholder: 'https://www.npmjs.com/package/...',
    urlPattern: /^https:\/\/(www\.)?npmjs\.com\/package\//,
    urlHint: 'npmjs.com/package로 시작하는 링크',
    category: 'package',
  },
  PYPI: {
    label: 'PyPI',
    shortLabel: 'PyPI',
    icon: <Package className="w-4 h-4" />,
    placeholder: 'https://pypi.org/project/...',
    urlPattern: /^https:\/\/pypi\.org\/project\//,
    urlHint: 'pypi.org/project로 시작하는 링크',
    category: 'package',
  },

  // 일반 링크
  WEBSITE: {
    label: '웹사이트',
    shortLabel: '웹사이트',
    icon: <Globe className="w-4 h-4" />,
    placeholder: 'https://example.com',
    urlHint: '웹사이트 주소',
    category: 'general',
  },
  GITHUB: {
    label: 'GitHub',
    shortLabel: 'GitHub',
    icon: <Github className="w-4 h-4" />,
    placeholder: 'https://github.com/username/repo',
    urlPattern: /^https:\/\/github\.com\//,
    urlHint: 'github.com으로 시작하는 링크',
    category: 'general',
  },
  FIGMA: {
    label: 'Figma',
    shortLabel: 'Figma',
    icon: <Figma className="w-4 h-4" />,
    placeholder: 'https://www.figma.com/community/...',
    urlPattern: /^https:\/\/(www\.)?figma\.com\//,
    urlHint: 'figma.com으로 시작하는 링크',
    category: 'general',
  },
  NOTION: {
    label: 'Notion',
    shortLabel: 'Notion',
    icon: <FileText className="w-4 h-4" />,
    placeholder: 'https://notion.so/...',
    urlPattern: /^https:\/\/(www\.)?notion\.so\//,
    urlHint: 'notion.so로 시작하는 링크',
    category: 'general',
  },
  OTHER: {
    label: '기타',
    shortLabel: '링크',
    icon: <ExternalLink className="w-4 h-4" />,
    placeholder: 'https://...',
    urlHint: '기타 링크',
    category: 'general',
  },
}

// 플랫폼별 추천 스토어 타입
export const RECOMMENDED_STORES: Record<ProjectPlatform, StoreType[]> = {
  WEB: ['WEBSITE', 'GITHUB', 'NOTION'],
  APP: ['APP_STORE', 'PLAY_STORE', 'MAC_APP_STORE', 'WINDOWS_STORE', 'DIRECT_DOWNLOAD', 'GITHUB'],
  GAME: ['STEAM', 'EPIC_GAMES', 'ITCH_IO', 'GOG', 'APP_STORE', 'PLAY_STORE'],
  EXTENSION: ['CHROME_WEB_STORE', 'FIREFOX_ADDONS', 'EDGE_ADDONS', 'VS_CODE', 'GITHUB'],
  LIBRARY: ['NPM', 'PYPI', 'GITHUB'],
  DESIGN: ['FIGMA', 'NOTION', 'WEBSITE', 'GITHUB'],
  OTHER: ['WEBSITE', 'GITHUB', 'OTHER'],
}

// 스토어 타입 목록 (드롭다운용)
export const STORE_OPTIONS: Array<{
  value: StoreType
  label: string
  category: StoreConfig['category']
}> = Object.entries(STORE_CONFIGS).map(([value, config]) => ({
  value: value as StoreType,
  label: config.label,
  category: config.category,
}))

// 카테고리별 스토어 그룹
export const STORE_GROUPS: Array<{
  category: StoreConfig['category']
  label: string
  stores: StoreType[]
}> = [
  {
    category: 'mobile',
    label: '모바일 앱',
    stores: ['APP_STORE', 'PLAY_STORE', 'GALAXY_STORE'],
  },
  {
    category: 'desktop',
    label: '데스크탑 앱',
    stores: ['MAC_APP_STORE', 'WINDOWS_STORE', 'DIRECT_DOWNLOAD'],
  },
  {
    category: 'game',
    label: '게임',
    stores: ['STEAM', 'EPIC_GAMES', 'ITCH_IO', 'GOG'],
  },
  {
    category: 'extension',
    label: '확장 프로그램',
    stores: ['CHROME_WEB_STORE', 'FIREFOX_ADDONS', 'EDGE_ADDONS', 'VS_CODE'],
  },
  {
    category: 'package',
    label: '패키지',
    stores: ['NPM', 'PYPI'],
  },
  {
    category: 'general',
    label: '일반',
    stores: ['WEBSITE', 'GITHUB', 'FIGMA', 'NOTION', 'OTHER'],
  },
]

// 헬퍼 함수들

/**
 * 스토어 설정 가져오기
 */
export function getStoreConfig(storeType: StoreType): StoreConfig {
  return STORE_CONFIGS[storeType] || STORE_CONFIGS.OTHER
}

/**
 * 스토어 라벨 가져오기
 */
export function getStoreLabel(storeType: StoreType): string {
  return STORE_CONFIGS[storeType]?.label || '기타'
}

/**
 * 스토어 아이콘 가져오기
 */
export function getStoreIcon(storeType: StoreType): React.ReactNode {
  return STORE_CONFIGS[storeType]?.icon || STORE_CONFIGS.OTHER.icon
}

/**
 * URL에서 스토어 타입 추론
 */
export function inferStoreType(url: string): StoreType {
  const normalizedUrl = url.toLowerCase()

  // 각 스토어의 URL 패턴과 매칭
  for (const [storeType, config] of Object.entries(STORE_CONFIGS)) {
    if (config.urlPattern && config.urlPattern.test(normalizedUrl)) {
      return storeType as StoreType
    }
  }

  // 특정 도메인으로 추론
  if (normalizedUrl.includes('github.com')) return 'GITHUB'
  if (normalizedUrl.includes('figma.com')) return 'FIGMA'
  if (normalizedUrl.includes('notion.so')) return 'NOTION'
  if (normalizedUrl.includes('npmjs.com')) return 'NPM'
  if (normalizedUrl.includes('pypi.org')) return 'PYPI'

  return 'WEBSITE'
}

/**
 * 플랫폼에 맞는 추천 스토어 가져오기
 */
export function getRecommendedStores(platform: ProjectPlatform): StoreType[] {
  return RECOMMENDED_STORES[platform] || RECOMMENDED_STORES.OTHER
}

/**
 * URL 유효성 검사 (스토어 타입별)
 */
export function validateStoreUrl(storeType: StoreType, url: string): boolean {
  const config = STORE_CONFIGS[storeType]
  if (!config.urlPattern) return true // 패턴이 없으면 통과
  return config.urlPattern.test(url)
}

/**
 * 스토어 타입이 유효한지 확인
 */
export function isValidStoreType(value: string): value is StoreType {
  return value in STORE_CONFIGS
}
