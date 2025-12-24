'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hero from './Hero'
import ProjectCard from './ProjectCard'
import { getProjectsWithAbort } from '@/lib/api-client'
import { ProjectResponse, ProjectPlatform } from '@/lib/db-types'
import { Search, Loader2, FolderOpen } from 'lucide-react'
import { PLATFORM_OPTIONS } from '@/lib/platform-config'

const Dashboard: React.FC = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ProjectPlatform | 'ALL'>('ALL')
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

  // 현재 필터의 라벨 가져오기
  const getFilterLabel = () => {
    if (activeFilter === 'ALL') return '전체'
    const option = PLATFORM_OPTIONS.find(opt => opt.value === activeFilter)
    return option?.label || '전체'
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero onExploreClick={handleExploreClick} />

      <div ref={galleryRef} className="container mx-auto px-6 pb-20 max-w-6xl">
        {/* Search & Filter */}
        <div className="sticky top-20 z-20 py-4 bg-white/95 backdrop-blur-sm -mx-6 px-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center max-w-4xl mx-auto">
            {/* Search - 44px minimum height */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-white border border-slate-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus-visible:border-orange-300 focus-visible:ring-2 focus-visible:ring-orange-100 transition-all"
                placeholder="메뉴 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="메뉴 검색"
              />
            </div>

            {/* Filter Chips - 44px touch targets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="플랫폼 필터">
              {/* 전체 필터 */}
              <button
                onClick={() => setActiveFilter('ALL')}
                role="tab"
                aria-selected={activeFilter === 'ALL'}
                className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                  activeFilter === 'ALL'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                전체
              </button>
              {/* 플랫폼별 필터 */}
              {PLATFORM_OPTIONS.filter(opt => opt.value !== 'OTHER').map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  role="tab"
                  aria-selected={activeFilter === opt.value}
                  className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-full border transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                    activeFilter === opt.value
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <span className={activeFilter === opt.value ? 'text-white' : 'text-slate-400'}>{opt.icon}</span>
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {activeFilter === 'ALL' ? '최신 메뉴' : `${getFilterLabel()} 메뉴`}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            메이커들이 만든 메뉴를 둘러보세요
          </p>
        </div>

        {/* Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm text-slate-500">불러오는 중...</p>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
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
                  className="px-6 py-3 min-h-[44px] text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-1">메뉴가 없습니다</h3>
            <p className="text-sm text-slate-500 mb-6">
              검색 조건에 맞는 메뉴가 없어요
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setActiveFilter('ALL')
              }}
              className="px-5 py-3 min-h-[44px] text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
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
