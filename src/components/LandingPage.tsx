'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles, MessageSquare, TrendingUp, Star, Zap, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Button from './Button'

const CACHE_KEY = 'sidedish_stats'
const CACHE_DURATION = 24 * 60 * 60 * 1000

interface CachedStats {
  chefCount: number
  menuCount: number
  cachedAt: number
}

// Featured project examples for social proof
const FEATURED_PROJECTS = [
  { title: 'Pomodoro Plus', tag: 'Productivity', gradient: 'from-rose-500 to-orange-500' },
  { title: 'DevLog', tag: 'Developer Tool', gradient: 'from-violet-500 to-purple-500' },
  { title: 'PixelCraft', tag: 'Design', gradient: 'from-cyan-500 to-blue-500' },
]

const LandingPage: React.FC = () => {
  const [chefCount, setChefCount] = useState<number | null>(null)
  const [menuCount, setMenuCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsedCache: CachedStats = JSON.parse(cached)
          const now = Date.now()
          if (now - parsedCache.cachedAt < CACHE_DURATION) {
            setChefCount(parsedCache.chefCount)
            setMenuCount(parsedCache.menuCount)
            return
          }
        }
      } catch {
        // Ignore localStorage errors
      }

      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setChefCount(data.chefCount)
          setMenuCount(data.menuCount)
          const cacheData: CachedStats = {
            chefCount: data.chefCount,
            menuCount: data.menuCount,
            cachedAt: Date.now(),
          }
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
        }
      } catch {
        // Keep showing nothing if fetch fails
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="container mx-auto px-6 pt-20 pb-16 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors group"
            >
              <Zap className="w-4 h-4 text-orange-500" />
              <span>AI가 3초 만에 프로젝트 소개글을 작성해드려요</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              사이드 프로젝트를
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                세상에 선보이세요
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed">
              서랍 속 프로젝트에 날개를 달아주세요.
              <br className="hidden sm:block" />
              메이커들이 만든 작품을 발견하고, 첫 번째 팬을 만나보세요.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link href="/menu/register">
                <Button className="h-12 px-6 text-base font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                  프로젝트 등록하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="h-12 px-6 text-base font-medium rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  둘러보기
                </Button>
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {chefCount ? chefCount.toLocaleString() : '—'}+
                </p>
                <p className="text-sm text-slate-500">메이커</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {menuCount ? menuCount.toLocaleString() : '—'}+
                </p>
                <p className="text-sm text-slate-500">프로젝트</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">100%</p>
                <p className="text-sm text-slate-500">무료</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
            <p className="text-sm font-medium text-slate-500">지금 주목받는 프로젝트</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
              {FEATURED_PROJECTS.map((project, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-slate-100 shrink-0"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${project.gradient}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{project.title}</p>
                    <p className="text-xs text-slate-400">{project.tag}</p>
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              >
                더보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-orange-500 mb-3">Why SideDish</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              만들기만 하세요, 나머지는 저희가
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Large Card - AI Writing */}
            <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm mb-6">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  AI 소개글 생성
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                  &ldquo;설명 못 하겠는데...&rdquo;
                  <br />
                  걱정 마세요
                </h3>
                <p className="text-slate-300 max-w-md leading-relaxed">
                  기능 명세만 입력하면 AI가 클릭을 부르는 매력적인 소개글로 바꿔드려요.
                  3초면 충분합니다.
                </p>
              </div>
              {/* Decorative code block */}
              <div className="absolute right-6 bottom-6 w-64 h-40 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-4 opacity-60 group-hover:opacity-80 transition-opacity hidden lg:block">
                <div className="flex gap-1.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-slate-600 rounded w-3/4" />
                  <div className="h-2 bg-orange-500/50 rounded w-full" />
                  <div className="h-2 bg-slate-600 rounded w-5/6" />
                  <div className="h-2 bg-slate-600 rounded w-2/3" />
                </div>
              </div>
            </div>

            {/* Small Card - Private Feedback */}
            <div className="md:col-span-2 bg-orange-500 rounded-2xl p-6 text-white">
              <MessageSquare className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">비밀 피드백</h3>
              <p className="text-orange-100 text-sm leading-relaxed">
                완벽하지 않아도 괜찮아요. 비공개 쪽지로 솔직한 피드백을 받아보세요.
              </p>
            </div>

            {/* Small Card - Discover */}
            <div className="md:col-span-2 bg-slate-100 rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">첫 번째 팬</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                혼자 간직하던 프로젝트가 모두의 최애 메뉴로. 팬을 만나보세요.
              </p>
            </div>

            {/* Medium Card - Community */}
            <div className="md:col-span-4 bg-slate-100 rounded-2xl p-6 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden relative"
                  >
                    <Image
                      src={`https://picsum.photos/seed/${i * 99}/100/100`}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">메이커 커뮤니티</h3>
                <p className="text-slate-500 text-sm">
                  {chefCount ? `${chefCount.toLocaleString()}명의 메이커가 함께하고 있어요` : '메이커들과 함께하세요'}
                </p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-1 text-sm text-slate-400">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <Star className="w-4 h-4 fill-slate-200 text-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/20 to-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Serve?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            서랍 속 사이드 프로젝트, 혼자만 쓰던 앱, 공개 못한 포트폴리오.
            <br className="hidden sm:block" />
            지금 바로 세상에 선보이세요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/menu/register">
              <Button className="h-12 px-8 text-base font-medium rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors">
                무료로 시작하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="h-12 px-8 text-base font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                프로젝트 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
