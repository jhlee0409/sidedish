'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MessageSquareMore, ArrowRight, Users, Lock, TrendingUp } from 'lucide-react'
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

const LandingPage: React.FC = () => {
  const [chefCount, setChefCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsedCache: CachedStats = JSON.parse(cached)
          const now = Date.now()
          if (now - parsedCache.cachedAt < CACHE_DURATION) {
            setChefCount(parsedCache.chefCount)
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

  const formatNumber = (num: number) => num.toLocaleString('ko-KR')

  return (
    <div className="w-full">
      {/* Hero Section - Clean, typography-focused */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 bg-slate-50">
        {/* Subtle background accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50/80 to-transparent" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/40 rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            {/* Minimal badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-10 text-sm font-medium text-slate-500 border border-slate-200 rounded-full bg-white">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              사이드 프로젝트 플랫폼
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8">
              만들었다면,
              <br />
              <span className="text-orange-500">세상에 내놓을 시간</span>
            </h1>

            <p className="max-w-xl text-lg sm:text-xl text-slate-600 leading-relaxed mb-12">
              사이드 프로젝트부터 포트폴리오까지.
              <br className="hidden sm:block" />
              AI가 당신의 작품을 가장 매력적으로 소개해드립니다.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/dashboard">
                <Button className="h-14 px-8 text-base font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  프로젝트 등록하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="h-14 px-8 text-base font-semibold rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  둘러보기
                </Button>
              </Link>
            </div>

            {chefCount !== null && chefCount >= 50 && (
              <div className="flex items-center gap-3 mt-12 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative">
                      <Image src={`https://picsum.photos/seed/${i * 123}/100/100`} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <span>{formatNumber(chefCount)}명의 메이커가 함께하고 있어요</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Props - Clean grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-16">
            <p className="text-sm font-medium text-orange-500 mb-3">Why SideDish</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              재료만 준비하세요,
              <br />
              플레이팅은 저희가 할게요
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 lg:p-10 relative overflow-hidden group">
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">글솜씨가 없어도 괜찮아요</h3>
                <p className="text-slate-600 leading-relaxed">
                  투박한 기획안이나 기능 명세만 입력하면, AI가 사람들의 클릭을 부르는 매력적인 소개글로 바꿔드립니다.
                </p>
              </div>
              <div className="absolute right-4 bottom-4 lg:right-8 lg:bottom-6 w-64 lg:w-80 h-48 rounded-xl overflow-hidden shadow-lg opacity-90 group-hover:opacity-100 transition-opacity">
                <Image src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&q=80&w=800" alt="AI Writing" fill className="object-cover" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-orange-500 rounded-2xl p-8 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquareMore className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">부담 없는 첫 공개</h3>
                <p className="text-orange-100 leading-relaxed">
                  완벽하지 않아도 괜찮아요. 비밀 쪽지로 안전하게 피드백 받고, 프로덕트를 발전시켜보세요.
                </p>
              </div>
              <Lock className="absolute -right-4 -bottom-4 w-24 h-24 text-orange-400/30" />
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">첫 번째 팬을 만나세요</h3>
                <p className="text-slate-400 leading-relaxed">
                  혼자 간직하던 프로젝트가 모두의 최애 메뉴로. 당신의 아이디어에 열광하는 팬들을 만나보세요.
                </p>
              </div>
            </div>

            {/* Card 4 - Stats */}
            <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 lg:p-10">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl lg:text-4xl font-bold text-slate-900">{chefCount ? formatNumber(chefCount) : '—'}+</p>
                  <p className="text-sm text-slate-500 mt-1">메이커</p>
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold text-slate-900">100%</p>
                  <p className="text-sm text-slate-500 mt-1">무료</p>
                </div>
                <div>
                  <p className="text-3xl lg:text-4xl font-bold text-slate-900">3초</p>
                  <p className="text-sm text-slate-500 mt-1">AI 소개글 생성</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Serve?
          </h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            서랍 속 사이드 프로젝트, 혼자만 쓰던 앱, 공개 못한 포트폴리오.
            <br className="hidden sm:block" />
            SideDish에서 첫 번째 팬을 만나보세요.
          </p>
          <Link href="/dashboard">
            <Button className="h-14 px-10 text-base font-semibold rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          {chefCount !== null && chefCount >= 50 && (
            <p className="mt-10 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {formatNumber(chefCount)}명의 메이커가 활동 중
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default LandingPage
