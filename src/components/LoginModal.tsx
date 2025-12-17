'use client'

import { X, ChefHat } from 'lucide-react'
import SocialLoginForm from './SocialLoginForm'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  if (!isOpen) return null

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

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
        <div className="bg-gradient-to-br from-orange-500 to-red-500 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ChefHat className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">SideDish 시작하기</h2>
              <p className="text-white/80 mt-1">나만의 사이드 프로젝트를 세상에 공개하세요</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <SocialLoginForm onSuccess={handleSuccess} showTermsLinks={false} />
        </div>
      </div>
    </div>
  )
}
