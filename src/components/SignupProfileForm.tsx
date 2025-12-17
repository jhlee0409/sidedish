'use client'

import React, { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChefHat,
  Camera,
  User,
  Check,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

// ==================== Zod Schema ====================

const signupFormSchema = z.object({
  name: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(/^[가-힣a-zA-Z0-9_\s]+$/, '닉네임에 특수문자는 사용할 수 없습니다.'),
  avatarUrl: z.string().optional(),
  termsOfService: z.literal(true, '서비스 이용약관에 동의해주세요.'),
  privacyPolicy: z.literal(true, '개인정보 처리방침에 동의해주세요.'),
  marketing: z.boolean(),
})

type SignupFormData = z.infer<typeof signupFormSchema>

// ==================== Types ====================

interface SignupProfileFormProps {
  onSubmit: (data: {
    name: string
    avatarUrl: string
    agreements: {
      termsOfService: boolean
      privacyPolicy: boolean
      marketing: boolean
    }
  }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// ==================== Component ====================

const SignupProfileForm: React.FC<SignupProfileFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Avatar State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      termsOfService: false as unknown as true,
      privacyPolicy: false as unknown as true,
      marketing: false,
    },
    mode: 'onChange',
  })

  const watchName = watch('name')
  const watchAvatarUrl = watch('avatarUrl')
  const watchTerms = watch('termsOfService')
  const watchPrivacy = watch('privacyPolicy')

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

  // ==================== Handlers ====================

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('이미지 크기는 5MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드 가능합니다.')
      return
    }

    setUploadError(null)
    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      const data = await response.json()
      setValue('avatarUrl', data.url)
    } catch (err) {
      console.error('Image upload error:', err)
      setUploadError('이미지 업로드에 실패했습니다.')
      setAvatarPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setValue('avatarUrl', '')
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAllRequiredChange = (checked: boolean) => {
    setValue('termsOfService', checked as unknown as true, { shouldValidate: true })
    setValue('privacyPolicy', checked as unknown as true, { shouldValidate: true })
  }

  const handleFormSubmit = async (data: SignupFormData) => {
    await onSubmit({
      name: data.name.trim(),
      avatarUrl: data.avatarUrl || '',
      agreements: {
        termsOfService: data.termsOfService,
        privacyPolicy: data.privacyPolicy,
        marketing: data.marketing,
      },
    })
  }

  const allRequiredChecked = watchTerms && watchPrivacy

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            {onCancel ? (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="font-medium">취소</span>
              </button>
            ) : (
              <div className="w-24" />
            )}
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-slate-900">회원가입</span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 px-8 py-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 text-center">
                <div className="inline-flex bg-white/20 p-4 rounded-2xl mb-4">
                  <ChefHat className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold mb-2">셰프 데뷔하기</h1>
                <p className="text-white/80 text-sm">
                  프로필을 설정하고 SideDish에 합류하세요
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
              {uploadError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-200">
                  {uploadError}
                </div>
              )}

              {/* 프로필 사진 */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {avatarPreview || watchAvatarUrl ? (
                    <div className="relative">
                      <img
                        src={avatarPreview || watchAvatarUrl}
                        alt="프로필 미리보기"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg ${getProfileColor(watchName || '')}`}
                    >
                      {watchName?.trim() ? (
                        getInitial(watchName)
                      ) : (
                        <User className="w-10 h-10" />
                      )}
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  프로필 사진 {avatarPreview || watchAvatarUrl ? '변경' : '추가'}
                </label>
                <p className="text-xs text-slate-400">선택사항 (5MB 이하)</p>
              </div>

              {/* 닉네임 */}
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                      닉네임 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...field}
                      type="text"
                      id="name"
                      placeholder="SideDish에서 사용할 닉네임"
                      maxLength={20}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        fieldState.error
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                      }`}
                    />
                    <div className="flex justify-between">
                      {fieldState.error ? (
                        <p className="text-xs text-red-500">{fieldState.error.message}</p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          한글, 영문, 숫자, 밑줄(_)만 사용 가능 (2-20자)
                        </p>
                      )}
                      <p className="text-xs text-slate-400">{field.value?.length || 0}/20</p>
                    </div>
                  </div>
                )}
              />

              {/* 약관 동의 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 pt-4">약관 동의</p>

                {/* 필수 약관 전체 동의 */}
                <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={allRequiredChecked}
                      onChange={(e) => handleAllRequiredChange(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-lg peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
                      {allRequiredChecked && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800">필수 약관 전체 동의</span>
                </label>

                <div className="space-y-1 pl-2">
                  {/* 서비스 이용약관 */}
                  <Controller
                    name="termsOfService"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
                              {field.value && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <span className="text-sm text-slate-600 flex-1">
                            <span className="text-red-500 font-medium">[필수]</span> 서비스 이용약관
                          </span>
                          <Link
                            href="/terms"
                            target="_blank"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </label>
                        {fieldState.error && (
                          <p className="text-red-500 text-xs pl-8">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* 개인정보 처리방침 */}
                  <Controller
                    name="privacyPolicy"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
                              {field.value && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <span className="text-sm text-slate-600 flex-1">
                            <span className="text-red-500 font-medium">[필수]</span> 개인정보 처리방침
                          </span>
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </label>
                        {fieldState.error && (
                          <p className="text-red-500 text-xs pl-8">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* 마케팅 수신 동의 */}
                  <Controller
                    name="marketing"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
                              {field.value && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <span className="text-sm text-slate-600 flex-1">
                            <span className="text-slate-400">[선택]</span> 마케팅 정보 수신 동의
                          </span>
                        </label>
                        <p className="text-xs text-slate-400 pl-8 mt-1">
                          SideDish의 새로운 소식과 이벤트 정보를 받아보실 수 있습니다.
                        </p>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={!isValid || isUploading || isLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '가입 완료하기'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupProfileForm
