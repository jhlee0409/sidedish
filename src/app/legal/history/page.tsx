'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, ExternalLink } from 'lucide-react'

interface VersionEntry {
  version: string
  date: string
  type: 'terms' | 'privacy'
  title: string
  description: string
  path: string
  isCurrent: boolean
}

const versionHistory: VersionEntry[] = [
  // 서비스 이용약관 버전
  {
    version: 'v1.0',
    date: '2025-12-25',
    type: 'terms',
    title: '서비스 이용약관',
    description: '최초 제정',
    path: '/legal/archive/terms-2025-12-25',
    isCurrent: true,
  },
  // 개인정보 처리방침 버전
  {
    version: 'v1.0',
    date: '2025-12-25',
    type: 'privacy',
    title: '개인정보 처리방침',
    description: '최초 제정',
    path: '/legal/archive/privacy-2025-12-25',
    isCurrent: true,
  },
]

const LegalHistoryPage: React.FC = () => {
  const termsVersions = versionHistory.filter(v => v.type === 'terms')
  const privacyVersions = versionHistory.filter(v => v.type === 'privacy')

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
          <h1 className="text-xl font-bold text-slate-900">약관 및 정책 버전 히스토리</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <p className="text-slate-600">
            SideDish의 서비스 이용약관 및 개인정보 처리방침의 모든 버전을 확인할 수 있습니다.
            각 버전은 해당 시점에 적용된 내용을 담고 있으며, 법적 증빙을 위해 보관됩니다.
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href="/legal/terms"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <FileText className="w-4 h-4" />
              현재 이용약관 보기
            </Link>
            <Link
              href="/legal/privacy"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Shield className="w-4 h-4" />
              현재 개인정보처리방침 보기
            </Link>
          </div>
        </div>

        {/* 서비스 이용약관 히스토리 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            서비스 이용약관 버전 히스토리
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">버전</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">시행일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">변경 내용</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {termsVersions.map((version, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{version.version}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{version.date}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{version.description}</td>
                    <td className="px-4 py-3">
                      {version.isCurrent ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          현재 적용 중
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          과거 버전
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={version.isCurrent ? '/legal/terms' : version.path}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        보기
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 개인정보 처리방침 히스토리 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            개인정보 처리방침 버전 히스토리
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">버전</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">시행일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">변경 내용</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">상태</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {privacyVersions.map((version, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{version.version}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{version.date}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{version.description}</td>
                    <td className="px-4 py-3">
                      {version.isCurrent ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          현재 적용 중
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          과거 버전
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={version.isCurrent ? '/legal/privacy' : version.path}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        보기
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 안내 박스 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">버전 관리 안내</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 약관 변경 시 변경 전 버전은 아카이브에 보관됩니다.</li>
            <li>• 회원이 동의한 시점의 약관 내용을 확인할 수 있습니다.</li>
            <li>• 법적 분쟁 시 증빙 자료로 활용됩니다.</li>
            <li>• 과거 버전의 약관은 참고용이며, 현재 서비스에는 최신 버전이 적용됩니다.</li>
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

export default LegalHistoryPage
