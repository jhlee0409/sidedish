'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import { DigestCategory, SupportedCity, CATEGORY_NAMES, CITY_NAMES } from '@/lib/digest-types'
import { isAdmin } from '@/lib/admin-constants'

const CATEGORY_OPTIONS: { value: DigestCategory; label: string; icon: string }[] = [
  { value: 'weather', label: '날씨', icon: '🌤️' },
  { value: 'news', label: '뉴스', icon: '📰' },
  { value: 'finance', label: '금융', icon: '📈' },
  { value: 'lifestyle', label: '라이프', icon: '🏃' },
  { value: 'other', label: '기타', icon: '📦' },
]

const CITY_OPTIONS: SupportedCity[] = ['seoul', 'busan', 'daegu', 'incheon', 'daejeon', 'gwangju']

const ICON_SUGGESTIONS = ['🌤️', '📰', '📈', '🏃', '💼', '🎯', '📚', '🎨', '🎵', '🍳', '☕', '🌙']

export default function CreateLunchboxPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, getIdToken, user } = useAuth()

  // 관리자 여부 체크
  const isUserAdmin = isAdmin(user?.role)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🌤️',
    category: 'weather' as DigestCategory,
    isPremium: false,
    deliveryTime: '07:00',
    cities: ['seoul'] as SupportedCity[],
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCityToggle = (city: SupportedCity) => {
    setFormData((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.slug || !formData.description) {
      toast.error('필수 항목을 모두 입력해주세요.')
      return
    }

    if (formData.category === 'weather' && formData.cities.length === 0) {
      toast.error('날씨 도시락은 최소 1개 도시를 선택해야 해요.')
      return
    }

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
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          icon: formData.icon,
          category: formData.category,
          isPremium: formData.isPremium,
          config: {
            deliveryTime: formData.deliveryTime,
            ...(formData.category === 'weather' && { cities: formData.cities }),
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

  // 슬러그 자동 생성 (이름 기반)
  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData((prev) => ({ ...prev, slug }))
  }

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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* 이름 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={generateSlug}
                placeholder="예: 날씨 도시락"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            {/* 슬러그 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                슬러그 (URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">/lunchbox/</span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="weather"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* 설명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="이 도시락이 어떤 정보를 제공하는지 설명해주세요."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
              />
            </div>

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
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 프리미엄 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isPremium"
                id="isPremium"
                checked={formData.isPremium}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPremium" className="text-sm text-slate-700">
                프리미엄 도시락으로 설정
              </label>
            </div>
          </div>

          {/* 배달 설정 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">배달 설정</h2>

            {/* 배달 시간 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                배달 시간 (KST)
              </label>
              <input
                type="time"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleInputChange}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            {/* 날씨 카테고리: 도시 선택 */}
            {formData.category === 'weather' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  포함할 도시
                </label>
                <div className="flex flex-wrap gap-2">
                  {CITY_OPTIONS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCityToggle(city)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.cities.includes(city)
                          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {CITY_NAMES[city]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 미리보기 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">미리보기</h2>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{formData.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {formData.name || '도시락 이름'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {formData.description || '도시락 설명이 여기에 표시됩니다.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{CATEGORY_NAMES[formData.category]}</span>
                    <span>•</span>
                    <span>매일 {formData.deliveryTime} 배달</span>
                    {formData.isPremium && (
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
