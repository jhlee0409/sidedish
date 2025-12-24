'use client'

import { Heart, ArrowUpRight, FlaskConical, Smartphone, Monitor, Gamepad2, Puzzle, Package, Globe } from 'lucide-react'
import Image from 'next/image'
import { ProjectResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'
import { PLATFORM_ICONS, getPlatformOption } from '@/lib/platform-config'
import { getStoreConfig, StoreConfig } from '@/lib/store-config'

// 카테고리별 뱃지 메타데이터
const CATEGORY_BADGE: Record<StoreConfig['category'], { icon: React.ReactNode; label: string; color: string }> = {
  mobile: { icon: <Smartphone className="w-3.5 h-3.5" />, label: '모바일', color: 'from-blue-500 to-cyan-500' },
  desktop: { icon: <Monitor className="w-3.5 h-3.5" />, label: '데스크탑', color: 'from-purple-500 to-pink-500' },
  game: { icon: <Gamepad2 className="w-3.5 h-3.5" />, label: '게임', color: 'from-green-500 to-emerald-500' },
  extension: { icon: <Puzzle className="w-3.5 h-3.5" />, label: '확장', color: 'from-amber-500 to-orange-500' },
  package: { icon: <Package className="w-3.5 h-3.5" />, label: '패키지', color: 'from-slate-500 to-slate-600' },
  general: { icon: <Globe className="w-3.5 h-3.5" />, label: '웹', color: 'from-indigo-500 to-purple-500' },
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
        color: categoryBadge.color,
      }
    }
    // fallback: 플랫폼 기준
    const platformOption = getPlatformOption(project.platform || 'OTHER')
    return {
      icon: PLATFORM_ICONS[project.platform || 'OTHER'],
      label: platformOption.shortLabel,
      color: 'from-slate-500 to-slate-600',
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
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
    >

      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={getProjectThumbnail(project)}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Platform/Store badge - Glassmorphism style */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`bg-gradient-to-r ${badge.color} backdrop-blur-md px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg`}>
            <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          {project.isBeta && (
            <div className="bg-amber-500 backdrop-blur-md px-2 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-lg">
              <FlaskConical className="w-3 h-3" />
              <span>Beta</span>
            </div>
          )}
        </div>

        {/* Link button - appears on hover */}
        {primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${project.title} 바로가기`}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm w-10 h-10 flex items-center justify-center rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <ArrowUpRight className="w-5 h-5 text-slate-700" />
          </a>
        )}

        {/* Like count badge - bottom right of image */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-lg">
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          <span className="text-slate-700">{project.likes}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors duration-200">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
          {project.shortDescription}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2">
          {project.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 2 && (
            <span className="text-xs text-slate-400 font-medium">
              +{project.tags.length - 2}
            </span>
          )}
        </div>
      </div>

    </article>
  )
}

export default ProjectCard
