'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hero from './Hero'
import ProjectCard from './ProjectCard'
import { getProjects } from '@/lib/api-client'
import { ProjectResponse } from '@/lib/db-types'
import { Search, Filter, TrendingUp, Utensils, Star, ChefHat, Loader2 } from 'lucide-react'

const Dashboard: React.FC = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()

  const galleryRef = useRef<HTMLDivElement>(null)

  // Load projects from API
  const loadProjects = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true)
      const platform = activeTab === 'All' ? undefined :
        activeTab === 'Tech' ? 'WEB' :
        activeTab === 'Design' ? 'DESIGN' : undefined

      const response = await getProjects({
        limit: 20,
        cursor,
        platform,
        search: searchTerm || undefined,
      })

      if (cursor) {
        setProjects(prev => [...prev, ...response.data])
      } else {
        setProjects(response.data)
      }
      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchTerm])

  // Load projects on mount and when filters change
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleExploreClick = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLoadMore = () => {
    if (hasMore && nextCursor) {
      loadProjects(nextCursor)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { id: 'All', label: '전체 메뉴', icon: <Utensils className="w-4 h-4" /> },
    { id: 'Tech', label: '기술/개발', icon: <Star className="w-4 h-4" /> },
    { id: 'Design', label: '디자인/아트', icon: <Star className="w-4 h-4" /> },
    { id: 'Life', label: '라이프스타일', icon: <Star className="w-4 h-4" /> },
  ]

  const handleProjectClick = (project: ProjectResponse) => {
    router.push(`/menu/${project.id}`)
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <Hero onExploreClick={handleExploreClick} />

      <div ref={galleryRef} className="container mx-auto px-4 pb-20 max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Menu Picker Section (Search & Filter) */}
        <div className="relative -mt-10 mb-16 z-20">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 items-center">

              {/* Search Input */}
              <div className="relative w-full md:flex-[3] group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent hover:bg-white hover:border-slate-200 focus:bg-white focus:border-orange-500 rounded-[2rem] leading-5 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 text-base transition-all"
                  placeholder="메뉴(프로젝트) 이름이나 재료(태그)를 검색해보세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Divider (Desktop) */}
              <div className="hidden md:block w-px h-8 bg-slate-200"></div>

              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar justify-start md:justify-center">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap border ${activeTab === tab.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {activeTab === 'All' ? '지금 핫한 메뉴' : `${activeTab} 추천 메뉴`}
              </h2>
              <p className="text-sm text-slate-500">미식가들의 입맛을 사로잡은 프로젝트들입니다.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400">
            <Filter className="w-4 h-4" />
            <span>최신순 정렬</span>
          </div>
        </div>

        {/* Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500">맛있는 메뉴를 준비하고 있습니다...</p>
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
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
                  className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-orange-300 hover:text-orange-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    '더 많은 메뉴 보기'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[2.5rem] border-2 border-slate-100 border-dashed relative overflow-hidden group">
            <div className="absolute inset-0 bg-slate-50/50 group-hover:bg-orange-50/30 transition-colors"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white p-6 rounded-full shadow-sm mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
                <ChefHat className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">아직 준비된 메뉴가 없네요</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                검색하신 조건에 맞는 요리가 없습니다.<br />
                직접 셰프가 되어 첫 번째 요리를 등록해보시는 건 어때요?
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setActiveTab('All')
                }}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:border-orange-200 hover:text-orange-600 hover:shadow-md transition-all"
              >
                전체 메뉴판 다시보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
