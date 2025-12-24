'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ExternalLink, ChevronDown, Smartphone, Monitor, Gamepad2, Puzzle, Package, Globe, X } from 'lucide-react'
import { ProjectLink } from '@/lib/types'
import { getStoreConfig, StoreConfig } from '@/lib/store-config'

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

// 카테고리별 메타데이터
const CATEGORY_META: Record<StoreConfig['category'], {
  label: string
  shortLabel: string
  icon: React.ReactNode
  color: string
  chipColor: string
}> = {
  mobile: {
    label: '모바일 앱',
    shortLabel: '모바일',
    icon: <Smartphone className="w-4 h-4" />,
    color: 'text-green-600 bg-green-50',
    chipColor: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  desktop: {
    label: '데스크탑',
    shortLabel: '데스크탑',
    icon: <Monitor className="w-4 h-4" />,
    color: 'text-blue-600 bg-blue-50',
    chipColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  game: {
    label: '게임',
    shortLabel: '게임',
    icon: <Gamepad2 className="w-4 h-4" />,
    color: 'text-purple-600 bg-purple-50',
    chipColor: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  extension: {
    label: '확장 프로그램',
    shortLabel: '확장',
    icon: <Puzzle className="w-4 h-4" />,
    color: 'text-amber-600 bg-amber-50',
    chipColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  package: {
    label: '패키지',
    shortLabel: '패키지',
    icon: <Package className="w-4 h-4" />,
    color: 'text-red-600 bg-red-50',
    chipColor: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  general: {
    label: '일반',
    shortLabel: '웹',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-slate-600 bg-slate-50',
    chipColor: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  },
}

// 모든 링크를 리스트로 표시 (상세 페이지용) - Category Chips + Popover 패턴
interface LinkListProps {
  links: ProjectLink[]
  className?: string
  /** 칩+팝오버 UI를 사용할 최소 링크 수 (기본: 4) */
  chipThreshold?: number
  /** 컴팩트 모드 (사이드바용) */
  compact?: boolean
}

export const LinkList: React.FC<LinkListProps> = ({
  links,
  className = '',
  chipThreshold = 4,
  compact = false,
}) => {
  const [openCategory, setOpenCategory] = useState<StoreConfig['category'] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenCategory(null)
      }
    }

    if (openCategory) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openCategory])

  // ESC 키로 팝오버 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCategory(null)
      }
    }

    if (openCategory) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [openCategory])

  if (!links || links.length === 0) return null

  // 대표 링크 분리
  const primaryLink = links.find(link => link.isPrimary)
  const otherLinks = links.filter(link => !link.isPrimary)

  // 카테고리별로 그룹화
  const groupedLinks = otherLinks.reduce((acc, link) => {
    const config = getStoreConfig(link.storeType)
    const category = config.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(link)
    return acc
  }, {} as Record<StoreConfig['category'], ProjectLink[]>)

  // 카테고리 순서 정의
  const categoryOrder: StoreConfig['category'][] = ['mobile', 'desktop', 'game', 'extension', 'package', 'general']
  const sortedCategories = categoryOrder.filter(cat => groupedLinks[cat]?.length > 0)

  // 칩+팝오버 UI 사용 조건: 카테고리 3개 이상 OR 총 링크 4개 이상
  const useChipPattern = sortedCategories.length >= 3 || otherLinks.length >= chipThreshold

  return (
    <div ref={containerRef} className={`${compact ? 'space-y-2' : 'space-y-3'} ${className}`}>
      {/* 대표 링크 (항상 표시) */}
      {primaryLink && (
        <LinkItem link={primaryLink} isPrimary compact={compact} />
      )}

      {/* 링크가 적으면 단순 리스트 */}
      {!useChipPattern ? (
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          {otherLinks.map(link => (
            <LinkItem key={link.id} link={link} compact={compact} />
          ))}
        </div>
      ) : (
        /* 칩 + 팝오버 UI */
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          {sortedCategories.map(category => {
            const meta = CATEGORY_META[category]
            const categoryLinks = groupedLinks[category]
            const isOpen = openCategory === category

            return (
              <div key={category} className="relative">
                {/* 카테고리 칩 버튼 */}
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category)}
                  className={`
                    w-full flex items-center justify-between gap-2 rounded-xl border font-medium transition-all
                    ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}
                    ${isOpen
                      ? 'ring-2 ring-offset-1 ring-orange-400 ' + meta.chipColor
                      : meta.chipColor
                    }
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    {meta.icon}
                    <span>{meta.shortLabel}</span>
                    <span className="text-xs opacity-60">({categoryLinks.length})</span>
                  </div>
                  <ChevronDown className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 팝오버 */}
                {isOpen && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-white shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 ${compact ? 'rounded-lg' : 'rounded-xl'}`}>
                    {/* 팝오버 헤더 */}
                    <div className={`flex items-center justify-between border-b border-slate-100 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md ${meta.color} ${compact ? 'p-1' : 'p-1.5'}`}>
                          {meta.icon}
                        </span>
                        <span className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{meta.label}</span>
                      </div>
                      <button
                        onClick={() => setOpenCategory(null)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <X className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                      </button>
                    </div>

                    {/* 팝오버 링크 리스트 */}
                    <div className={`space-y-0.5 max-h-[240px] overflow-y-auto ${compact ? 'p-1.5' : 'p-2'}`}>
                      {categoryLinks.map(link => (
                        <PopoverLinkItem key={link.id} link={link} compact={compact} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 팝오버 내부 링크 아이템
interface PopoverLinkItemProps {
  link: ProjectLink
  compact?: boolean
}

const PopoverLinkItem: React.FC<PopoverLinkItemProps> = ({ link, compact = false }) => {
  const config = getStoreConfig(link.storeType)

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-lg transition-colors hover:bg-slate-50 ${compact ? 'p-2' : 'p-2.5'}`}
    >
      <span className={`rounded-md bg-slate-100 text-slate-600 flex-shrink-0 ${compact ? 'p-1' : 'p-1.5'}`}>
        {config.icon}
      </span>
      <span className={`flex-1 font-medium text-slate-700 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {link.label || config.label}
      </span>
      <ExternalLink className={`text-slate-400 flex-shrink-0 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
    </a>
  )
}

// 개별 링크 아이템 컴포넌트
interface LinkItemProps {
  link: ProjectLink
  isPrimary?: boolean
  compact?: boolean
}

const LinkItem: React.FC<LinkItemProps> = ({ link, isPrimary = false, compact = false }) => {
  const config = getStoreConfig(link.storeType)

  if (isPrimary) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all ${compact ? 'gap-2 p-2.5 rounded-lg' : 'gap-3 p-4 rounded-xl'}`}
      >
        <span className={`rounded-md bg-white/20 flex-shrink-0 ${compact ? 'p-1.5' : 'p-2'}`}>
          {config.icon}
        </span>
        <span className={`flex-1 font-semibold truncate ${compact ? 'text-sm' : ''}`}>
          {link.label || config.label}
        </span>
        <span className={`flex-shrink-0 font-medium bg-white/20 rounded-full ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
          대표
        </span>
        <ExternalLink className={`opacity-80 flex-shrink-0 ${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
      </a>
    )
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center transition-colors border border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'}`}
    >
      <span className={`rounded-md flex-shrink-0 bg-white text-slate-600 border border-slate-100 ${compact ? 'p-1' : 'p-2'}`}>
        {config.icon}
      </span>
      <span className={`flex-1 font-medium text-slate-700 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {link.label || config.label}
      </span>
      <ExternalLink className={`text-slate-400 flex-shrink-0 ${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
    </a>
  )
}

export default StoreBadges
