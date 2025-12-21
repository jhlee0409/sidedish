'use client'

import { useState, useEffect } from 'react'
import { Flag, BookOpen, Plus, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import SafeMarkdown from './SafeMarkdown'
import Button from './Button'
import ConfirmModal from './ConfirmModal'
import ProjectUpdateModal from './ProjectUpdateModal'
import { ProjectUpdateResponse, ProjectUpdateType } from '@/lib/db-types'
import { getProjectUpdates, deleteProjectUpdate, ApiError } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'

interface ProjectUpdateTimelineProps {
  projectId: string
  projectAuthorId: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return diffMinutes <= 1 ? '방금 전' : `${diffMinutes}분 전`
    }
    return `${diffHours}시간 전`
  }
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getTypeInfo = (type: ProjectUpdateType, emoji?: string) => {
  if (type === 'milestone') {
    return {
      icon: emoji || '🚀',
      label: '마일스톤',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      dotColor: 'bg-indigo-500',
      textColor: 'text-indigo-700',
    }
  }
  return {
    icon: '📝',
    label: '개발로그',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
    textColor: 'text-slate-600',
  }
}

const ProjectUpdateTimeline: React.FC<ProjectUpdateTimelineProps> = ({
  projectId,
  projectAuthorId,
}) => {
  const { user, isAuthenticated } = useAuth()
  const [updates, setUpdates] = useState<ProjectUpdateResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [filter, setFilter] = useState<ProjectUpdateType | 'all'>('all')

  const isOwner = isAuthenticated && user?.id === projectAuthorId

  const loadUpdates = async (cursor?: string) => {
    try {
      const result = await getProjectUpdates(projectId, {
        limit: 10,
        cursor,
        type: filter === 'all' ? undefined : filter,
      })

      if (cursor) {
        setUpdates(prev => [...prev, ...result.data])
      } else {
        setUpdates(result.data)
      }
      setHasMore(result.hasMore)
      setNextCursor(result.nextCursor)
    } catch (error) {
      console.error('Failed to load updates:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    loadUpdates()
  }, [projectId, filter])

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    loadUpdates(nextCursor)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProjectUpdate(deleteTarget)
      setUpdates(prev => prev.filter(u => u.id !== deleteTarget))
      toast.success('업데이트가 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete update:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('삭제에 실패했습니다.')
      }
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleCreateSuccess = (newUpdate: ProjectUpdateResponse) => {
    setUpdates(prev => [newUpdate, ...prev])
    setShowModal(false)
    toast.success('업데이트가 등록되었습니다!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900">개발 여정</h3>
          <span className="text-sm text-slate-500">({updates.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('milestone')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filter === 'milestone'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Flag className="w-3 h-3" />
              마일스톤
            </button>
            <button
              onClick={() => setFilter('devlog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filter === 'devlog'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              개발로그
            </button>
          </div>
          {/* Add Button (Owner Only) */}
          {isOwner && (
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              기록 추가
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {updates.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-slate-500 text-sm">
            {isOwner
              ? '아직 업데이트가 없습니다. 첫 번째 기록을 남겨보세요!'
              : '아직 업데이트가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent" />

          {/* Updates */}
          <div className="space-y-4">
            {updates.map((update, index) => {
              const typeInfo = getTypeInfo(update.type, update.emoji)
              return (
                <div
                  key={update.id}
                  className={`relative pl-10 animate-in fade-in slide-in-from-left-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${typeInfo.dotColor} ring-4 ring-white`}
                  />

                  {/* Card */}
                  <div
                    className={`${typeInfo.bgColor} border ${typeInfo.borderColor} rounded-xl p-4 hover:shadow-md transition-shadow`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">
                              {update.title}
                            </h4>
                            {update.version && (
                              <span className="px-2 py-0.5 bg-white/80 border border-indigo-200 rounded-full text-xs font-medium text-indigo-600">
                                {update.version}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className={`${typeInfo.textColor} font-medium`}>
                              {typeInfo.label}
                            </span>
                            <span>·</span>
                            <span>{formatDate(update.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button (Owner Only) */}
                      {isOwner && (
                        <button
                          onClick={() => setDeleteTarget(update.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="prose prose-sm prose-slate max-w-none">
                      <SafeMarkdown>{update.content}</SafeMarkdown>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-slate-600"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
                더 보기
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <ProjectUpdateModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="업데이트 삭제"
        message="이 업데이트를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </div>
  )
}

export default ProjectUpdateTimeline
