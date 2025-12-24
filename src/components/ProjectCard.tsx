'use client'

import { Heart, ArrowUpRight, FlaskConical, Smartphone, Monitor, Gamepad2, Puzzle, Package, Globe } from 'lucide-react'
import Image from 'next/image'
import { ProjectResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'
import { PLATFORM_ICONS, getPlatformOption } from '@/lib/platform-config'
import { getStoreConfig, StoreConfig } from '@/lib/store-config'

// 카테고리별 뱃지 메타데이터
const CATEGORY_BADGE: Record<StoreConfig['category'], { icon: React.ReactNode; label: string }> = {
  mobile: { icon: <Smartphone className="w-3.5 h-3.5" />, label: '모바일' },
  desktop: { icon: <Monitor className="w-3.5 h-3.5" />, label: '데스크탑' },
  game: { icon: <Gamepad2 className="w-3.5 h-3.5" />, label: '게임' },
  extension: { icon: <Puzzle className="w-3.5 h-3.5" />, label: '확장' },
  package: { icon: <Package className="w-3.5 h-3.5" />, label: '패키지' },
  general: { icon: <Globe className="w-3.5 h-3.5" />, label: '웹' },
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

  // 대표 URL
  const primaryUrl = primaryLink?.url || project.link

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
      className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-orange-50">
        <Image
          src={getProjectThumbnail(project)}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Platform/Store badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-slate-600 text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <span className="text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5">{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          {project.isBeta && (
            <div className="bg-amber-500/95 backdrop-blur-sm px-2 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1 shadow-sm">
              <FlaskConical className="w-3 h-3" />
              <span>Beta</span>
            </div>
          )}
        </div>

        {/* Link button on hover - 44px touch target */}
        {primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${project.title} 바로가기`}
            className="absolute top-2 right-2 bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all hover:bg-orange-50 hover:scale-110 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-slate-600" />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-semibold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors line-clamp-1">
            {project.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0 group-hover:text-orange-400 transition-colors">
            <Heart className="w-3.5 h-3.5" />
            <span>{project.likes}</span>
          </div>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
          {project.shortDescription}
        </p>

        <div className="flex items-center gap-1.5">
          {project.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full"
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
