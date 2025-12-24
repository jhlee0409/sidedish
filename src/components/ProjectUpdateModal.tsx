'use client'

import { useEffect } from 'react'
import { X, Flag, BookOpen, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Button from './Button'
import { FormField, CharacterCount } from '@/components/form'
import { ProjectUpdateResponse } from '@/lib/db-types'
import { createProjectUpdate, ApiError } from '@/lib/api-client'
import {
  projectUpdateFormSchema,
  projectUpdateFormDefaultValues,
  type ProjectUpdateFormData,
  type ProjectUpdateType,
} from '@/lib/schemas'
import { MILESTONE_EMOJIS } from '@/lib/form-constants'

interface ProjectUpdateModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (update: ProjectUpdateResponse) => void
}

const ProjectUpdateModal: React.FC<ProjectUpdateModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProjectUpdateFormData>({
    resolver: zodResolver(projectUpdateFormSchema),
    defaultValues: projectUpdateFormDefaultValues,
    mode: 'onChange',
  })

  const watchType = watch('type')
  const watchContent = watch('content')
  const watchEmoji = watch('emoji')

  const onSubmit = async (data: ProjectUpdateFormData) => {
    try {
      const update = await createProjectUpdate(projectId, {
        type: data.type,
        title: data.title.trim(),
        content: data.content.trim(),
        version: data.type === 'milestone' && data.version ? data.version.trim() : undefined,
        emoji: data.type === 'milestone' ? data.emoji : undefined,
      })
      onSuccess(update)
    } catch (error) {
      console.error('Failed to create update:', error)
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('업데이트 작성에 실패했습니다.')
      }
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Type Selector */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormField label="기록 유형" error={errors.type}>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange('milestone')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      field.value === 'milestone'
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${field.value === 'milestone' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <Flag className={`w-5 h-5 ${field.value === 'milestone' ? 'text-indigo-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${field.value === 'milestone' ? 'text-indigo-900' : 'text-slate-700'}`}>
                        마일스톤
                      </div>
                      <div className="text-xs text-slate-500">
                        버전 출시, 목표 달성
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('devlog')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      field.value === 'devlog'
                        ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${field.value === 'devlog' ? 'bg-slate-200' : 'bg-slate-100'}`}>
                      <BookOpen className={`w-5 h-5 ${field.value === 'devlog' ? 'text-slate-700' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${field.value === 'devlog' ? 'text-slate-900' : 'text-slate-700'}`}>
                        개발로그
                      </div>
                      <div className="text-xs text-slate-500">
                        개발 과정, 일상 기록
                      </div>
                    </div>
                  </button>
                </div>
              </FormField>
            )}
          />

          {/* Milestone Options */}
          {watchType === 'milestone' && (
            <>
              {/* Emoji Selector */}
              <Controller
                name="emoji"
                control={control}
                render={({ field }) => (
                  <FormField label="아이콘" error={errors.emoji}>
                    <div className="flex flex-wrap gap-2">
                      {MILESTONE_EMOJIS.map((item) => (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => field.onChange(item.emoji)}
                          className={`p-2 text-xl rounded-lg transition-all ${
                            field.value === item.emoji
                              ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                          title={item.label}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                  </FormField>
                )}
              />

              {/* Version */}
              <Controller
                name="version"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="버전"
                    htmlFor="version"
                    hint="선택사항"
                    error={errors.version}
                  >
                    <input
                      {...field}
                      id="version"
                      type="text"
                      placeholder="예: v1.0.0, Beta 2"
                      maxLength={20}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    />
                  </FormField>
                )}
              />
            </>
          )}

          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <FormField
                label="제목"
                htmlFor="title"
                required
                error={errors.title}
              >
                <input
                  {...field}
                  id="title"
                  type="text"
                  placeholder={watchType === 'milestone' ? '예: 정식 버전 출시!' : '예: 로그인 기능 구현 중'}
                  maxLength={100}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all ${
                    errors.title ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </FormField>
            )}
          />

          {/* Content */}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <FormField
                label="내용"
                htmlFor="content"
                required
                error={errors.content}
              >
                <textarea
                  {...field}
                  id="content"
                  placeholder={
                    watchType === 'milestone'
                      ? '이번 마일스톤에서 달성한 내용을 적어주세요...'
                      : '오늘의 개발 과정을 자유롭게 기록해주세요...'
                  }
                  rows={5}
                  maxLength={5000}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none ${
                    errors.content ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">마크다운 지원</span>
                  <CharacterCount current={watchContent?.length || 0} max={5000} />
                </div>
              </FormField>
            )}
          />

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
              disabled={isSubmitting || !isValid}
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
