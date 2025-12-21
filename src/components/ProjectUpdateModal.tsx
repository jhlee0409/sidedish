'use client'

import { useState } from 'react'
import { X, Flag, BookOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Button from './Button'
import { ProjectUpdateResponse, ProjectUpdateType } from '@/lib/db-types'
import { createProjectUpdate, ApiError } from '@/lib/api-client'

interface ProjectUpdateModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (update: ProjectUpdateResponse) => void
}

const MILESTONE_EMOJIS = [
  { emoji: '🎉', label: '축하' },
  { emoji: '🚀', label: '출시' },
  { emoji: '✨', label: '새기능' },
  { emoji: '🐛', label: '버그수정' },
  { emoji: '🔧', label: '개선' },
  { emoji: '📦', label: '배포' },
  { emoji: '🎨', label: '디자인' },
  { emoji: '⚡', label: '성능' },
  { emoji: '🔒', label: '보안' },
  { emoji: '📝', label: '문서' },
  { emoji: '🌟', label: '성과' },
  { emoji: '💡', label: '아이디어' },
]

const ProjectUpdateModal: React.FC<ProjectUpdateModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<ProjectUpdateType>('devlog')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [version, setVersion] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const update = await createProjectUpdate(projectId, {
        type,
        title: title.trim(),
        content: content.trim(),
        version: type === 'milestone' && version.trim() ? version.trim() : undefined,
        emoji: type === 'milestone' ? emoji : undefined,
      })
      onSuccess(update)
    } catch (error) {
      console.error('Failed to create update:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('업데이트 작성에 실패했습니다.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">개발 기록 추가</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">기록 유형</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('milestone')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  type === 'milestone'
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'milestone' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  <Flag className={`w-5 h-5 ${type === 'milestone' ? 'text-indigo-600' : 'text-slate-500'}`} />
                </div>
                <div className="text-left">
                  <div className={`font-bold ${type === 'milestone' ? 'text-indigo-900' : 'text-slate-700'}`}>
                    마일스톤
                  </div>
                  <div className="text-xs text-slate-500">
                    버전 출시, 목표 달성
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('devlog')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  type === 'devlog'
                    ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${type === 'devlog' ? 'bg-slate-200' : 'bg-slate-100'}`}>
                  <BookOpen className={`w-5 h-5 ${type === 'devlog' ? 'text-slate-700' : 'text-slate-500'}`} />
                </div>
                <div className="text-left">
                  <div className={`font-bold ${type === 'devlog' ? 'text-slate-900' : 'text-slate-700'}`}>
                    개발로그
                  </div>
                  <div className="text-xs text-slate-500">
                    개발 과정, 일상 기록
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Milestone Options */}
          {type === 'milestone' && (
            <>
              {/* Emoji Selector */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">아이콘</label>
                <div className="flex flex-wrap gap-2">
                  {MILESTONE_EMOJIS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => setEmoji(item.emoji)}
                      className={`p-2 text-xl rounded-lg transition-all ${
                        emoji === item.emoji
                          ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Version */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  버전 <span className="font-normal text-slate-400">(선택)</span>
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="예: v1.0.0, Beta 2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  maxLength={20}
                />
              </div>
            </>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'milestone' ? '예: 정식 버전 출시!' : '예: 로그인 기능 구현 중'}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all"
              maxLength={100}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'milestone'
                  ? '이번 마일스톤에서 달성한 내용을 적어주세요...'
                  : '오늘의 개발 과정을 자유롭게 기록해주세요...'
              }
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none"
              maxLength={5000}
              required
            />
            <p className="text-xs text-slate-400 text-right">
              {content.length}/5000 (마크다운 지원)
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  등록 중...
                </span>
              ) : (
                '기록 등록'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectUpdateModal
