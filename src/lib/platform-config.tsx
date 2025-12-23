/**
 * 플랫폼 관련 설정
 *
 * 프로젝트 플랫폼(WEB, APP, GAME 등)에 따른
 * 아이콘, 라벨, 링크 설정을 중앙에서 관리합니다.
 */

import {
  Smartphone,
  Globe,
  Gamepad2,
  Palette,
  Box,
  ExternalLink,
  Puzzle,
  Package,
} from 'lucide-react'
import { ProjectPlatform } from './types'
import { StoreType } from './db-types'

// 플랫폼 옵션 (폼 선택용)
export const PLATFORM_OPTIONS: Array<{
  value: ProjectPlatform
  label: string
  shortLabel: string
  icon: React.ReactNode
  description: string
  suggestedStores: StoreType[]
}> = [
  {
    value: 'WEB',
    label: '웹 서비스',
    shortLabel: '웹',
    icon: <Globe className="w-5 h-5" />,
    description: '웹사이트, SaaS, 웹앱',
    suggestedStores: ['WEBSITE', 'GITHUB'],
  },
  {
    value: 'APP',
    label: '앱',
    shortLabel: '앱',
    icon: <Smartphone className="w-5 h-5" />,
    description: '모바일/데스크탑 앱',
    suggestedStores: ['APP_STORE', 'PLAY_STORE', 'MAC_APP_STORE', 'WINDOWS_STORE', 'DIRECT_DOWNLOAD'],
  },
  {
    value: 'GAME',
    label: '게임',
    shortLabel: '게임',
    icon: <Gamepad2 className="w-5 h-5" />,
    description: 'PC/모바일/콘솔 게임',
    suggestedStores: ['STEAM', 'EPIC_GAMES', 'ITCH_IO', 'GOG', 'APP_STORE', 'PLAY_STORE'],
  },
  {
    value: 'EXTENSION',
    label: '확장 프로그램',
    shortLabel: '확장',
    icon: <Puzzle className="w-5 h-5" />,
    description: '브라우저/에디터 확장',
    suggestedStores: ['CHROME_WEB_STORE', 'FIREFOX_ADDONS', 'EDGE_ADDONS', 'VS_CODE'],
  },
  {
    value: 'LIBRARY',
    label: '라이브러리',
    shortLabel: '라이브러리',
    icon: <Package className="w-5 h-5" />,
    description: '패키지, CLI, 오픈소스',
    suggestedStores: ['NPM', 'PYPI', 'GITHUB'],
  },
  {
    value: 'DESIGN',
    label: '디자인/템플릿',
    shortLabel: '디자인',
    icon: <Palette className="w-5 h-5" />,
    description: 'UI 킷, 템플릿, 리소스',
    suggestedStores: ['FIGMA', 'NOTION', 'WEBSITE', 'GITHUB'],
  },
  {
    value: 'OTHER',
    label: '기타',
    shortLabel: '기타',
    icon: <Box className="w-5 h-5" />,
    description: '그 외 모든 프로젝트',
    suggestedStores: ['WEBSITE', 'GITHUB', 'OTHER'],
  },
]

// CTA 버튼 설정 (상세 페이지용)
export const CTA_CONFIG: Record<ProjectPlatform, {
  icon: React.ReactNode
  label: string
}> = {
  WEB: { icon: <Globe className="w-5 h-5" />, label: '바로가기' },
  APP: { icon: <Smartphone className="w-5 h-5" />, label: '설치하기' },
  GAME: { icon: <Gamepad2 className="w-5 h-5" />, label: '플레이' },
  EXTENSION: { icon: <Puzzle className="w-5 h-5" />, label: '추가하기' },
  LIBRARY: { icon: <Package className="w-5 h-5" />, label: '시작하기' },
  DESIGN: { icon: <Palette className="w-5 h-5" />, label: '살펴보기' },
  OTHER: { icon: <ExternalLink className="w-5 h-5" />, label: '바로가기' },
}

// 플랫폼 아이콘만 필요할 때 (카드 등에서 사용)
export const PLATFORM_ICONS: Record<ProjectPlatform, React.ReactNode> = {
  WEB: <Globe className="w-4 h-4" />,
  APP: <Smartphone className="w-4 h-4" />,
  GAME: <Gamepad2 className="w-4 h-4" />,
  EXTENSION: <Puzzle className="w-4 h-4" />,
  LIBRARY: <Package className="w-4 h-4" />,
  DESIGN: <Palette className="w-4 h-4" />,
  OTHER: <Box className="w-4 h-4" />,
}

// 헬퍼 함수: 플랫폼별 CTA 가져오기
export function getCTAConfig(platform: ProjectPlatform) {
  return CTA_CONFIG[platform] || CTA_CONFIG.OTHER
}

// 헬퍼 함수: 플랫폼 아이콘 가져오기
export function getPlatformIcon(platform: ProjectPlatform): React.ReactNode {
  return PLATFORM_ICONS[platform] || PLATFORM_ICONS.OTHER
}

// 헬퍼 함수: 플랫폼 라벨 가져오기
export function getPlatformLabel(platform: ProjectPlatform): string {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform)
  return option?.label || '기타'
}

// 헬퍼 함수: 플랫폼 옵션 가져오기
export function getPlatformOption(platform: ProjectPlatform) {
  return PLATFORM_OPTIONS.find(opt => opt.value === platform) || PLATFORM_OPTIONS.find(opt => opt.value === 'OTHER')!
}

// 헬퍼 함수: 플랫폼별 추천 스토어 가져오기
export function getSuggestedStores(platform: ProjectPlatform): StoreType[] {
  const option = PLATFORM_OPTIONS.find(opt => opt.value === platform)
  return option?.suggestedStores || ['WEBSITE', 'OTHER']
}
