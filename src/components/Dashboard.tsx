'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
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

  // Embla Carousel for filter chips
  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    containScroll: 'trimSnaps',
    align: 'start',
  })

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

  // 현재 필터의 라벨 가져오기
  const getFilterLabel = () => {
    if (activeFilter === 'ALL') return '전체'
    const option = PLATFORM_OPTIONS.find(opt => opt.value === activeFilter)
    return option?.label || '전체'
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero onExploreClick={handleExploreClick} />

      <div ref={galleryRef} className="container mx-auto px-4 pb-16 max-w-5xl">
        {/* Search & Filter */}
        <div className="sticky top-14 sm:top-16 z-20 py-3 sm:py-4 bg-white/95 backdrop-blur-sm -mx-4 px-4 mb-6">
          {/* Search - constrained width */}
          <div className="max-w-3xl mx-auto mb-3 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 min-h-[40px] sm:min-h-[44px] bg-white border border-slate-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus-visible:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-100 transition-all"
                placeholder="메뉴 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="메뉴 검색"
              />
            </div>
          </div>

          {/* Filter row */}
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Platform filters - Embla Carousel */}
              <div className="flex-1 min-w-0 overflow-hidden" ref={emblaRef}>
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label="플랫폼 필터"
                >
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    role="tab"
                    aria-selected={activeFilter === 'ALL'}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm font-medium rounded-full border transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                      activeFilter === 'ALL'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600'
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
                      className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm font-medium rounded-full border transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                        activeFilter === opt.value
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600'
                      }`}
                    >
                      <span className={activeFilter === opt.value ? 'text-white' : 'text-slate-400'}>{opt.icon}</span>
                      {opt.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort options */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    sortBy === 'latest'
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  최신순
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[36px] text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    sortBy === 'popular'
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  인기순
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            {activeFilter === 'ALL' ? '최신 메뉴' : `${getFilterLabel()} 메뉴`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {debouncedSearch ? `"${debouncedSearch}" 검색 결과` : '메이커들이 만든 메뉴를 둘러보세요'}
          </p>
        </div>

        {/* Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-slate-500">불러오는 중...</p>
          </div>
        ) : sortedProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {sortedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-slate-900 mb-1">메뉴가 없습니다</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-5">
              검색 조건에 맞는 메뉴가 없어요
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setActiveFilter('ALL')
              }}
              className="px-4 py-2.5 min-h-[40px] text-xs sm:text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
