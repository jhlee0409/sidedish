'use client'

import { Heart, ArrowUpRight, FlaskConical } from 'lucide-react'
import Image from 'next/image'
import { ProjectResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'
import { PLATFORM_ICONS, getPlatformOption } from '@/lib/platform-config'

interface ProjectCardProps {
  project: ProjectResponse
  onClick: () => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const platformOption = getPlatformOption(project.platform || 'OTHER')

  // 대표 링크 가져오기 (links 배열 우선, 없으면 deprecated link 필드)
  const getPrimaryUrl = () => {
    if (project.links && project.links.length > 0) {
      const primaryLink = project.links.find(l => l.isPrimary) || project.links[0]
      return primaryLink.url
    }
    return project.link
  }

  const primaryUrl = getPrimaryUrl()

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-orange-50">
        <Image
          src={getProjectThumbnail(project)}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Platform badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-slate-600 text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <span className="text-slate-400 [&>svg]:w-3.5 [&>svg]:h-3.5">{PLATFORM_ICONS[project.platform || 'OTHER']}</span>
            <span>{platformOption.shortLabel}</span>
          </div>
          {project.isBeta && (
            <div className="bg-amber-500/95 backdrop-blur-sm px-2 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1 shadow-sm">
              <FlaskConical className="w-3 h-3" />
              <span>Beta</span>
            </div>
          )}
        </div>

        {/* Link button on hover */}
        {primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-50 hover:scale-110"
            title="바로가기"
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
