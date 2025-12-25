'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles, MessageSquare, Heart, ExternalLink, Share2 } from 'lucide-react'
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
  const [menuCount, setMenuCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsedCache: CachedStats = JSON.parse(cached)
          if (Date.now() - parsedCache.cachedAt < CACHE_DURATION) {
            setChefCount(parsedCache.chefCount)
            setMenuCount(parsedCache.menuCount)
            return
          }
        }
      } catch { /* ignore */ }

      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setChefCount(data.chefCount)
          setMenuCount(data.menuCount)
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            chefCount: data.chefCount,
            menuCount: data.menuCount,
            cachedAt: Date.now(),
          }))
        }
      } catch { /* ignore */ }
    }
    fetchStats()
  }, [])

  return (
    <div className="w-full">
      {/* Hero - Warm orange gradient */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-orange-50 via-orange-100/50 to-amber-50 overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 pt-16 pb-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left: Copy */}
              <div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.15] mb-6">
                  당신의 사이드,
                  <br />
                  오늘의 <span className="text-orange-600">메인 디쉬</span>로
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
                  만들기 쉬워진 시대, 올리기도 편해야죠.<br />
                  여기선 여러분의 프로젝트가 오늘의 메뉴가 돼요.<br />
                  소개글? 재료만 주면 AI가 써드릴게요.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/menu/register">
                    <Button className="h-12 px-6 text-base font-semibold rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/25">
                      메뉴판에 올리기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="h-12 px-6 text-base font-semibold rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                    >
                      오늘의 메뉴 보기
                    </Button>
                  </Link>
                </div>

                {/* Mini stats */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>AI 레시피 작성</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>귓속말</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Share2 className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>자동 홍보</span>
                  </div>
                </div>
              </div>

              {/* Right: Visual - Stacked cards */}
              <div className="relative lg:pl-8">
                <div className="relative">
                  {/* Background card */}
                  <div className="absolute top-4 -left-4 w-full h-full bg-orange-200/50 rounded-2xl rotate-[-3deg]" />

                  {/* Main card mockup */}
                  <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-100">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full max-w-[200px]" />
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Project card preview */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-xl shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-slate-200 rounded w-full mb-1" />
                            <div className="h-3 bg-slate-200 rounded w-2/3" />
                          </div>
                        </div>
                      </div>

                      {/* AI generation preview */}
                      <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/50">
                        <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-3">
                          <Sparkles className="w-4 h-4" />
                          AI가 작성 중...
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-orange-200/50 rounded w-full" />
                          <div className="h-3 bg-orange-200/50 rounded w-5/6" />
                          <div className="h-3 bg-orange-200/50 rounded w-4/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">{menuCount ? menuCount.toLocaleString() : '—'}+</p>
              <p className="text-sm text-slate-500">오늘의 메뉴</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-slate-900">{chefCount ? chefCount.toLocaleString() : '—'}+</p>
              <p className="text-sm text-slate-500">사이드 셰프</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-orange-600">3초</p>
              <p className="text-sm text-slate-500">레시피 완성</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Conversational style */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Feature 1 */}
          <div className="mb-16 sm:mb-24 lg:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="text-orange-600 font-semibold text-sm mb-4 block">재료만 던져주세요</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  &ldquo;만들긴 했는데<br />
                  소개글은 영...&rdquo;
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  대충 적은 메모 던져주세요. AI가 읽고 싶은 글로 바꿔놓을게요.
                  만드느라 바빴잖아요, 글까지 잘 쓸 필요 없어요.
                </p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  AI 레시피 작성
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <p className="text-slate-500">// 재료: &quot;가계부 앱, 영수증 찍으면 자동 입력, 월별 리포트&quot;</p>
                  <p className="text-orange-400">↓ 조리 중...</p>
                  <p className="text-emerald-400">🍽️ 영수증 찍으면 가계부 끝.
                  매달 어디에 새는지, 리포트로 한눈에 보여드려요.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mb-16 sm:mb-24 lg:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-orange-50 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                      <p className="text-sm text-slate-600">
                        &ldquo;온보딩이 좀 긴 것 같아요.
                        3단계면 충분할 듯! 화이팅이에요 🔥&rdquo;
                      </p>
                      <p className="text-xs text-slate-400 mt-2">익명의 손님</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-600 font-medium pl-13">귓속말이 도착했어요</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-orange-600 font-semibold text-sm mb-4 block">반쯤 익어도 괜찮아요</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  완성 안 했어도 OK.<br />
                  맛보기 버전도 환영해요.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  &ldquo;아직 부족한데...&rdquo; 싶어도 일단 올려보세요.
                  귓속말로 솔직한 시식평을 받아볼 수 있어요.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="mb-16 sm:mb-24 lg:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="text-orange-600 font-semibold text-sm mb-4 block">단골손님을 만나요</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  혼자 먹기 아까운 요리,<br />
                  누군가의 최애 메뉴가 돼요
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  &ldquo;이런 게 있었어?&rdquo; 하고 눈이 번쩍 뜨이는 사람,
                  분명 어딘가에 있어요.
                </p>
              </div>
              <div className="relative">
                <div className="flex flex-col gap-3">
                  {[
                    { emoji: '👨‍💻', bg: 'from-blue-400 to-indigo-500', comment: '와 이거 딱 필요했는데', likes: 24 },
                    { emoji: '🧑‍🍳', bg: 'from-orange-400 to-rose-500', comment: 'UI 진짜 깔끔하다 👏', likes: 18 },
                    { emoji: '🦊', bg: 'from-amber-400 to-orange-500', comment: '어떻게 만드신 거예요?', likes: 12 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4"
                      style={{ transform: `translateX(${idx * 12}px)` }}
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.bg} flex items-center justify-center shrink-0`}>
                        <span className="text-lg">{item.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">익명의 손님</p>
                        <p className="text-sm text-slate-500 truncate">{item.comment}</p>
                      </div>
                      <div className="flex items-center gap-1 text-rose-500 text-sm shrink-0">
                        <Heart className="w-4 h-4 fill-current" />
                        {item.likes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4 - Social Media Promotion */}
          <div>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mb-4">
                    <Share2 className="w-4 h-4" />
                    자동 홍보 중...
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'X', bg: 'bg-black', delay: '0' },
                      { name: 'LinkedIn', bg: 'bg-[#0A66C2]', delay: '100' },
                      { name: 'Threads', bg: 'bg-black', delay: '200' },
                      { name: 'Facebook', bg: 'bg-[#1877F2]', delay: '300' },
                    ].map((platform) => (
                      <div
                        key={platform.name}
                        className={`${platform.bg} text-white px-4 py-2 rounded-full text-sm font-medium`}
                      >
                        {platform.name} 게시 완료
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-indigo-600 font-medium mt-4">4개 플랫폼 동시 홍보 완료</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-orange-600 font-semibold text-sm mb-4 block">배달도 해드려요</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  &ldquo;만들었는데<br />
                  홍보는 언제 하지?&rdquo;
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  체크 한 번이면 X, LinkedIn, Threads, Facebook에
                  자동으로 소식이 퍼져요. 만드느라 바빴잖아요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Warm */}
      <section className="py-24 bg-gradient-to-br from-orange-600 to-orange-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            첫 요리, 오늘 내볼까요?
          </h2>
          <p className="text-lg text-orange-100 mb-10 max-w-xl mx-auto">
            서랍 속에서 식어가는 프로젝트, 있잖아요.
            따끈할 때 꺼내세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu/register">
              <Button className="h-12 px-8 text-base font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg">
                주방 입장하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="h-12 px-8 text-base font-semibold rounded-full text-white border-2 border-white hover:bg-white hover:text-orange-600 transition-colors"
              >
                다른 메뉴 구경하기
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
