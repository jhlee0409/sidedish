'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MessageSquareMore, ArrowRight, TrendingUp, ChefHat, Users, Lock, Zap, MousePointerClick } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Button from './Button'

const CACHE_KEY = 'sidedish_stats'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms

interface CachedStats {
  chefCount: number
  menuCount: number
  cachedAt: number
}

const LandingPage: React.FC = () => {
  const [chefCount, setChefCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      // Check localStorage cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsedCache: CachedStats = JSON.parse(cached)
          const now = Date.now()

          // If cache is still valid (within 24 hours), use it
          if (now - parsedCache.cachedAt < CACHE_DURATION) {
            setChefCount(parsedCache.chefCount)
            return
          }
        }
      } catch {
        // Ignore localStorage errors
      }

      // Fetch fresh data from API
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setChefCount(data.chefCount)

          // Cache the result
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

  // Format number with commas (e.g., 2400 -> 2,400)
  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR')
  }

  return (
    <div className="w-full overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden bg-[#F8FAFC]">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px]" />
          <div className="absolute top-[20%] right-[5%] w-[300px] h-[300px] bg-red-100/40 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-orange-100 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-700">2025 New Season Open</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            상상만 했던 아이디어,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 animate-gradient-x bg-[length:200%_auto]">
              세상 밖으로
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            노코드 툴로 만든 앱부터 노션 기획안까지.<br className="hidden md:block" />
            AI 수석 셰프가 당신의 프로젝트를 가장 맛있는 <span className="text-slate-900 font-bold">&apos;메인 요리&apos;</span>로 소개해드립니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <Link href="/dashboard">
              <Button
                className="w-full sm:w-auto h-16 px-10 text-xl rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="mr-2">내 프로젝트 무료로 등록하기</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            {chefCount !== null && chefCount >= 50 && (
              <div className="flex -space-x-4 items-center px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/50">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden relative">
                    <Image src={`https://picsum.photos/seed/${i * 123}/100/100`} alt="user" fill className="object-cover" />
                  </div>
                ))}
                <span className="pl-6 text-sm font-semibold text-slate-600">
                  +{formatNumber(chefCount)}명의 메이커들
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Target Audience (Ticker) */}
      <div className="w-full bg-slate-50 border-y border-slate-100 py-12 overflow-hidden">
        <div className="container mx-auto px-4 mb-8 text-center">
          <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">For Every Creator</p>
        </div>
        <div className="flex justify-center gap-4 md:gap-16 flex-wrap px-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {['No-code Maker', 'Content Creator', 'PM & Planner', 'Designer', 'Indie Hacker', 'Student', 'Marketer'].map((role, idx) => (
            <span key={idx} className="text-xl md:text-3xl font-bold text-slate-300 select-none">
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Value Proposition (Bento Grid) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              재료만 준비하세요,<br />
              <span className="text-orange-600">플레이팅은 저희가 할게요</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              만들기도 바쁜데 홍보글까지 고민하지 마세요.<br />
              SideDish는 메이커가 오직 창작에만 집중할 수 있는 환경을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">

            {/* Card 1: AI Writing (Large Left) */}
            <div className="md:col-span-2 bg-[#F8FAFC] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100">
              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-orange-500">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">글솜씨가 없어도 괜찮아요</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  &quot;기능은 좋은데, 설명을 못 하겠네...&quot;<br />
                  걱정 마세요. 투박한 기획안이나 기능 명세만 입력하면, AI가 <span className="font-bold text-slate-900">사람들의 클릭을 부르는 매력적인 소개글</span>로 바꿔드립니다.
                </p>
              </div>
              <div className="absolute right-[-20px] bottom-[-40px] md:right-[-50px] md:bottom-[-50px] w-80 md:w-96 shadow-2xl rounded-xl overflow-hidden border-4 border-white/50 rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 relative h-60">
                <Image src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&q=80&w=800" alt="AI Writing UI" fill className="object-cover" />
              </div>
            </div>

            {/* Card 2: Feedback (Right Top) */}
            <div className="bg-orange-500 text-white rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group hover:bg-orange-600 transition-colors duration-300">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquareMore className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">두려움 없는 아이디어 검증</h3>
                <p className="text-orange-100 leading-relaxed">
                  완벽하지 않아도 시작할 수 있어요. 초기 아이디어 단계라도 괜찮습니다. <span className="font-bold text-white">비밀 쪽지</span>로 안전하게 피드백을 받고, 프로덕트를 점차 발전시켜보세요.
                </p>
              </div>
              <Lock className="absolute -right-6 -bottom-6 w-32 h-32 text-orange-400/30 group-hover:rotate-12 transition-transform duration-500" />
            </div>

            {/* Card 3: Discovery (Right Bottom) */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">당신의 첫 번째 팬을 만나세요</h3>
                <p className="text-slate-400 leading-relaxed">
                  혼자 간직하던 프로젝트가 모두의 &apos;최애 메뉴&apos;로. 단순한 조회수를 넘어, 당신의 아이디어에 열광하는 <span className="text-yellow-400 font-bold">찐팬(Fan)</span>들을 가장 먼저 만나보세요.
                </p>
              </div>
              <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-800 group-hover:text-yellow-500/20 group-hover:scale-110 transition-all duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Details (Tabs / Grid) */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full blur-[80px] opacity-60"></div>
              <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-slate-100 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                {/* Mock UI for Project Card */}
                <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" fill className="object-cover" alt="Project" />
                  <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <ChefHat className="w-3 h-3 text-orange-500" />
                    Minji Chef
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-50 rounded-full w-full"></div>
                  <div className="h-4 bg-slate-50 rounded-full w-2/3"></div>
                </div>
                <div className="mt-6 flex gap-2">
                  <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">React</div>
                  <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold">TypeScript</div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-8">
              <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                Detail View
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                디자이너 없이도,<br />
                전문가처럼 보여집니다
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                복잡한 디자인 작업 없이도 <span className="font-bold text-slate-900">프로페셔널한 프로젝트 페이지</span>가 완성됩니다.
                앱스토어 링크, 웹사이트, 노션 페이지, 유튜브 영상까지.
                어떤 링크든 멋지게 소개해드립니다.
              </p>
              <ul className="space-y-4">
                {[
                  '어떤 링크든 OK - 노션, 피그마, 유튜브까지',
                  '모바일에서 가장 예쁘게 보이는 반응형 디자인',
                  '실시간 반응으로 팬들과 소통하는 리액션 시스템'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <MousePointerClick className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
            Ready to Serve?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            머릿속에만 있던 아이디어, 노션에 적어둔 기획안, 완성하지 못한 프로젝트.<br />
            SideDish에서 세상과 연결되는 첫 번째 순간을 만들어보세요.
          </p>
          <Link href="/dashboard">
            <Button
              className="h-16 px-12 text-xl rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all duration-300"
            >
              내 프로젝트 무료로 등록하기
            </Button>
          </Link>
          {chefCount !== null && chefCount >= 50 && (
            <p className="mt-8 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              지금 <span className="text-white font-bold">{formatNumber(chefCount)}명</span>의 메이커가 활동 중입니다
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default LandingPage
