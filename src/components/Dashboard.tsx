'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hero from './Hero'
import ProjectCard from './ProjectCard'
import { getProjectsWithAbort } from '@/lib/api-client'
import { ProjectResponse } from '@/lib/db-types'
import { Search, Loader2, FolderOpen } from 'lucide-react'

const Dashboard: React.FC = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
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
      const platform = activeTab === 'All' ? undefined :
        activeTab === 'Tech' ? 'WEB' :
        activeTab === 'Design' ? 'DESIGN' : undefined

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
  }, [activeTab, debouncedSearch])

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

  const tabs = [
    { id: 'All', label: '전체' },
    { id: 'Tech', label: '개발' },
    { id: 'Design', label: '디자인' },
    { id: 'Life', label: '라이프' },
  ]

  const handleProjectClick = (project: ProjectResponse) => {
    router.push(`/menu/${project.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero onExploreClick={handleExploreClick} />

      <div ref={galleryRef} className="container mx-auto px-6 pb-20 max-w-6xl">
        {/* Search & Filter */}
        <div className="sticky top-20 z-20 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-100 -mx-6 px-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                placeholder="프로젝트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {activeTab === 'All' ? '최신 프로젝트' : `${tabs.find(t => t.id === activeTab)?.label} 프로젝트`}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            메이커들이 만든 프로젝트를 둘러보세요
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
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-1">프로젝트가 없습니다</h3>
            <p className="text-sm text-slate-500 mb-6">
              검색 조건에 맞는 프로젝트가 없어요
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setActiveTab('All')
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
