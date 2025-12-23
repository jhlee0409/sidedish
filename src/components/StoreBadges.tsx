'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import { ProjectLink } from '@/lib/types'
import { getStoreConfig } from '@/lib/store-config'

interface StoreBadgesProps {
  links: ProjectLink[]
  /** 대표 링크만 강조 표시 */
  highlightPrimary?: boolean
  /** 최대 표시 개수 (나머지는 +N으로 표시) */
  maxDisplay?: number
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const StoreBadges: React.FC<StoreBadgesProps> = ({
  links,
  highlightPrimary = true,
  maxDisplay,
  size = 'md',
  className = '',
}) => {
  if (!links || links.length === 0) return null

  // 대표 링크를 맨 앞으로 정렬
  const sortedLinks = [...links].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  const displayLinks = maxDisplay ? sortedLinks.slice(0, maxDisplay) : sortedLinks
  const remainingCount = maxDisplay ? Math.max(0, links.length - maxDisplay) : 0

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayLinks.map(link => {
        const config = getStoreConfig(link.storeType)
        const isPrimary = highlightPrimary && link.isPrimary

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-flex items-center rounded-lg font-medium transition-all
              ${sizeClasses[size]}
              ${isPrimary
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
            title={link.label || config.label}
          >
            <span className={iconSizeClasses[size]}>
              {config.icon}
            </span>
            <span>{link.label || config.shortLabel}</span>
            <ExternalLink className={`${iconSizeClasses[size]} opacity-50`} />
          </a>
        )
      })}

      {remainingCount > 0 && (
        <span className={`
          inline-flex items-center rounded-lg font-medium bg-slate-100 text-slate-500
          ${sizeClasses[size]}
        `}>
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

// 단일 대표 링크 버튼 (CTA용)
interface PrimaryLinkButtonProps {
  links: ProjectLink[]
  /** 링크가 없을 때 대체 URL */
  fallbackUrl?: string
  /** 링크가 없을 때 대체 라벨 */
  fallbackLabel?: string
  className?: string
}

export const PrimaryLinkButton: React.FC<PrimaryLinkButtonProps> = ({
  links,
  fallbackUrl,
  fallbackLabel = '자세히 보기',
  className = '',
}) => {
  // 대표 링크 찾기
  const primaryLink = links?.find(link => link.isPrimary) || links?.[0]

  const url = primaryLink?.url || fallbackUrl
  if (!url) return null

  const config = primaryLink ? getStoreConfig(primaryLink.storeType) : null
  const label = primaryLink?.label || config?.label || fallbackLabel

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center justify-center gap-2 px-6 py-3
        bg-indigo-600 text-white font-semibold rounded-xl
        hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25
        ${className}
      `}
    >
      {config?.icon || <ExternalLink className="w-5 h-5" />}
      <span>{label}</span>
    </a>
  )
}

// 모든 링크를 리스트로 표시 (상세 페이지용)
interface LinkListProps {
  links: ProjectLink[]
  className?: string
}

export const LinkList: React.FC<LinkListProps> = ({
  links,
  className = '',
}) => {
  if (!links || links.length === 0) return null

  // 대표 링크를 맨 앞으로 정렬
  const sortedLinks = [...links].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedLinks.map(link => {
        const config = getStoreConfig(link.storeType)

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-colors
              ${link.isPrimary
                ? 'bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
              }
            `}
          >
            <span className={`
              p-2 rounded-lg
              ${link.isPrimary ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-600'}
            `}>
              {config.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">
                  {link.label || config.label}
                </span>
                {link.isPrimary && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    대표
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate">{link.url}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 flex-shrink-0" />
          </a>
        )
      })}
    </div>
  )
}

export default StoreBadges
