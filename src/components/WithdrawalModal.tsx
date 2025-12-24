'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2, ChevronDown, ChevronUp, ChefHat } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  withdrawalFullFormSchema,
  withdrawalFormDefaultValues,
  WITHDRAWAL_REASONS,
  INCONVENIENCE_OPTIONS,
  type WithdrawalFullFormData,
  type WithdrawalReason,
  type InconvenienceOption,
} from '@/lib/schemas'

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, feedback: string) => Promise<void>
  userName: string
}

type Step = 'notice' | 'reason' | 'feedback' | 'confirm'

export default function WithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: WithdrawalModalProps) {
  const [step, setStep] = useState<Step>('notice')
  const [showDataRetention, setShowDataRetention] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFullFormData>({
    resolver: zodResolver(withdrawalFullFormSchema),
    defaultValues: withdrawalFormDefaultValues,
    mode: 'onChange',
  })

  const selectedReason = watch('selectedReason')
  const customReason = watch('customReason')
  const selectedFeedback = watch('selectedFeedback')
  const confirmText = watch('confirmText')

  if (!isOpen) return null

  const handleClose = () => {
    setStep('notice')
    setShowDataRetention(false)
    setIsLoading(false)
    reset(withdrawalFormDefaultValues)
    onClose()
  }

  const handleConfirmSubmit = async () => {
    if (confirmText !== '탈퇴합니다') return

    setIsLoading(true)
    try {
      const reason = selectedReason === '기타' ? customReason || '' : selectedReason
      const customFeedbackText = watch('customFeedback') || ''
      const feedback = selectedFeedback.includes('직접 입력' as InconvenienceOption)
        ? [...selectedFeedback.filter(f => f !== '직접 입력'), customFeedbackText].join(', ')
        : selectedFeedback.join(', ')
      await onConfirm(reason, feedback)
      handleClose()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      setIsLoading(false)
    }
  }

  const toggleFeedback = (item: InconvenienceOption) => {
    const current = selectedFeedback || []
    if (current.includes(item)) {
      setValue('selectedFeedback', current.filter(f => f !== item))
    } else {
      setValue('selectedFeedback', [...current, item])
    }
  }

  const canProceedFromReason = selectedReason && (selectedReason !== '기타' || (customReason?.trim() || ''))

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">회원 탈퇴</h2>
            <span className="text-xs text-slate-400">
              {step === 'notice' && '1/4'}
              {step === 'reason' && '2/4'}
              {step === 'feedback' && '3/4'}
              {step === 'confirm' && '4/4'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{
              width:
                step === 'notice' ? '25%' :
                step === 'reason' ? '50%' :
                step === 'feedback' ? '75%' : '100%',
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Notice */}
          {step === 'notice' && (
            <div className="space-y-5">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">
                    탈퇴 전 꼭 확인해주세요
                  </p>
                  <p className="text-amber-700">
                    탈퇴 시 등록하신 메뉴와 활동 내역이 삭제되며, 복구가 불가능합니다.
                  </p>
                </div>
              </div>

              {/* What gets deleted */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">삭제되는 정보</h3>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    등록한 프로젝트(메뉴) 및 이미지
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    작성한 댓글 및 귓속말
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    찜 및 리액션 기록
                  </li>
                </ul>
              </div>

              {/* Data retention notice - collapsible */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDataRetention(!showDataRetention)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">
                    개인정보 보관 안내
                  </span>
                  {showDataRetention ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {showDataRetention && (
                  <div className="px-4 py-3 text-xs text-slate-600 space-y-2 bg-white">
                    <p>
                      관계 법령에 따라 일부 정보는 탈퇴 후에도 일정 기간 보관됩니다.
                    </p>
                    <ul className="space-y-1 text-slate-500">
                      <li>
                        • <span className="font-medium">계정 식별 정보</span> (이메일, 닉네임): 부정 이용 방지 목적으로 <span className="text-slate-700 font-medium">1년간</span> 보관
                      </li>
                      <li>
                        • <span className="font-medium">접속 기록</span>: 통신비밀보호법에 따라 <span className="text-slate-700 font-medium">3개월간</span> 보관
                      </li>
                    </ul>
                    <p className="text-slate-400 pt-1">
                      보관 기간 경과 후 지체 없이 파기됩니다.
                    </p>
                  </div>
                )}
              </div>

              {/* Re-registration notice */}
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">
                  탈퇴 후 <span className="font-semibold text-slate-700">30일간</span> 동일 계정으로 재가입이 제한됩니다.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-3 border border-slate-300 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  다음으로
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
                >
                  계속 이용하기
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Reason */}
          {step === 'reason' && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  떠나시는 이유가 궁금해요
                </h3>
                <p className="text-sm text-slate-500">
                  서비스 개선에 소중한 자료가 됩니다
                </p>
              </div>

              <Controller
                name="selectedReason"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {WITHDRAWAL_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          field.value === reason
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={field.value === reason}
                          onChange={() => field.onChange(reason)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            field.value === reason
                              ? 'border-orange-500'
                              : 'border-slate-300'
                          }`}
                        >
                          {field.value === reason && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                )}
              />

              {selectedReason === '기타' && (
                <Controller
                  name="customReason"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="탈퇴 사유를 입력해주세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none"
                      rows={3}
                      maxLength={200}
                    />
                  )}
                />
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('notice')}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  이전
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  취소
                </button>
                <button
                  onClick={() => setStep('feedback')}
                  disabled={!canProceedFromReason}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Feedback */}
          {step === 'feedback' && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  어떤 점이 불편하셨나요?
                </h3>
                <p className="text-sm text-slate-500">
                  여러 개 선택 가능해요 (선택사항)
                </p>
              </div>

              <div className="space-y-2">
                {INCONVENIENCE_OPTIONS.map((item) => (
                  <label
                    key={item}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedFeedback?.includes(item)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeedback?.includes(item) || false}
                      onChange={() => toggleFeedback(item)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedFeedback?.includes(item)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedFeedback?.includes(item) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </div>

              {selectedFeedback?.includes('직접 입력' as InconvenienceOption) && (
                <Controller
                  name="customFeedback"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="구체적인 의견을 남겨주세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                  )}
                />
              )}

              {/* Retention offer */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">잠깐만요!</p>
                    <p className="text-xs text-slate-500">아직 SideDish의 모든 기능을 사용해보지 않으셨을 수도 있어요</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  한 번 더 사용해볼게요
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  이전
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-3 border border-slate-200 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  그래도 탈퇴할게요
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Final Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* Final warning */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  정말 탈퇴하시겠습니까?
                </h3>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{userName}</span>님의 모든 데이터가 삭제됩니다.
                  <br />
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>

              {/* Confirmation input */}
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  탈퇴를 확인하려면 아래에 <span className="font-bold text-red-600">&quot;탈퇴합니다&quot;</span>를 입력해주세요.
                </p>
                <Controller
                  name="confirmText"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="탈퇴합니다"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                    />
                  )}
                />
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  계속 이용하기
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('feedback')}
                    className="flex-1 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={confirmText !== '탈퇴합니다' || isLoading}
                    className="flex-1 py-2.5 text-sm text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        처리 중
                      </>
                    ) : (
                      '탈퇴하기'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
