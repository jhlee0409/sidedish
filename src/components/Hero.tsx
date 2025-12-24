'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from './Button'

interface HeroProps {
  onExploreClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative pt-4 pb-8 sm:pt-6 sm:pb-10 lg:pt-8 lg:pb-12 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 relative z-10 text-center max-w-xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white rounded-full text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5 border border-slate-100 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
          <span>오늘의 메뉴가 도착했어요</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 sm:mb-4 leading-[1.2]">
          셰프들의{' '}
          <span className="text-orange-500">시그니처 메뉴</span>
        </h1>

        <p className="max-w-sm mx-auto text-sm sm:text-base text-slate-500 mb-5 sm:mb-6 leading-relaxed">
          갓 나온 프로젝트들, 구경하고 마음에 들면 하트 눌러주세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Button
            className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            onClick={onExploreClick}
          >
            메뉴판 보기
          </Button>
          <Link href="/menu/register" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-full border-slate-200 hover:border-slate-300 hover:bg-white transition-colors"
            >
              내 요리 등록
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
