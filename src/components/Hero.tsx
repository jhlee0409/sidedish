'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from './Button'

interface HeroProps {
  onExploreClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative pt-6 pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-6 relative z-10 text-center max-w-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm text-slate-600 mb-6 border border-slate-100 shadow-sm">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>새로운 프로젝트를 발견하세요</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-[1.2]">
          메이커들의{' '}
          <span className="text-orange-500">사이드 프로젝트</span>
        </h1>

        <p className="max-w-md mx-auto text-base text-slate-500 mb-8 leading-relaxed">
          흥미로운 프로젝트를 둘러보고, 마음에 드는 작품에 응원을 보내주세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="w-full sm:w-auto h-11 px-5 text-sm font-semibold rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            onClick={onExploreClick}
          >
            둘러보기
          </Button>
          <Link href="/menu/register">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 px-5 text-sm font-semibold rounded-full border-slate-200 hover:border-slate-300 hover:bg-white transition-colors"
            >
              내 프로젝트 등록
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
