'use client'

import { useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { X, Camera, Loader2, Trash2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/contexts/AuthContext'
import { updateUser, uploadImage, invalidateCache } from '@/lib/api-client'
import { toast } from 'sonner'
import { profileEditFormSchema, type ProfileEditFormData } from '@/lib/schemas'
import { FormField, CharacterCount } from '@/components/form'
import { CONTENT_LIMITS } from '@/lib/security-utils'

// ==================== Helper Functions ====================

const getInitial = (name: string) => {
  if (!name?.trim()) return '?'
  return name.trim().charAt(0).toUpperCase()
}

const getProfileColor = (name: string) => {
  const colors = [
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-amber-500',
  ]
  const index = (name?.length || 0) % colors.length
  return colors[index]
}

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const { user, updateProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
    mode: 'onChange',
  })

  // 모달 열릴 때 사용자 정보로 폼 리셋
  useEffect(() => {
    if (isOpen && user) {
      reset({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
      })
    }
  }, [isOpen, user, reset])

  const watchName = watch('name')
  const watchAvatarUrl = watch('avatarUrl')

  const isCustomAvatar =
    watchAvatarUrl && watchAvatarUrl.includes('public.blob.vercel-storage.com')
  const originalAvatarUrl = user?.originalAvatarUrl || ''

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // 파일 검증
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error('JPG, PNG, WebP, GIF 형식만 지원합니다.')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하만 가능합니다.')
        return
      }

      try {
        const { url } = await uploadImage(file)
        setValue('avatarUrl', url, { shouldValidate: true })
        toast.success('이미지가 업로드되었습니다.')
      } catch (error) {
        console.error('Image upload failed:', error)
        toast.error('이미지 업로드에 실패했습니다.')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [setValue]
  )

  const handleResetToOriginal = useCallback(() => {
    if (originalAvatarUrl) {
      setValue('avatarUrl', originalAvatarUrl, { shouldValidate: true })
      toast.success('기본 프로필 사진으로 변경되었습니다.')
    }
  }, [originalAvatarUrl, setValue])

  const handleRemoveAvatar = useCallback(() => {
    setValue('avatarUrl', '', { shouldValidate: true })
    toast.success('프로필 사진이 삭제되었습니다.')
  }, [setValue])

  const onSubmit = async (data: ProfileEditFormData) => {
    if (!user) return

    try {
      // 서버에 업데이트 요청
      await updateUser(user.id, {
        name: data.name.trim(),
        avatarUrl: data.avatarUrl,
      })

      // 로컬 상태 업데이트
      updateProfile({
        name: data.name.trim(),
        avatarUrl: data.avatarUrl,
      })

      // 캐시 무효화
      invalidateCache(`user:${user.id}`)

      toast.success('프로필이 수정되었습니다.')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Profile update failed:', error)
      toast.error('프로필 수정에 실패했습니다.')
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold">프로필 수정</h2>
            <p className="text-white/80 mt-1">나만의 스타일을 표현해보세요</p>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {watchAvatarUrl ? (
                  <Image
                    src={watchAvatarUrl}
                    alt={watchName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white ${getProfileColor(watchName || '')}`}
                  >
                    {getInitial(watchName || '')}
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Avatar Action Buttons */}
            <div className="mt-3 flex flex-col items-center gap-2">
              {/* Remove Avatar Button - 이미지가 있을 때만 표시 */}
              {watchAvatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  사진 삭제
                </button>
              )}
            </div>

            {/* Helper Text */}
            {!watchAvatarUrl && (
              <p className="mt-2 text-xs text-slate-400">
                사진이 없으면 닉네임 첫 글자가 표시됩니다
              </p>
            )}
          </div>

          {/* Name Input */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormField
                label="닉네임"
                htmlFor="name"
                required
                error={errors.name}
              >
                <input
                  {...field}
                  id="name"
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  maxLength={CONTENT_LIMITS.USER_NAME_MAX}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
                <div className="flex justify-end mt-1">
                  <CharacterCount
                    current={field.value?.length || 0}
                    max={CONTENT_LIMITS.USER_NAME_MAX}
                  />
                </div>
              </FormField>
            )}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
