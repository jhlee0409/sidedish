'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, GitBranch, Calendar, ExternalLink } from 'lucide-react'

/**
 * 약관 변경 이력 타입
 *
 * 새 버전 추가 시:
 * 1. 이 배열에 새 항목 추가
 * 2. 현재 문서의 버전 번호 및 시행일 업데이트
 * 3. (선택) 중요 변경인 경우 /legal/archive/[type]-[date]/ 폴더에 이전 버전 보관
 */
interface VersionChange {
  version: string
  date: string
  type: 'terms' | 'privacy'
  summary: string
  changes: string[]
  isMajor?: boolean // 중요 변경 여부 (30일 사전 고지 필요)
}

// 버전 변경 이력 - 최신순 정렬
const changelog: VersionChange[] = [
  {
    version: 'v1.0',
    date: '2025-12-25',
    type: 'terms',
    summary: '최초 제정',
    changes: [
      '서비스 이용약관 최초 제정',
      '6개 장, 25개 조항 구성',
      'AI 콘텐츠 생성 서비스 조항 포함',
      '유료 서비스 및 환불 규정 포함',
      '3단계 분쟁해결 절차 명시',
    ],
    isMajor: true,
  },
  {
    version: 'v1.0',
    date: '2025-12-25',
    type: 'privacy',
    summary: '최초 제정',
    changes: [
      '개인정보 처리방침 최초 제정',
      '14개 조항 구성',
      '국외 이전 정보 명시 (Firebase, Vercel, Gemini AI)',
      'AI 서비스 관련 개인정보 처리 조항 포함',
      '권익침해 구제기관 안내 포함',
    ],
    isMajor: true,
  },
]

const LegalHistoryPage: React.FC = () => {
  const termsChanges = changelog.filter(c => c.type === 'terms')
  const privacyChanges = changelog.filter(c => c.type === 'privacy')

  // 현재 버전 정보
  const currentTerms = termsChanges[0]
  const currentPrivacy = privacyChanges[0]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">약관 변경 이력</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 안내 박스 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="font-semibold text-slate-900 mb-2">버전 관리 안내</h2>
          <p className="text-slate-600 text-sm mb-4">
            SideDish의 서비스 이용약관 및 개인정보 처리방침 변경 이력입니다.
            모든 변경사항은 Git을 통해 투명하게 관리되며, 중요 변경 시 30일 전 사전 고지합니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/legal/terms"
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              현재 이용약관 ({currentTerms?.version})
            </Link>
            <Link
              href="/legal/privacy"
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <Shield className="w-4 h-4" />
              현재 개인정보처리방침 ({currentPrivacy?.version})
            </Link>
          </div>
        </div>

        {/* 서비스 이용약관 변경 이력 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            서비스 이용약관
          </h2>
          <div className="space-y-4">
            {termsChanges.map((change, index) => (
              <ChangelogCard key={index} change={change} isLatest={index === 0} />
            ))}
          </div>
        </section>

        {/* 개인정보 처리방침 변경 이력 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            개인정보 처리방침
          </h2>
          <div className="space-y-4">
            {privacyChanges.map((change, index) => (
              <ChangelogCard key={index} change={change} isLatest={index === 0} />
            ))}
          </div>
        </section>

        {/* Git 기반 버전 관리 안내 */}
        <div className="bg-slate-800 text-white rounded-xl p-6">
          <div className="flex items-start gap-3">
            <GitBranch className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Git 기반 버전 관리</h3>
              <p className="text-slate-300 text-sm mb-3">
                SideDish는 GitHub와 마찬가지로 모든 법적 문서를 Git으로 관리합니다.
                커밋 히스토리를 통해 모든 변경 내역을 투명하게 확인할 수 있습니다.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• 모든 변경사항 자동 기록 및 추적</li>
                <li>• 변경 전/후 diff 비교 가능</li>
                <li>• 법적 증빙 자료로 활용 가능</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 변경 예고 정책 */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">변경 예고 정책</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• <strong>일반 변경</strong>: 시행 7일 전 서비스 내 공지</li>
            <li>• <strong>중요 변경</strong> (회원에게 불리한 변경): 시행 30일 전 공지 + 이메일 개별 통지</li>
            <li>• 변경된 약관에 동의하지 않는 경우 서비스 이용계약을 해지할 수 있습니다.</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2025 SideDish. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/legal/terms" className="hover:text-indigo-600">서비스 이용약관</Link>
            <span>|</span>
            <Link href="/legal/privacy" className="hover:text-indigo-600">개인정보 처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// 변경 이력 카드 컴포넌트
const ChangelogCard: React.FC<{ change: VersionChange; isLatest: boolean }> = ({ change, isLatest }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
            {change.version}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            {change.date}
          </div>
          {change.isMajor && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              중요 변경
            </span>
          )}
        </div>
        {isLatest && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            현재 적용 중
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium text-slate-900 mb-2">{change.summary}</p>
        <ul className="text-sm text-slate-600 space-y-1">
          {change.changes.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-slate-400 mt-1">•</span>
              {item}
            </li>
          ))}
        </ul>
        {isLatest && (
          <Link
            href={change.type === 'terms' ? '/legal/terms' : '/legal/privacy'}
            className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700"
          >
            전문 보기
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default LegalHistoryPage
