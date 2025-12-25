'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, ExternalLink } from 'lucide-react'
import {
  TERMS_DOCUMENT,
  PRIVACY_DOCUMENT,
  LegalVersion,
  getChangeTypeBadgeStyle,
  getChangeTypeLabel,
} from '@/lib/legal-versions'

/**
 * 약관 변경 이력 페이지
 *
 * 법적 요구사항:
 * - 이전 버전 확인 가능하도록 변경 이력 공개 필수
 * - 신구대비표 제공 권장
 *
 * @see 개인정보보호법 제30조
 */
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
        <p className="text-slate-500 mb-4">
          서비스 이용약관 및 개인정보 처리방침의 변경 내역입니다.
        </p>

        {/* 법적 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-12">
          <h3 className="font-medium text-blue-900 mb-2">변경 고지 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>일반 변경:</strong> 시행 7일 전 공지사항을 통해 고지</li>
            <li>• <strong>중요 변경:</strong> 시행 30일 전 공지 및 개별 통지 (수집/이용/제3자 제공 등)</li>
            <li>• 변경에 동의하지 않으실 경우 서비스 이용계약을 해지할 수 있습니다.</li>
          </ul>
        </div>

        {/* 서비스 이용약관 */}
        <DocumentHistorySection
          document={TERMS_DOCUMENT}
          icon={<FileText className="w-5 h-5" />}
          linkPath="/legal/terms"
        />

        {/* 개인정보 처리방침 */}
        <DocumentHistorySection
          document={PRIVACY_DOCUMENT}
          icon={<Shield className="w-5 h-5" />}
          linkPath="/legal/privacy"
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-slate-500">
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

// ==================== Sub Components ====================

interface DocumentHistorySectionProps {
  document: {
    title: string
    type: 'terms' | 'privacy'
    versions: LegalVersion[]
  }
  icon: React.ReactNode
  linkPath: string
}

function DocumentHistorySection({ document, icon, linkPath }: DocumentHistorySectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{icon}</span>
          <h2 className="text-lg font-medium text-slate-900">{document.title}</h2>
        </div>
        <Link
          href={linkPath}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          현재 문서 보기
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">시행일</div>
          <div className="col-span-2">버전</div>
          <div className="col-span-4">변경 내용</div>
          <div className="col-span-3">변경 유형</div>
        </div>

        {/* 테이블 바디 */}
        <div className="divide-y divide-slate-100">
          {document.versions.map((version, index) => (
            <VersionRow
              key={`${document.type}-${version.version}`}
              version={version}
              isLatest={index === 0}
            />
          ))}
        </div>
      </div>

      {/* 신구대비표 안내 (변경 내역이 있는 경우) */}
      {document.versions.some(v => v.changes && v.changes.length > 0) && (
        <p className="mt-3 text-xs text-slate-500">
          * 상세 변경 내역(신구대비표)은 각 버전 행을 클릭하여 확인할 수 있습니다.
        </p>
      )}
    </section>
  )
}

interface VersionRowProps {
  version: LegalVersion
  isLatest: boolean
}

function VersionRow({ version, isLatest }: VersionRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasChanges = version.changes && version.changes.length > 0

  return (
    <>
      <div
        className={`px-4 py-4 grid grid-cols-12 gap-4 items-center text-sm ${
          hasChanges ? 'cursor-pointer hover:bg-slate-50' : ''
        } ${isLatest ? 'bg-indigo-50/50' : ''}`}
        onClick={() => hasChanges && setIsExpanded(!isExpanded)}
      >
        <div className="col-span-3 text-slate-600 tabular-nums font-medium">
          {version.effectiveDate}
        </div>
        <div className="col-span-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            isLatest ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            v{version.version}
            {isLatest && <span className="text-[10px]">현재</span>}
          </span>
        </div>
        <div className="col-span-4 text-slate-700">
          {version.summary}
          {hasChanges && (
            <span className="ml-1 text-indigo-500 text-xs">
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
        </div>
        <div className="col-span-3">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getChangeTypeBadgeStyle(version.changeType)}`}>
            {getChangeTypeLabel(version.changeType)}
          </span>
        </div>
      </div>

      {/* 신구대비표 (확장 시) */}
      {isExpanded && hasChanges && (
        <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wider">
            신구대비표
          </h4>
          <div className="space-y-3">
            {version.changes!.map((change, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 bg-slate-100 text-xs font-medium text-slate-700">
                  {change.section}
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">변경 전</div>
                    <div className="text-xs text-slate-600">
                      {change.before || <span className="text-slate-400 italic">(신설)</span>}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50/50">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">변경 후</div>
                    <div className="text-xs text-slate-600">{change.after}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
