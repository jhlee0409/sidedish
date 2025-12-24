'use client'

import Link from 'next/link'
import { ArrowRight, ChefHat, Flame } from 'lucide-react'
import Button from './Button'

interface HeroProps {
  onExploreClick: () => void
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Static gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/25 via-orange-600/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-transparent blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full text-sm text-white/80 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>사이드 프로젝트 쇼케이스</span>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-center text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          <span className="text-white">셰프들의</span>
          <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 bg-clip-text text-transparent"> 사이드디시</span>
        </h1>

        {/* Subtitle */}
        <p className="text-center max-w-xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
          개발자들이 만든 사이드 프로젝트를 발견하고,
          <br className="hidden sm:block" />
          영감을 얻고, 하트로 응원해주세요.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onExploreClick}
            className="w-full sm:w-auto h-12 px-6 text-base font-semibold rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25"
          >
            <Flame className="w-5 h-5 mr-2" />
            메뉴판 보기
          </Button>
          <Link href="/menu/register">
            <Button
              variant="ghost"
              className="w-full sm:w-auto h-12 px-6 text-base font-semibold rounded-full text-white/90 border border-white/20 hover:bg-white/10 transition-colors"
            >
              <ChefHat className="w-5 h-5 mr-2" />
              내 메뉴 등록
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">150+</div>
            <div className="text-sm text-slate-500">등록된 메뉴</div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">80+</div>
            <div className="text-sm text-slate-500">활동 셰프</div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">2.5K+</div>
            <div className="text-sm text-slate-500">누적 하트</div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}

export default Hero
