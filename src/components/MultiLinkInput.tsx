'use client'

import React, { useState, useCallback } from 'react'
import { Plus, Trash2, Star, ExternalLink, ChevronDown } from 'lucide-react'
import { ProjectLink, StoreType, MAX_PROJECT_LINKS } from '@/lib/types'
import { STORE_CONFIGS, STORE_GROUPS, getStoreConfig, inferStoreType } from '@/lib/store-config'

interface MultiLinkInputProps {
  links: ProjectLink[]
  onChange: (links: ProjectLink[]) => void
  maxLinks?: number
  className?: string
}

// 간단한 ID 생성 함수
function generateId(): string {
  return `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const MultiLinkInput: React.FC<MultiLinkInputProps> = ({
  links,
  onChange,
  maxLinks = MAX_PROJECT_LINKS,
  className = '',
}) => {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null)

  // 새 링크 추가
  const handleAddLink = useCallback(() => {
    if (links.length >= maxLinks) return

    const newLink: ProjectLink = {
      id: generateId(),
      storeType: 'WEBSITE',
      url: '',
      isPrimary: links.length === 0, // 첫 번째 링크는 자동으로 대표 링크
    }

    onChange([...links, newLink])
  }, [links, maxLinks, onChange])

  // 링크 삭제
  const handleRemoveLink = useCallback((id: string) => {
    const newLinks = links.filter(link => link.id !== id)

    // 대표 링크가 삭제되면 첫 번째 링크를 대표로 지정
    if (newLinks.length > 0 && !newLinks.some(link => link.isPrimary)) {
      newLinks[0].isPrimary = true
    }

    onChange(newLinks)
  }, [links, onChange])

  // 링크 필드 업데이트
  const handleUpdateLink = useCallback((id: string, field: keyof ProjectLink, value: string | boolean) => {
    const newLinks = links.map(link => {
      if (link.id !== id) {
        // 다른 링크의 isPrimary를 false로 설정 (대표 링크 변경 시)
        if (field === 'isPrimary' && value === true) {
          return { ...link, isPrimary: false }
        }
        return link
      }
      return { ...link, [field]: value }
    })

    onChange(newLinks)
  }, [links, onChange])

  // URL 입력 시 스토어 타입 자동 추론
  const handleUrlChange = useCallback((id: string, url: string) => {
    const newLinks = links.map(link => {
      if (link.id !== id) return link

      // URL이 비어있지 않고 현재 타입이 WEBSITE나 OTHER인 경우에만 자동 추론
      const shouldInfer = url.length > 10 && ['WEBSITE', 'OTHER'].includes(link.storeType)
      const inferredType = shouldInfer ? inferStoreType(url) : link.storeType

      return {
        ...link,
        url,
        storeType: inferredType,
      }
    })

    onChange(newLinks)
  }, [links, onChange])

  // 스토어 타입 드롭다운 토글
  const toggleDropdown = useCallback((id: string) => {
    setExpandedDropdown(prev => prev === id ? null : id)
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          다운로드/접속 링크
          <span className="ml-2 text-xs text-slate-500">
            ({links.length}/{maxLinks})
          </span>
        </label>
        {links.length < maxLinks && (
          <button
            type="button"
            onClick={handleAddLink}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            링크 추가
          </button>
        )}
      </div>

      {/* 링크 목록 */}
      {links.length === 0 ? (
        <button
          type="button"
          onClick={handleAddLink}
          className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex flex-col items-center gap-2"
        >
          <Plus className="w-6 h-6" />
          <span>첫 번째 링크 추가하기</span>
        </button>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <LinkItem
              key={link.id}
              link={link}
              index={index}
              isDropdownOpen={expandedDropdown === link.id}
              onToggleDropdown={() => toggleDropdown(link.id)}
              onCloseDropdown={() => setExpandedDropdown(null)}
              onUpdate={handleUpdateLink}
              onUrlChange={handleUrlChange}
              onRemove={handleRemoveLink}
            />
          ))}
        </div>
      )}

      {/* 도움말 */}
      {links.length > 0 && (
        <p className="text-xs text-slate-500">
          별표 아이콘을 눌러 대표 링크를 지정하세요. 대표 링크는 메인 버튼으로 표시됩니다.
        </p>
      )}
    </div>
  )
}

// 개별 링크 아이템 컴포넌트
interface LinkItemProps {
  link: ProjectLink
  index: number
  isDropdownOpen: boolean
  onToggleDropdown: () => void
  onCloseDropdown: () => void
  onUpdate: (id: string, field: keyof ProjectLink, value: string | boolean) => void
  onUrlChange: (id: string, url: string) => void
  onRemove: (id: string) => void
}

const LinkItem: React.FC<LinkItemProps> = ({
  link,
  isDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onUpdate,
  onUrlChange,
  onRemove,
}) => {
  const storeConfig = getStoreConfig(link.storeType)

  return (
    <div className="group relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        {/* 대표 링크 토글 */}
        <button
          type="button"
          onClick={() => onUpdate(link.id, 'isPrimary', !link.isPrimary)}
          className={`mt-2 p-1 rounded transition-colors ${
            link.isPrimary
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-slate-300 hover:text-slate-400'
          }`}
          title={link.isPrimary ? '대표 링크' : '대표 링크로 설정'}
        >
          <Star className={`w-5 h-5 ${link.isPrimary ? 'fill-current' : ''}`} />
        </button>

        <div className="flex-1 space-y-3">
          {/* 스토어 타입 선택 */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleDropdown}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-left hover:border-slate-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                {storeConfig.icon}
                <span>{storeConfig.label}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={onCloseDropdown}
                />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {STORE_GROUPS.map(group => (
                    <div key={group.category}>
                      <div className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 sticky top-0">
                        {group.label}
                      </div>
                      {group.stores.map(storeType => {
                        const config = STORE_CONFIGS[storeType]
                        const isSelected = link.storeType === storeType
                        return (
                          <button
                            key={storeType}
                            type="button"
                            onClick={() => {
                              onUpdate(link.id, 'storeType', storeType)
                              onCloseDropdown()
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                              isSelected ? 'bg-indigo-50 text-indigo-700' : ''
                            }`}
                          >
                            {config.icon}
                            <span>{config.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* URL 입력 */}
          <div className="relative">
            <input
              type="url"
              value={link.url}
              onChange={(e) => onUrlChange(link.id, e.target.value)}
              placeholder={storeConfig.placeholder}
              className="w-full px-3 py-2 pr-10 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {link.url && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                title="링크 열기"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* 커스텀 라벨 (선택) */}
          <input
            type="text"
            value={link.label || ''}
            onChange={(e) => onUpdate(link.id, 'label', e.target.value)}
            placeholder="커스텀 라벨 (선택, 예: 'v2.0 다운로드')"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => onRemove(link.id)}
          className="mt-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="링크 삭제"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* URL 힌트 */}
      <p className="mt-2 ml-9 text-xs text-slate-500">
        {storeConfig.urlHint}
      </p>
    </div>
  )
}

export default MultiLinkInput
