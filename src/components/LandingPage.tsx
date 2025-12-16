'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles, MessageSquare, Heart, ExternalLink } from 'lucide-react'
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm text-orange-700 font-medium mb-8 border border-orange-200/50">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  {chefCount ? `${chefCount.toLocaleString()}명의 메이커가 함께하는 중` : '메이커들의 플레이그라운드'}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.15] mb-6">
                  서랍 속 프로젝트,
                  <br />
                  <span className="text-orange-600">메인 요리</span>로
                  <br />
                  대접하세요
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
                  혼자 끙끙대며 만든 사이드 프로젝트, 이제 세상에 내놓을 시간이에요.
                  AI가 멋진 소개글도 써드릴게요.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/menu/register">
                    <Button className="h-12 px-6 text-base font-semibold rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/25">
                      내 프로젝트 올리기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="h-12 px-6 text-base font-semibold rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                    >
                      구경하기
                    </Button>
                  </Link>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>AI 소개글 무료</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>비밀 피드백</span>
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
              <p className="text-sm text-slate-500">등록된 프로젝트</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-slate-900">{chefCount ? chefCount.toLocaleString() : '—'}+</p>
              <p className="text-sm text-slate-500">활동 메이커</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-orange-600">3초</p>
              <p className="text-sm text-slate-500">AI 소개글 생성</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Conversational style */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Feature 1 */}
          <div className="mb-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-orange-600 font-semibold text-sm mb-4 block">글솜씨가 없어도</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  &ldquo;기능은 좋은데<br />
                  설명을 어떻게 하지...&rdquo;
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  투박한 기획서도 괜찮아요. AI가 클릭을 부르는 매력적인 소개글로 바꿔드려요.
                  개발자가 마케터일 필요 없잖아요.
                </p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  AI 소개글 생성
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <p className="text-slate-500">// 입력: &quot;할일 관리 앱, React, 드래그앤드롭&quot;</p>
                  <p className="text-orange-400">↓ AI 변환</p>
                  <p className="text-emerald-400">&quot;바쁜 일상 속 할 일을 손쉽게 정리하세요.
                  드래그 한 번으로 우선순위를 조절하고,
                  완료의 쾌감을 느껴보세요.&quot;</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mb-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-orange-50 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                      <p className="text-sm text-slate-600">
                        &ldquo;온보딩 플로우가 조금 길게 느껴져요.
                        3단계로 줄이면 이탈률이 낮아질 것 같아요!&rdquo;
                      </p>
                      <p className="text-xs text-slate-400 mt-2">익명의 개발자</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-600 font-medium pl-13">비공개 피드백이 도착했어요</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-orange-600 font-semibold text-sm mb-4 block">완벽하지 않아도</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  MVP도 환영해요.<br />
                  솔직한 피드백이 기다려요.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  완성작만 올릴 필요 없어요. 비밀 쪽지로 솔직한 피드백을 받고,
                  프로덕트를 함께 발전시켜보세요.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-orange-600 font-semibold text-sm mb-4 block">혼자가 아니에요</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
                  서랍 속 프로젝트가<br />
                  누군가의 최애가 돼요
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  &ldquo;이런 게 있었어?&rdquo; 당신의 프로젝트를 발견하고
                  팬이 될 사람들이 기다리고 있어요.
                </p>
              </div>
              <div className="relative">
                <div className="flex flex-col gap-3">
                  {[
                    { name: '김개발', comment: '진짜 이런 앱 찾고 있었어요!', likes: 24 },
                    { name: '박디자이너', comment: 'UI가 너무 깔끔하네요 👏', likes: 18 },
                    { name: '이창업', comment: '어떻게 만드셨어요? 대화하고 싶어요', likes: 12 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4"
                      style={{ transform: `translateX(${idx * 12}px)` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden relative shrink-0">
                        <Image
                          src={`https://picsum.photos/seed/${idx * 77}/100/100`}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{item.name}</p>
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
        </div>
      </section>

      {/* CTA - Warm */}
      <section className="py-24 bg-gradient-to-br from-orange-600 to-orange-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            오늘, 첫 요리를 내어볼까요?
          </h2>
          <p className="text-lg text-orange-100 mb-10 max-w-xl mx-auto">
            서랍 속에서 잠자는 프로젝트가 있다면,
            지금이 세상에 선보일 완벽한 타이밍이에요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu/register">
              <Button className="h-12 px-8 text-base font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg">
                무료로 시작하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="h-12 px-8 text-base font-semibold rounded-full text-white border-2 border-white hover:bg-white hover:text-orange-600 transition-colors"
              >
                다른 프로젝트 구경하기
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
