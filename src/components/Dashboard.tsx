'use client'

import { useState, useRef, useEffect } from 'react'
import Hero from './Hero'
import ProjectCard from './ProjectCard'
import ProjectDetail from './ProjectDetail'
import { MOCK_PROJECTS } from '@/lib/constants'
import { Project } from '@/lib/types'
import { Search, Filter, TrendingUp, Utensils, Star, ChefHat } from 'lucide-react'

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const galleryRef = useRef<HTMLDivElement>(null)

  // Load projects from localStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem('sidedish_projects')
    if (storedProjects) {
      try {
        const parsed = JSON.parse(storedProjects)
        const projectsWithDates = parsed.map((p: Project & { createdAt: string }) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }))
        setProjects([...projectsWithDates, ...MOCK_PROJECTS])
      } catch (e) {
        console.error('Failed to parse stored projects:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedProject) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selectedProject])

  const handleExploreClick = () => {
    if (selectedProject) {
      setSelectedProject(null)
      setTimeout(() => galleryRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab = activeTab === 'All' ? true :
      activeTab === 'Tech' ? p.tags.some(t => ['Tech', 'React', 'App', 'Web'].includes(t)) :
        p.tags.some(t => t.toLowerCase().includes(activeTab.toLowerCase()) ||
          (activeTab === 'Culture' && ['요리', '여행', '영화'].includes(t)) ||
          (activeTab === 'Design' && ['사진', '예술'].includes(t))
        )

    return matchesSearch && matchesTab
  })

  const tabs = [
    { id: 'All', label: '전체 메뉴', icon: <Utensils className="w-4 h-4" /> },
    { id: 'Tech', label: '기술/개발', icon: <Star className="w-4 h-4" /> },
    { id: 'Design', label: '디자인/아트', icon: <Star className="w-4 h-4" /> },
    { id: 'Life', label: '라이프스타일', icon: <Star className="w-4 h-4" /> },
  ]

  if (selectedProject) {
    return (
      <div className="pt-8 bg-[#F8FAFC] min-h-screen">
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      </div>
    )
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
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
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
                onClick={() => setSearchTerm('')}
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
