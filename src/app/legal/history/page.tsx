'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * 약관 변경 이력
 * - 새 버전 추가 시 이 배열 상단에 추가
 * - 현재 문서의 버전/시행일도 함께 업데이트
 */
const termsHistory = [
  { date: '2025.12.25', version: '1.0', note: '최초 제정' },
]

const privacyHistory = [
  { date: '2025.12.25', version: '1.0', note: '최초 제정' },
]

export default function LegalHistoryPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          약관 및 정책 변경 이력
        </h1>
        <p className="text-slate-500 mb-12">
          서비스 이용약관 및 개인정보 처리방침의 변경 내역입니다.
        </p>

        {/* 서비스 이용약관 */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">서비스 이용약관</h2>
            <Link href="/legal/terms" className="text-sm text-slate-500 hover:text-slate-900">
              현재 약관 보기
            </Link>
          </div>
          <div className="border-t border-slate-200">
            {termsHistory.map((item, i) => (
              <div
                key={i}
                className="flex items-baseline py-3 border-b border-slate-100 last:border-b-0"
              >
                <span className="w-28 text-sm text-slate-400 tabular-nums">{item.date}</span>
                <span className="w-12 text-sm text-slate-400">v{item.version}</span>
                <span className="text-sm text-slate-700">{item.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 개인정보 처리방침 */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">개인정보 처리방침</h2>
            <Link href="/legal/privacy" className="text-sm text-slate-500 hover:text-slate-900">
              현재 방침 보기
            </Link>
          </div>
          <div className="border-t border-slate-200">
            {privacyHistory.map((item, i) => (
              <div
                key={i}
                className="flex items-baseline py-3 border-b border-slate-100 last:border-b-0"
              >
                <span className="w-28 text-sm text-slate-400 tabular-nums">{item.date}</span>
                <span className="w-12 text-sm text-slate-400">v{item.version}</span>
                <span className="text-sm text-slate-700">{item.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 안내 */}
        <p className="text-xs text-slate-400 leading-relaxed">
          약관 변경 시 시행 7일 전 공지하며, 회원에게 불리한 변경은 30일 전 개별 통지합니다.
          변경에 동의하지 않으실 경우 서비스 이용계약을 해지할 수 있습니다.
        </p>
      </main>
    </div>
  )
}
