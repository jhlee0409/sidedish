'use client'

import React, { useState } from 'react'
import { MapPin, Loader2, RefreshCw, X } from 'lucide-react'
import { UserLocation } from '@/lib/digest-types'
import { getCurrentLocation } from '@/lib/geocoding'

interface LocationPickerProps {
  /** 현재 선택된 위치 */
  location?: UserLocation
  /** 위치 변경 콜백 */
  onLocationChange: (location: UserLocation) => void
  /** 닫기 콜백 (모달에서 사용) */
  onClose?: () => void
  /** 로딩 중 여부 */
  isLoading?: boolean
  /** 에러 메시지 */
  error?: string
}

export default function LocationPicker({
  location,
  onLocationChange,
  onClose,
  isLoading: externalLoading,
  error: externalError,
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetCurrentLocation = async () => {
    setIsLocating(true)
    setError(null)

    try {
      const location = await getCurrentLocation()
      onLocationChange(location)
    } catch (err) {
      const message = err instanceof Error ? err.message : '위치를 가져올 수 없습니다.'
      setError(message)
    } finally {
      setIsLocating(false)
    }
  }

  const isLoading = isLocating || externalLoading
  const displayError = error || externalError

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">내 위치 설정</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-white/80 text-sm mt-1">
          위치 정보로 정확한 날씨를 받아보세요
        </p>
      </div>

      <div className="p-6">
        {/* 현재 위치 표시 */}
        {location && (
          <div className="mb-4 p-4 bg-indigo-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium">현재 설정된 위치</p>
                  <p className="text-lg font-bold text-slate-900">{location.address}</p>
                </div>
              </div>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                title="위치 다시 가져오기"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* 위치 가져오기 버튼 */}
        {!location && (
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                위치를 가져오는 중...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                현재 위치 가져오기
              </>
            )}
          </button>
        )}

        {/* 에러 메시지 */}
        {displayError && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {displayError}
          </div>
        )}

        {/* 안내 문구 */}
        <div className="mt-4 text-sm text-slate-500">
          <p className="flex items-start gap-2">
            <span className="text-indigo-400">•</span>
            <span>위치 정보는 날씨 데이터 조회에만 사용됩니다.</span>
          </p>
          <p className="flex items-start gap-2 mt-1">
            <span className="text-indigo-400">•</span>
            <span>마이페이지에서 언제든지 위치를 변경할 수 있어요.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
