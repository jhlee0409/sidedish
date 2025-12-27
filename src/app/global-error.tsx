'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              문제가 발생했어요
            </h1>
            <p className="text-slate-600 mb-6">
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
        {/* This is the default Next.js error component but it doesn't allow omitting the statusCode property yet. */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <NextError statusCode={undefined as any} />
      </body>
    </html>
  )
}
