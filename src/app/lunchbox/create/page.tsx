'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Package,
  Loader2,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import { DigestCategory, SupportedCity, CATEGORY_NAMES, CITY_NAMES } from '@/lib/digest-types'
import { isAdmin } from '@/lib/admin-constants'

// ==================== Constants ====================

const CATEGORY_OPTIONS: { value: DigestCategory; label: string; icon: string }[] = [
  { value: 'weather', label: '날씨', icon: '🌤️' },
  { value: 'news', label: '뉴스', icon: '📰' },
  { value: 'finance', label: '금융', icon: '📈' },
  { value: 'lifestyle', label: '라이프', icon: '🏃' },
  { value: 'other', label: '기타', icon: '📦' },
]

const CITY_OPTIONS: SupportedCity[] = ['seoul', 'busan', 'daegu', 'incheon', 'daejeon', 'gwangju']

const ICON_SUGGESTIONS = ['🌤️', '📰', '📈', '🏃', '💼', '🎯', '📚', '🎨', '🎵', '🍳', '☕', '🌙']

// ==================== Zod Schema ====================

const digestCategories = ['weather', 'news', 'finance', 'lifestyle', 'other'] as const
const supportedCities = ['seoul', 'busan', 'daegu', 'incheon', 'daejeon', 'gwangju'] as const

const createDigestSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다.')
    .max(50, '이름은 50자 이하여야 합니다.'),
  slug: z
    .string()
    .min(2, '슬러그는 2자 이상이어야 합니다.')
    .max(30, '슬러그는 30자 이하여야 합니다.')
    .regex(/^[a-z0-9-]+$/, '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'),
  description: z
    .string()
    .min(10, '설명은 10자 이상이어야 합니다.')
    .max(200, '설명은 200자 이하여야 합니다.'),
  icon: z.string().min(1, '아이콘을 선택해주세요.'),
  category: z.enum(digestCategories, { required_error: '카테고리를 선택해주세요.' }),
  isPremium: z.boolean(),
  deliveryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '올바른 시간 형식이 아닙니다.'),
  cities: z.array(z.enum(supportedCities)),
}).refine(
  (data) => {
    // 날씨 카테고리일 때만 도시 필수
    if (data.category === 'weather') {
      return data.cities.length >= 1
    }
    return true
  },
  {
    message: '날씨 도시락은 최소 1개 도시를 선택해야 해요.',
    path: ['cities'],
  }
)

type CreateDigestFormData = z.infer<typeof createDigestSchema>

// ==================== Component ====================

export default function CreateLunchboxPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, getIdToken, user } = useAuth()

  // 관리자 여부 체크
  const isUserAdmin = isAdmin(user?.role)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDigestFormData>({
    resolver: zodResolver(createDigestSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '🌤️',
      category: 'weather',
      isPremium: false,
      deliveryTime: '07:00',
      cities: ['seoul'],
    },
    mode: 'onChange',
  })

  const watchName = watch('name')
  const watchSlug = watch('slug')
  const watchDescription = watch('description')
  const watchIcon = watch('icon')
  const watchCategory = watch('category')
  const watchIsPremium = watch('isPremium')
  const watchDeliveryTime = watch('deliveryTime')
  const watchCities = watch('cities')

  // ==================== Handlers ====================

  const handleCityToggle = (city: SupportedCity) => {
    const current = watchCities || []
    const updated = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city]
    setValue('cities', updated, { shouldValidate: true })
  }

  // 슬러그 자동 생성 (이름 기반)
  const generateSlug = () => {
    const slug = watchName
      .toLowerCase()
      .replace(/[가-힣]/g, '') // 한글 제거
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setValue('slug', slug, { shouldValidate: true })
  }

  const onSubmit = async (data: CreateDigestFormData) => {
    setIsSubmitting(true)

    try {
      const token = await getIdToken()

      const response = await fetch('/api/digests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description,
          icon: data.icon,
          category: data.category,
          isPremium: data.isPremium,
          config: {
            deliveryTime: data.deliveryTime,
            ...(data.category === 'weather' && { cities: data.cities }),
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '생성 실패')
      }

      toast.success('도시락이 생성되었어요!')
      router.push('/lunchbox')
    } catch (error) {
      console.error('Create error:', error)
      toast.error(error instanceof Error ? error.message : '도시락 생성에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== Render: Loading / Auth ====================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">로그인이 필요해요</h1>
          <p className="text-slate-500 mb-6">도시락을 만들려면 먼저 로그인해주세요.</p>
          <Link href="/login">
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 관리자만 접근 가능
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">관리자 전용 페이지예요</h1>
          <p className="text-slate-500 mb-6">도시락 생성은 관리자만 할 수 있어요.</p>
          <Link href="/lunchbox">
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
              도시락 목록으로
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ==================== Render: Form ====================

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/lunchbox"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">취소</span>
            </Link>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-slate-900">새 도시락 만들기</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">기본 정보</h2>

            {/* 아이콘 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                아이콘
              </label>
              <div className="flex flex-wrap gap-2">
                {ICON_SUGGESTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon, { shouldValidate: true })}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      watchIcon === icon
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              {errors.icon && (
                <p className="mt-1 text-xs text-red-500">{errors.icon.message}</p>
              )}
            </div>

            {/* 이름 */}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...field}
                    type="text"
                    onBlur={(e) => {
                      field.onBlur()
                      if (field.value && !watchSlug) {
                        generateSlug()
                      }
                    }}
                    placeholder="예: 날씨 도시락"
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                      fieldState.error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {fieldState.error ? (
                      <p className="text-xs text-red-500">{fieldState.error.message}</p>
                    ) : (
                      <p className="text-xs text-slate-400">도시락의 이름을 입력하세요</p>
                    )}
                    <p className="text-xs text-slate-400">{field.value?.length || 0}/50</p>
                  </div>
                </div>
              )}
            />

            {/* 슬러그 */}
            <Controller
              name="slug"
              control={control}
              render={({ field, fieldState }) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    슬러그 (URL) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">/lunchbox/</span>
                    <input
                      {...field}
                      type="text"
                      placeholder="weather"
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none ${
                        fieldState.error
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                      }`}
                    />
                  </div>
                  {fieldState.error ? (
                    <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">영문 소문자, 숫자, 하이픈만 사용</p>
                  )}
                </div>
              )}
            />

            {/* 설명 */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    설명 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="이 도시락이 어떤 정보를 제공하는지 설명해주세요."
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none resize-none ${
                      fieldState.error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {fieldState.error ? (
                      <p className="text-xs text-red-500">{fieldState.error.message}</p>
                    ) : (
                      <p className="text-xs text-slate-400">10자 이상 작성해주세요</p>
                    )}
                    <p className="text-xs text-slate-400">{field.value?.length || 0}/200</p>
                  </div>
                </div>
              )}
            />

            {/* 카테고리 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                카테고리
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      watchCategory === cat.value
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* 프리미엄 */}
            <Controller
              name="isPremium"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPremium" className="text-sm text-slate-700">
                    프리미엄 도시락으로 설정
                  </label>
                </div>
              )}
            />
          </div>

          {/* 배달 설정 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">배달 설정</h2>

            {/* 배달 시간 */}
            <Controller
              name="deliveryTime"
              control={control}
              render={({ field, fieldState }) => (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    배달 시간 (KST)
                  </label>
                  <input
                    {...field}
                    type="time"
                    className={`px-4 py-3 rounded-xl border transition-all outline-none ${
                      fieldState.error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                    }`}
                  />
                  {fieldState.error && (
                    <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {/* 날씨 카테고리: 도시 선택 */}
            {watchCategory === 'weather' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  포함할 도시 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITY_OPTIONS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCityToggle(city)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        watchCities?.includes(city)
                          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {CITY_NAMES[city]}
                    </button>
                  ))}
                </div>
                {errors.cities && (
                  <p className="mt-1 text-xs text-red-500">{errors.cities.message}</p>
                )}
              </div>
            )}
          </div>

          {/* 미리보기 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">미리보기</h2>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{watchIcon}</span>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {watchName || '도시락 이름'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {watchDescription || '도시락 설명이 여기에 표시됩니다.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{CATEGORY_NAMES[watchCategory]}</span>
                    <span>•</span>
                    <span>매일 {watchDeliveryTime} 배달</span>
                    {watchIsPremium && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600">프리미엄</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                도시락 만들기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
