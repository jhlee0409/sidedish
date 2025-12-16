'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Button from './Button'

interface HeroProps {
  onExploreClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />

      <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.15]">
          오늘은 어떤{' '}
          <span className="text-orange-500">프로젝트</span>를
          <br className="hidden sm:block" />
          찾으시나요?
        </h1>

        <p className="max-w-xl mx-auto text-base md:text-lg text-slate-500 mb-10 leading-relaxed">
          메이커들의 사이드 프로젝트를 둘러보고,
          <br className="hidden md:block" />
          솔직한 피드백을 남겨주세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            onClick={onExploreClick}
          >
            프로젝트 둘러보기
          </Button>
          <Link href="/menu/register">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
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
