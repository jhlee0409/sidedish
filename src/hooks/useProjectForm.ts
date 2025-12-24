/**
 * 프로젝트 폼 훅
 *
 * register와 edit 페이지에서 공통으로 사용하는 프로젝트 폼 로직을 제공합니다.
 * React Hook Form + Zod를 기반으로 합니다.
 */

import { useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectFormSchema, projectFormDefaultValues, type ProjectFormData } from '@/lib/schemas'

export interface UseProjectFormOptions {
  defaultValues?: Partial<ProjectFormData>
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all'
}

export interface UseProjectFormReturn extends UseFormReturn<ProjectFormData> {
  // 태그 관련 헬퍼
  addTag: (tag: string) => boolean
  removeTag: (tag: string) => void
  canAddMoreTags: boolean

  // 폼 데이터 헬퍼
  updateFormData: (data: Partial<ProjectFormData>) => void
  getFormValues: () => ProjectFormData
}

export function useProjectForm(options: UseProjectFormOptions = {}): UseProjectFormReturn {
  const { defaultValues, mode = 'onChange' } = options

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...projectFormDefaultValues,
      ...defaultValues,
    },
    mode,
  })

  const { watch, setValue, getValues } = form
  const tags = watch('tags')

  // 태그 추가
  const addTag = useCallback(
    (tag: string): boolean => {
      const trimmedTag = tag.trim().toLowerCase()
      if (!trimmedTag) return false

      const currentTags = getValues('tags') || []
      if (currentTags.length >= 5) return false
      if (currentTags.includes(trimmedTag)) return false

      setValue('tags', [...currentTags, trimmedTag], { shouldValidate: true })
      return true
    },
    [getValues, setValue]
  )

  // 태그 제거
  const removeTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = getValues('tags') || []
      setValue(
        'tags',
        currentTags.filter(tag => tag !== tagToRemove),
        { shouldValidate: true }
      )
    },
    [getValues, setValue]
  )

  // 태그 추가 가능 여부
  const canAddMoreTags = (tags?.length || 0) < 5

  // 폼 데이터 부분 업데이트
  const updateFormData = useCallback(
    (data: Partial<ProjectFormData>) => {
      Object.entries(data).forEach(([key, value]) => {
        setValue(key as keyof ProjectFormData, value as never, { shouldValidate: true })
      })
    },
    [setValue]
  )

  // 현재 폼 값 가져오기
  const getFormValues = useCallback(() => getValues(), [getValues])

  return {
    ...form,
    addTag,
    removeTag,
    canAddMoreTags,
    updateFormData,
    getFormValues,
  }
}

export default useProjectForm
