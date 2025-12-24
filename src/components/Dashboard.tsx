'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hero from './Hero'
import ProjectCard from './ProjectCard'
import { getProjectsWithAbort } from '@/lib/api-client'
import { ProjectResponse, ProjectPlatform } from '@/lib/db-types'
import { Search, Loader2, FolderOpen, TrendingUp, Clock } from 'lucide-react'
import { PLATFORM_OPTIONS } from '@/lib/platform-config'

type SortOption = 'latest' | 'popular'

const Dashboard: React.FC = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ProjectPlatform | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()

  const galleryRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadProjects = useCallback(async (cursor?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setIsLoading(true)
      const platform = activeFilter === 'ALL' ? undefined : activeFilter

      const response = await getProjectsWithAbort({
        limit: 20,
        cursor,
        platform,
        search: debouncedSearch || undefined,
      }, abortController.signal)

      if (!abortController.signal.aborted) {
        if (cursor) {
          setProjects(prev => [...prev, ...response.data])
        } else {
          setProjects(response.data)
        }
        setHasMore(response.hasMore)
        setNextCursor(response.nextCursor)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Failed to load projects:', error)
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [activeFilter, debouncedSearch])

  useEffect(() => {
    loadProjects()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadProjects])

  const handleExploreClick = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLoadMore = () => {
    if (hasMore && nextCursor) {
      loadProjects(nextCursor)
    }
  }

  const handleProjectClick = (project: ProjectResponse) => {
    router.push(`/menu/${project.id}`)
  }

  // 정렬된 프로젝트
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes - a.likes
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Featured 프로젝트 (좋아요 상위 3개)
  const featuredProjects = [...projects]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)

  // 현재 필터의 라벨 가져오기
  const getFilterLabel = () => {
    if (activeFilter === 'ALL') return '전체'
    const option = PLATFORM_OPTIONS.find(opt => opt.value === activeFilter)
    return option?.label || '전체'
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Hero onExploreClick={handleExploreClick} />

      {/* Main content area with subtle background */}
      <div className="relative">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div ref={galleryRef} className="container mx-auto px-4 sm:px-6 pb-20 max-w-7xl relative z-10">
          {/* Featured Section - Only show when no search/filter active */}
          {!debouncedSearch && activeFilter === 'ALL' && featuredProjects.length >= 3 && (
            <div className="py-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Featured</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">이번 주 인기 메뉴</h2>
              </div>

              {/* Featured cards - Bento-style layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {featuredProjects.map((project, idx) => (
                  <div
                    key={project.id}
                    className={`group relative overflow-hidden rounded-2xl cursor-pointer hover:shadow-xl transition-shadow ${
                      idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                    onClick={() => handleProjectClick(project)}
                  >
                    {/* Background image */}
                    <div className={`relative ${idx === 0 ? 'aspect-[16/9] md:aspect-[4/3]' : 'aspect-[16/10]'}`}>
                      <img
                        src={project.imageUrl || `/api/og?title=${encodeURIComponent(project.title)}`}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </div>

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                      {/* Rank badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                        <span className="text-orange-500 font-bold">#{idx + 1}</span>
                      </div>

                      {/* Title and meta */}
                      <h3 className={`font-bold text-white mb-2 line-clamp-2 ${
                        idx === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                      }`}>
                        {project.title}
                      </h3>
                      <p className={`text-white/70 line-clamp-2 mb-3 ${idx === 0 ? 'text-base' : 'text-sm'}`}>
                        {project.shortDescription}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/60">{project.authorName}</span>
                        <span className="text-white/40">·</span>
                        <span className="text-sm text-orange-300 font-medium">{project.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Section */}
          <div className="sticky top-16 z-20 py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 bg-[#FAFBFC]/80 backdrop-blur-xl border-b border-slate-200/50">
            <div className="flex flex-col gap-4 max-w-5xl mx-auto">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 min-h-[48px] bg-white border border-slate-200 rounded-2xl text-base placeholder-slate-400 focus:outline-none focus-visible:border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-100 transition-all shadow-sm"
                  placeholder="메뉴 이름, 태그, 설명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="메뉴 검색"
                />
              </div>

              {/* Filter row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Platform filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="플랫폼 필터">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    role="tab"
                    aria-selected={activeFilter === 'ALL'}
                    className={`px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl border-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                      activeFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    전체
                  </button>
                  {PLATFORM_OPTIONS.filter(opt => opt.value !== 'OTHER').map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setActiveFilter(opt.value)}
                      role="tab"
                      aria-selected={activeFilter === opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl border-2 transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                        activeFilter === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={activeFilter === opt.value ? 'text-white' : 'text-slate-400'}>{opt.icon}</span>
                      {opt.shortLabel}
                    </button>
                  ))}
                </div>

                {/* Sort options */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium rounded-lg transition-all ${
                      sortBy === 'latest'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    최신순
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium rounded-lg transition-all ${
                      sortBy === 'popular'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    인기순
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section header */}
          <div className="mb-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">
              {activeFilter === 'ALL' ? '모든 메뉴' : `${getFilterLabel()} 메뉴`}
            </h2>
            <p className="text-slate-500 mt-1">
              {debouncedSearch ? `"${debouncedSearch}" 검색 결과` : '셰프들이 만든 사이드 프로젝트를 둘러보세요'}
            </p>
          </div>

          {/* Projects Grid */}
          <div className="max-w-5xl mx-auto">
            {isLoading && projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
                <p className="text-sm text-slate-500 mt-4">메뉴를 불러오는 중...</p>
              </div>
            ) : sortedProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {sortedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="group px-8 py-4 min-h-[52px] text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          불러오는 중...
                        </>
                      ) : (
                        <>
                          더 많은 메뉴 보기
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-sm rounded-full">
                            +{20}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                  <FolderOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">메뉴가 없어요</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                  검색 조건에 맞는 메뉴를 찾지 못했어요.
                  <br />다른 키워드로 검색해보세요.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setActiveFilter('ALL')
                  }}
                  className="px-6 py-3 min-h-[48px] text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                >
                  전체 메뉴 보기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
