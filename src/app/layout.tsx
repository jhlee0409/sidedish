import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'SideDish - 메이커가 요리한 맛있는 사이드 프로젝트',
  description: '개발은 당신이, 플레이팅은 AI가. 하드디스크 속 잠든 코드를 세상 밖 메인 디시로 만들어주는 사이드 프로젝트 맛집입니다.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard - 한글 본문 폰트 (가변 폰트) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Gowun Batang - 랜딩 헤드라인용 한글 세리프 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
