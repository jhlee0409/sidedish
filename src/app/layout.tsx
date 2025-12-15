import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

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
        <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
