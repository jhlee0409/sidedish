'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  Globe,
  Smartphone,
  Monitor,
  Gamepad2,
  Puzzle,
  Package,
  Palette,
  Box,
  Utensils,
} from 'lucide-react'
import { ProjectPlatform } from '@/lib/types'

/**
 * 플랫폼별 그라데이션과 아이콘 설정
 */
const PLATFORM_STYLES: Record<ProjectPlatform, {
  gradient: string
  iconColor: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  WEB: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    iconColor: 'text-white/90',
    Icon: Globe,
  },
  MOBILE: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    iconColor: 'text-white/90',
    Icon: Smartphone,
  },
  DESKTOP: {
    gradient: 'from-slate-600 via-slate-700 to-slate-800',
    iconColor: 'text-white/90',
    Icon: Monitor,
  },
  GAME: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconColor: 'text-white/90',
    Icon: Gamepad2,
  },
  EXTENSION: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    iconColor: 'text-white/90',
    Icon: Puzzle,
  },
  LIBRARY: {
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    iconColor: 'text-white/90',
    Icon: Package,
  },
  DESIGN: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    iconColor: 'text-white/90',
    Icon: Palette,
  },
  OTHER: {
    gradient: 'from-slate-500 via-slate-600 to-slate-700',
    iconColor: 'text-white/90',
    Icon: Box,
  },
  // @deprecated - 하위 호환용
  APP: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    iconColor: 'text-white/90',
    Icon: Smartphone,
  },
}

interface ProjectThumbnailProps {
  imageUrl?: string
  title: string
  platform?: ProjectPlatform
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
}

/**
 * 프로젝트 썸네일 컴포넌트
 *
 * 이미지가 있으면 이미지를 표시하고,
 * 없으면 플랫폼별 그라데이션 + 아이콘 플레이스홀더를 표시합니다.
 */
export default function ProjectThumbnail({
  imageUrl,
  title,
  platform = 'OTHER',
  className = '',
  priority = false,
  fill = true,
  sizes,
}: ProjectThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !hasError

  if (hasValidImage) {
    return (
      <Image
        src={imageUrl}
        alt={title}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={`object-cover ${className}`}
        onError={() => setHasError(true)}
      />
    )
  }

  // Empty state: 플랫폼별 그라데이션 + 아이콘
  const style = PLATFORM_STYLES[platform] || PLATFORM_STYLES.OTHER
  const { gradient, iconColor, Icon } = style

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${className}`}
    >
      {/* 장식용 원형 요소 */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* 메인 아이콘 */}
      <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
        <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl sm:rounded-3xl">
          <Icon className={`w-8 h-8 sm:w-12 sm:h-12 ${iconColor}`} />
        </div>
        <div className="flex items-center gap-1.5 text-white/70">
          <Utensils className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">SideDish</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 카드용 컴팩트 썸네일 컴포넌트
 * 그라데이션 배경만 표시 (아이콘 없음)
 */
export function ProjectThumbnailCompact({
  imageUrl,
  title,
  platform = 'OTHER',
  className = '',
  priority = false,
  sizes,
}: Omit<ProjectThumbnailProps, 'fill'>) {
  const [hasError, setHasError] = useState(false)

  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !hasError

  if (hasValidImage) {
    return (
      <Image
        src={imageUrl}
        alt={title}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover ${className}`}
        onError={() => setHasError(true)}
      />
    )
  }

  const style = PLATFORM_STYLES[platform] || PLATFORM_STYLES.OTHER
  const { gradient, Icon } = style

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}
    >
      {/* 미니멀한 장식 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* 아이콘만 */}
      <div className="relative z-10 bg-white/20 backdrop-blur-sm p-2 sm:p-2.5 rounded-xl">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" />
      </div>
    </div>
  )
}
