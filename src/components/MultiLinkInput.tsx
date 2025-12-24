'use client'

import React, { useState, useCallback } from 'react'
import { Plus, Trash2, Star, ExternalLink, ChevronDown, AlertCircle, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ProjectLink, StoreType, MAX_PROJECT_LINKS } from '@/lib/types'
import { STORE_CONFIGS, STORE_GROUPS, getStoreConfig, inferStoreType } from '@/lib/store-config'
import ConfirmModal from './ConfirmModal'

// RHF 폼에서 넘어오는 링크 타입 (storeType이 string일 수 있음)
type FormLink = {
  id: string
  storeType: string
  url: string
  label?: string
  isPrimary: boolean
}

interface MultiLinkInputProps {
  links: FormLink[]
  onChange: (links: FormLink[]) => void
  maxLinks?: number
  className?: string
  showValidation?: boolean
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
  showValidation = false,
}) => {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; hasContent: boolean } | null>(null)

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동해야 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 대표 링크가 설정되어 있는지 확인
  const hasPrimaryLink = links.some(link => link.isPrimary)
  const hasAtLeastOneLink = links.length > 0

  // 유효성: 링크가 있으면 반드시 하나의 대표 링크가 필요
  const isValid = !hasAtLeastOneLink || hasPrimaryLink

  // 드래그 끝났을 때 순서 변경
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex(link => link.id === active.id)
      const newIndex = links.findIndex(link => link.id === over.id)
      const newLinks = arrayMove(links, oldIndex, newIndex)
      onChange(newLinks)
    }
  }, [links, onChange])

  // 새 링크 추가
  const handleAddLink = useCallback(() => {
    if (links.length >= maxLinks) return

    const newLink: FormLink = {
      id: generateId(),
      storeType: 'WEBSITE',
      url: '',
      isPrimary: links.length === 0, // 첫 번째 링크는 자동으로 대표 링크
    }

    onChange([...links, newLink])
  }, [links, maxLinks, onChange])

  // 링크에 텍스트 콘텐츠가 있는지 확인 (URL 또는 라벨)
  const hasTextContent = useCallback((link: FormLink) => {
    return (link.url && link.url.trim().length > 0) || (link.label && link.label.trim().length > 0)
  }, [])

  // 링크 삭제 시도 (확인 필요 여부 체크)
  const handleTryRemoveLink = useCallback((id: string) => {
    const link = links.find(l => l.id === id)
    if (!link) return

    // 텍스트가 입력되어 있으면 확인 모달 표시
    if (hasTextContent(link)) {
      setDeleteConfirm({ id, hasContent: true })
    } else {
      // 텍스트 없으면 바로 삭제
      handleConfirmRemove(id)
    }
  }, [links, hasTextContent])

  // 링크 삭제 확정
  const handleConfirmRemove = useCallback((id: string) => {
    const newLinks = links.filter(link => link.id !== id)

    // 대표 링크가 삭제되면 첫 번째 링크를 대표로 지정
    if (newLinks.length > 0 && !newLinks.some(link => link.isPrimary)) {
      newLinks[0].isPrimary = true
    }

    onChange(newLinks)
    setDeleteConfirm(null)
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

  // 대표 링크 토글 (항상 하나는 유지)
  const handleTogglePrimary = useCallback((id: string) => {
    const currentLink = links.find(l => l.id === id)
    if (!currentLink) return

    // 이미 대표인 경우: 대표 해제하면 안됨 (항상 하나는 대표여야 함)
    if (currentLink.isPrimary) {
      // 다른 링크가 있으면 경고 (첫번째 다른 링크가 자동으로 대표가 됨)
      // 다른 링크가 없으면 해제 불가
      if (links.length === 1) {
        return // 유일한 링크면 대표 해제 불가
      }
    }

    // 새로운 대표 링크 설정
    const newLinks = links.map(link => ({
      ...link,
      isPrimary: link.id === id ? !link.isPrimary : (link.id === id ? link.isPrimary : false),
    }))

    // 대표가 없으면 첫 번째를 대표로
    if (!newLinks.some(l => l.isPrimary)) {
      const firstOther = newLinks.find(l => l.id !== id)
      if (firstOther) {
        firstOther.isPrimary = true
      } else {
        // 자기 자신뿐이면 대표 유지
        newLinks[0].isPrimary = true
      }
    }

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

      {/* 유효성 경고 */}
      {showValidation && hasAtLeastOneLink && !hasPrimaryLink && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>대표 링크를 지정해주세요. 별표 아이콘을 클릭하면 대표 링크로 설정됩니다.</span>
        </div>
      )}

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map(link => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {links.map((link, index) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  index={index}
                  isOnlyLink={links.length === 1}
                  isDropdownOpen={expandedDropdown === link.id}
                  onToggleDropdown={() => toggleDropdown(link.id)}
                  onCloseDropdown={() => setExpandedDropdown(null)}
                  onUpdate={handleUpdateLink}
                  onUrlChange={handleUrlChange}
                  onTogglePrimary={handleTogglePrimary}
                  onRemove={handleTryRemoveLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 도움말 */}
      {links.length > 1 && (
        <p className="text-xs text-slate-500">
          드래그하여 순서를 변경하세요. 별표를 눌러 대표 링크를 지정하면 상세 페이지에서 메인 버튼으로 표시됩니다.
        </p>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleConfirmRemove(deleteConfirm.id)}
        title="링크 삭제"
        message="입력한 내용이 있습니다. 정말 이 링크를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </div>
  )
}

// Sortable 개별 링크 아이템 컴포넌트
interface SortableLinkItemProps {
  link: FormLink
  index: number
  isOnlyLink: boolean
  isDropdownOpen: boolean
  onToggleDropdown: () => void
  onCloseDropdown: () => void
  onUpdate: (id: string, field: keyof FormLink, value: string | boolean) => void
  onUrlChange: (id: string, url: string) => void
  onTogglePrimary: (id: string) => void
  onRemove: (id: string) => void
}

const SortableLinkItem: React.FC<SortableLinkItemProps> = ({
  link,
  isOnlyLink,
  isDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onUpdate,
  onUrlChange,
  onTogglePrimary,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.9 : 1,
  }

  const storeConfig = getStoreConfig(link.storeType as StoreType)

  // 유일한 링크이고 대표 링크인 경우 토글 비활성화
  const isPrimaryLocked = isOnlyLink && link.isPrimary

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl p-4 border transition-colors ${
        isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''
      } ${
        link.isPrimary
          ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* 드래그 핸들 */}
        <button
          type="button"
          className={`mt-2 p-1 rounded cursor-grab active:cursor-grabbing transition-colors ${
            isDragging
              ? 'text-indigo-500'
              : 'text-slate-300 hover:text-slate-500'
          }`}
          title="드래그하여 순서 변경"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* 대표 링크 토글 */}
        <button
          type="button"
          onClick={() => !isPrimaryLocked && onTogglePrimary(link.id)}
          disabled={isPrimaryLocked}
          className={`mt-2 p-1 rounded transition-colors ${
            link.isPrimary
              ? isPrimaryLocked
                ? 'text-amber-400 cursor-default'
                : 'text-amber-500 hover:text-amber-600'
              : 'text-slate-300 hover:text-amber-400'
          }`}
          title={
            isPrimaryLocked
              ? '유일한 링크는 항상 대표입니다'
              : link.isPrimary
                ? '대표 링크 (다른 링크를 대표로 지정하면 해제됩니다)'
                : '대표 링크로 설정'
          }
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

      {/* URL 힌트 및 대표 링크 배지 */}
      <div className="mt-2 ml-16 flex items-center gap-2">
        {link.isPrimary && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <Star className="w-3 h-3 fill-current" />
            대표 링크
          </span>
        )}
        <p className="text-xs text-slate-500">
          {storeConfig.urlHint}
        </p>
      </div>
    </div>
  )
}

export default MultiLinkInput
