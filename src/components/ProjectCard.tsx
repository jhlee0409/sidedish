'use client'

import { Heart, ArrowUpRight, User, Smartphone, Globe, Gamepad2, Palette, Box } from 'lucide-react'
import Image from 'next/image'
import { ProjectPlatform } from '@/lib/types'
import { ProjectResponse } from '@/lib/db-types'
import { getProjectThumbnail } from '@/lib/og-utils'

interface ProjectCardProps {
  project: ProjectResponse
  onClick: () => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getPlatformIcon = (platform: ProjectPlatform) => {
    switch (platform) {
      case 'APP': return <Smartphone className="w-3.5 h-3.5" />
      case 'GAME': return <Gamepad2 className="w-3.5 h-3.5" />
      case 'DESIGN': return <Palette className="w-3.5 h-3.5" />
      case 'WEB': return <Globe className="w-3.5 h-3.5" />
      default: return <Box className="w-3.5 h-3.5" />
    }
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-[2rem] overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-100 flex flex-col h-full hover:-translate-y-1.5 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={getProjectThumbnail(project)}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Platform Badge (Floating) */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-slate-700 shadow-sm flex items-center gap-1.5 z-10 text-xs font-bold border border-white/50">
          {getPlatformIcon(project.platform || 'WEB')}
          <span className="tracking-tight">{project.platform || 'WEB'}</span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* External Link Button - Appear on hover */}
        <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-md p-2.5 rounded-full text-slate-900 shadow-lg hover:bg-orange-500 hover:text-white transition-colors block"
            title="바로 맛보기"
          >
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight group-hover:text-orange-600 transition-colors truncate">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                <User className="w-3 h-3" />
                {project.authorName}
              </span>
              <span>•</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2">
          {project.shortDescription}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 overflow-hidden mask-linear-fade">
            {project.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold rounded-lg whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 pl-2 bg-white flex-shrink-0">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-pink-500 transition-colors">
              <Heart className="w-4 h-4 fill-slate-100 group-hover:fill-pink-500 transition-colors" />
              {project.likes}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
