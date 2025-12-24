'use client'

import { Heart, ArrowUpRight, FlaskConical, Smartphone, Monitor, Gamepad2, Puzzle, Package, Globe } from 'lucide-react'
import Image from 'next/image'
import { ProjectResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'
import { PLATFORM_ICONS, getPlatformOption } from '@/lib/platform-config'
import { getStoreConfig, StoreConfig } from '@/lib/store-config'

// 카테고리별 뱃지 메타데이터 (2025 refined icons)
const CATEGORY_BADGE: Record<StoreConfig['category'], { icon: React.ReactNode; label: string }> = {
  mobile: { icon: <Smartphone className="w-3 h-3" />, label: '모바일' },
  desktop: { icon: <Monitor className="w-3 h-3" />, label: '데스크탑' },
  game: { icon: <Gamepad2 className="w-3 h-3" />, label: '게임' },
  extension: { icon: <Puzzle className="w-3 h-3" />, label: '확장' },
  package: { icon: <Package className="w-3 h-3" />, label: '패키지' },
  general: { icon: <Globe className="w-3 h-3" />, label: '웹' },
}

interface ProjectCardProps {
  project: ProjectResponse
  onClick: () => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  // 대표 링크 가져오기
  const primaryLink = project.links?.find(l => l.isPrimary) || project.links?.[0]

  // 뱃지 정보 결정: 대표 링크의 카테고리 기준, 없으면 플랫폼
  const getBadgeInfo = () => {
    if (primaryLink) {
      const storeConfig = getStoreConfig(primaryLink.storeType)
      const categoryBadge = CATEGORY_BADGE[storeConfig.category]
      return {
        icon: categoryBadge.icon,
        label: categoryBadge.label,
      }
    }
    // fallback: 플랫폼 기준
    const platformOption = getPlatformOption(project.platform || 'OTHER')
    return {
      icon: PLATFORM_ICONS[project.platform || 'OTHER'],
      label: platformOption.shortLabel,
    }
  }

  const badge = getBadgeInfo()

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <article
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${project.title} 프로젝트 보기`}
      className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_16px_32px_rgba(249,115,22,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={getProjectThumbnail(project)}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />

        {/* Top gradient overlay for badge visibility */}
        <div className="absolute inset-x-0 top-0 h-16 sm:h-20 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Platform/Store badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1">
          <div className="bg-white/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-slate-700 text-[10px] sm:text-[11px] font-semibold flex items-center gap-0.5 sm:gap-1 shadow-sm border border-white/50">
            <span className="text-slate-500">{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          {project.isBeta && (
            <div className="bg-amber-500 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 shadow-sm">
              <FlaskConical className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span>Beta</span>
            </div>
          )}
        </div>

        {/* Link button on hover - 상세페이지로 이동 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          aria-label={`${project.title} 상세보기`}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 backdrop-blur-md w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg shadow-sm border border-white/50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600" />
        </button>

        {/* Likes badge on image */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-white/90 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-semibold shadow-sm border border-white/50">
          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500 fill-rose-500" />
          <span className="text-slate-700">{project.likes}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-1 mb-1 sm:mb-1.5">
          {project.title}
        </h3>

        <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mb-2 sm:mb-3 line-clamp-2">
          {project.shortDescription}
        </p>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {project.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-medium rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
