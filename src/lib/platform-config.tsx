/**
 * 플랫폼 관련 설정
 *
 * 프로젝트 플랫폼(WEB, APP, GAME 등)에 따른
 * 아이콘, 라벨, 링크 설정을 중앙에서 관리합니다.
 */

import { Smartphone, Globe, Gamepad2, Palette, Box, ExternalLink } from 'lucide-react'
import { ProjectPlatform } from './types'

// 플랫폼 옵션 (폼 선택용)
export const PLATFORM_OPTIONS: Array<{
  value: ProjectPlatform
  label: string
  icon: React.ReactNode
}> = [
  { value: 'WEB', label: '웹 서비스', icon: <Globe className="w-4 h-4" /> },
  { value: 'APP', label: '모바일 앱', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'GAME', label: '게임', icon: <Gamepad2 className="w-4 h-4" /> },
  { value: 'DESIGN', label: '디자인/작품', icon: <Palette className="w-4 h-4" /> },
  { value: 'OTHER', label: '기타', icon: <Box className="w-4 h-4" /> },
]

// 링크 입력 필드 설정 (플랫폼별)
export const LINK_CONFIG: Record<ProjectPlatform, {
  label: string
  placeholder: string
  desc: string
}> = {
  WEB: {
    label: '서비스 주소 (URL)',
    placeholder: 'https://myservice.com',
    desc: '유저들이 맛볼 수 있는 웹사이트 주소를 입력해주세요.',
  },
  APP: {
    label: '다운로드 링크 (App Store/Play Store)',
    placeholder: 'https://apps.apple.com/... 또는 https://play.google.com/...',
    desc: '앱을 설치할 수 있는 스토어 링크를 입력해주세요.',
  },
  GAME: {
    label: '플레이 / 다운로드 링크',
    placeholder: 'https://store.steampowered.com/... 또는 https://itch.io/...',
    desc: '게임을 바로 즐길 수 있는 링크를 입력해주세요.',
  },
  DESIGN: {
    label: '포트폴리오 주소',
    placeholder: 'https://behance.net/... 또는 https://notion.so/...',
    desc: '작품을 감상할 수 있는 페이지 링크를 입력해주세요.',
  },
  OTHER: {
    label: '프로젝트 링크',
    placeholder: '프로젝트를 확인할 수 있는 URL',
    desc: '프로젝트와 관련된 웹페이지 주소를 입력해주세요.',
  },
}

// CTA 버튼 설정 (상세 페이지용)
export const CTA_CONFIG: Record<ProjectPlatform, {
  icon: React.ReactNode
  label: string
}> = {
  WEB: { icon: <Globe className="w-5 h-5" />, label: '서비스 보기' },
  APP: { icon: <Smartphone className="w-5 h-5" />, label: '앱 다운로드' },
  GAME: { icon: <Gamepad2 className="w-5 h-5" />, label: '게임 플레이' },
  DESIGN: { icon: <Palette className="w-5 h-5" />, label: '작품 보기' },
  OTHER: { icon: <ExternalLink className="w-5 h-5" />, label: '자세히 보기' },
}

// 플랫폼 아이콘만 필요할 때 (카드 등에서 사용)
export const PLATFORM_ICONS: Record<ProjectPlatform, React.ReactNode> = {
  WEB: <Globe className="w-4 h-4" />,
  APP: <Smartphone className="w-4 h-4" />,
  GAME: <Gamepad2 className="w-4 h-4" />,
  DESIGN: <Palette className="w-4 h-4" />,
  OTHER: <Box className="w-4 h-4" />,
}

// 헬퍼 함수: 플랫폼별 링크 설정 가져오기
export function getLinkConfig(platform: ProjectPlatform) {
  return LINK_CONFIG[platform] || LINK_CONFIG.OTHER
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
