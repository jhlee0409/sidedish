'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Camera, RotateCcw, Loader2, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { updateUser, uploadImage, invalidateCache } from '@/lib/api-client'
import { toast } from 'sonner'

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
  const [name, setName] = useState(user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCustomAvatar =
    avatarUrl && avatarUrl.includes('public.blob.vercel-storage.com')
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

      setIsUploading(true)
      try {
        const { url } = await uploadImage(file)
        setAvatarUrl(url)
        toast.success('이미지가 업로드되었습니다.')
      } catch (error) {
        console.error('Image upload failed:', error)
        toast.error('이미지 업로드에 실패했습니다.')
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    []
  )

  const handleResetToOriginal = useCallback(() => {
    if (originalAvatarUrl) {
      setAvatarUrl(originalAvatarUrl)
      toast.success('기본 프로필 사진으로 변경되었습니다.')
    }
  }, [originalAvatarUrl])

  const handleSave = async () => {
    if (!user) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('닉네임을 입력해주세요.')
      return
    }

    if (trimmedName.length > 30) {
      toast.error('닉네임은 30자 이하로 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      // 서버에 업데이트 요청
      await updateUser(user.id, {
        name: trimmedName,
        avatarUrl,
      })

      // 로컬 상태 업데이트
      updateProfile({
        name: trimmedName,
        avatarUrl,
      })

      // 캐시 무효화
      invalidateCache(`user:${user.id}`)

      toast.success('프로필이 수정되었습니다.')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Profile update failed:', error)
      toast.error('프로필 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
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
        <div className="p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
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

            {/* Reset to Original Button */}
            {isCustomAvatar && originalAvatarUrl && (
              <button
                onClick={handleResetToOriginal}
                className="mt-3 text-sm text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                기본 사진으로 되돌리기
              </button>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              닉네임
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={30}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {name.length}/30
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isUploading}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
