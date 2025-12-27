'use client'

import { useState } from 'react'
import { RefreshCw, LogOut, AlertCircle } from 'lucide-react'
import Button from './Button'
import { WithdrawnAccountInfo } from '@/contexts/AuthContext'

interface ReactivateAccountModalProps {
  isOpen: boolean
  withdrawnInfo: WithdrawnAccountInfo
  onReactivate: () => Promise<void>
  onDismiss: () => Promise<void>
}

export default function ReactivateAccountModal({
  isOpen,
  withdrawnInfo,
  onReactivate,
  onDismiss,
}: ReactivateAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleReactivate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await onReactivate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '계정 복구에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async () => {
    try {
      setIsLoading(true)
      await onDismiss()
    } finally {
      setIsLoading(false)
    }
  }

  const withdrawnDate = new Date(withdrawnInfo.withdrawnAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - 클릭해도 닫히지 않음 (선택 필수) */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            계정을 복구하시겠어요?
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              {withdrawnDate}에 탈퇴한 계정입니다.
            </p>
            <p className="text-slate-900 font-medium mt-2">
              남은 복구 기간: <span className="text-orange-500">{withdrawnInfo.daysRemaining}일</span>
            </p>
          </div>

          <ul className="text-sm text-slate-500 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>계정을 복구하면 프로필을 다시 설정해야 합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>기존에 등록한 프로젝트와 댓글은 유지됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>복구하지 않으면 {withdrawnInfo.daysRemaining}일 후 데이터가 영구 삭제됩니다.</span>
            </li>
          </ul>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-6 pb-6">
          <Button
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
            onClick={handleReactivate}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              '계정 복구하기'
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full py-3 rounded-xl text-slate-500"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            복구하지 않고 로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
