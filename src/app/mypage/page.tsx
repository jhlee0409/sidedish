'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, User, Utensils, Heart, Mail,
  Edit3, Trash2, ChefHat, Calendar, Check, X, Settings,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import {
  getProjects,
  deleteProject as deleteProjectApi,
  getUserLikes,
  getWhispers as getWhispersApi,
  markWhisperAsRead as markWhisperAsReadApi,
  getProject,
  withdrawUser,
} from '@/lib/api-client'
import { ProjectResponse, WhisperResponse } from '@/lib/db-types'
import LoginModal from '@/components/LoginModal'
import ProfileEditModal from '@/components/ProfileEditModal'
import WithdrawalModal from '@/components/WithdrawalModal'
import { PLATFORM_ICONS } from '@/lib/platform-config'

type TabType = 'menus' | 'likes' | 'whispers'

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <div className="text-slate-400">마이페이지를 불러오는 중...</div>
        </div>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  )
}

const validTabs: TabType[] = ['menus', 'likes', 'whispers']

function MyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()

  // URL 쿼리스트링에서 탭 상태 읽기 (state로 관리)
  const [activeTab, setActiveTabState] = useState<TabType>('menus')

  // URL 쿼리 파라미터와 탭 상태 동기화
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTabState(tabParam)
    } else {
      setActiveTabState('menus')
    }
  }, [searchParams])

  // 탭 변경 시 URL 업데이트
  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/mypage?${params.toString()}`, { scroll: false })
  }, [router, searchParams])
  const [myProjects, setMyProjects] = useState<ProjectResponse[]>([])
  const [likedProjects, setLikedProjects] = useState<ProjectResponse[]>([])
  const [whispers, setWhispers] = useState<WhisperResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load my projects
      const projectsResponse = await getProjects({ authorId: user.id })
      setMyProjects(projectsResponse.data)

      // Load liked projects
      try {
        const likesResponse = await getUserLikes(user.id)
        const likedProjectPromises = likesResponse.likedProjectIds.map(id =>
          getProject(id).catch(() => null)
        )
        const likedProjectResults = await Promise.all(likedProjectPromises)
        setLikedProjects(likedProjectResults.filter((p): p is ProjectResponse => p !== null))
      } catch {
        setLikedProjects([])
      }

      // Load whispers
      try {
        const whispersResponse = await getWhispersApi()
        setWhispers(whispersResponse)
      } catch {
        setWhispers([])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData()
    }
  }, [isAuthenticated, user, loadData])

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProjectApi(projectId)
      setMyProjects(prev => prev.filter(p => p.id !== projectId))
      setDeleteConfirmId(null)
      toast.success('메뉴가 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('메뉴 삭제에 실패했습니다.')
    }
  }

  const handleReadWhisper = async (whisperId: string) => {
    try {
      await markWhisperAsReadApi(whisperId)
      setWhispers(prev => prev.map(w =>
        w.id === whisperId ? { ...w, isRead: true } : w
      ))
    } catch (error) {
      console.error('Failed to mark whisper as read:', error)
    }
  }

  const handleWithdrawal = async (reason: string, feedback: string) => {
    if (!user) return

    try {
      await withdrawUser(user.id, reason, feedback)
      toast.success('회원 탈퇴가 완료되었습니다.')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to withdraw:', error)
      toast.error('회원 탈퇴에 실패했습니다. 다시 시도해주세요.')
      throw error
    }
  }

  const tabs = [
    { id: 'menus' as TabType, label: '내 메뉴', icon: <Utensils className="w-4 h-4" />, count: myProjects.length },
    { id: 'likes' as TabType, label: '찜한 메뉴', icon: <Heart className="w-4 h-4" />, count: likedProjects.length },
    { id: 'whispers' as TabType, label: '받은 귓속말', icon: <Mail className="w-4 h-4" />, count: whispers.filter(w => !w.isRead).length },
  ]

  const unreadWhispers = whispers.filter(w => !w.isRead).length

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <div className="text-slate-400">마이페이지를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-slate-500 mb-6">마이페이지를 이용하려면 로그인해주세요.</p>
            <Button
              variant="primary"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowLoginModal(true)}
            >
              로그인하기
            </Button>
          </div>
        </div>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base hidden sm:inline">홈으로</span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <span className="font-bold text-slate-900 text-sm sm:text-base">마이페이지</span>
            </div>
            <div className="w-16 sm:w-24" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-5xl">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 px-5 sm:px-8 py-6 sm:py-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold backdrop-blur-sm border-3 sm:border-4 border-white/30 overflow-hidden">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => setShowProfileEditModal(true)}
                  className="absolute bottom-0 right-0 p-1 sm:p-1.5 bg-white text-orange-500 rounded-full shadow-lg hover:bg-orange-50 transition-colors"
                  title="프로필 수정"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{user.name}</h1>
                <p className="text-white/70 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-white/80 text-xs sm:text-sm">
                  <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>SideDish Chef</span>
                </div>
              </div>
            </div>

            {/* 회원탈퇴 - 우측 하단에 작게 배치 */}
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 z-10 text-[9px] sm:text-[10px] text-white/40 hover:text-white/60 transition-colors"
            >
              회원탈퇴
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 sm:py-5 text-center transition-colors ${
                  activeTab === tab.id ? 'bg-orange-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`text-lg sm:text-xl font-bold ${
                  activeTab === tab.id ? 'text-orange-600' : 'text-slate-900'
                }`}>
                  {tab.id === 'whispers' ? (
                    <span className="relative">
                      {whispers.length}
                      {unreadWhispers > 0 && (
                        <span className="absolute -top-1 -right-2.5 sm:-right-3 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                          {unreadWhispers}
                        </span>
                      )}
                    </span>
                  ) : (
                    tab.count
                  )}
                </div>
                <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 flex items-center justify-center gap-1 ${
                  activeTab === tab.id ? 'text-orange-600 font-semibold' : 'text-slate-500'
                }`}>
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {/* My Menus Tab */}
          {activeTab === 'menus' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">내가 등록한 메뉴</h2>
                <Link href="/menu/register">
                  <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                    새 메뉴 등록
                  </Button>
                </Link>
              </div>

              {myProjects.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {myProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/menu/${project.id}`)}
                    >
                      <div className="flex">
                        <div className="relative w-28 sm:w-40 h-24 sm:h-28 flex-shrink-0">
                          <Image
                            src={project.imageUrl}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 p-3 sm:p-4">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <span className="text-slate-400">{PLATFORM_ICONS[project.platform]}</span>
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{project.shortDescription}</p>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {project.likes}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                              <Link href={`/menu/edit/${project.id}`}>
                                <button className="p-1.5 sm:p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                  <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </Link>
                              {deleteConfirmId === project.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="p-1.5 sm:p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(project.id)}
                                  className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Utensils className="w-12 h-12" />}
                  title="아직 등록한 메뉴가 없어요"
                  description="첫 요리 등록하고 셰프 데뷔!"
                  action={
                    <Link href="/menu/register">
                      <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                        메뉴 등록하기
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* Liked Menus Tab */}
          {activeTab === 'likes' && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6">찜한 메뉴</h2>

              {likedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {likedProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/menu/${project.id}`)}
                    >
                      <div className="relative h-24 sm:h-28">
                        <Image
                          src={project.imageUrl}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-medium text-red-500">
                          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                          {project.likes}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <span className="text-slate-400">{PLATFORM_ICONS[project.platform]}</span>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{project.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{project.shortDescription}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-400">
                          <ChefHat className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{project.authorName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Heart className="w-12 h-12" />}
                  title="아직 찜한 메뉴가 없어요"
                  description="마음에 드는 요리를 발견하면 찜해보세요!"
                  action={
                    <Link href="/dashboard">
                      <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                        메뉴판 둘러보기
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* Whispers Tab */}
          {activeTab === 'whispers' && (
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6">받은 비밀 귓속말</h2>

              {whispers.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {whispers.map(whisper => (
                    <div
                      key={whisper.id}
                      className={`bg-white rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm transition-all ${
                        whisper.isRead ? 'border-slate-100' : 'border-purple-200 bg-purple-50/30'
                      }`}
                      onClick={() => !whisper.isRead && handleReadWhisper(whisper.id)}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {!whisper.isRead && (
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full" />
                            )}
                            <span className="text-xs sm:text-sm font-semibold text-purple-600 flex items-center gap-1">
                              <Utensils className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {whisper.projectTitle}
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-400">
                            {new Date(whisper.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{whisper.content}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-400">
                          <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{whisper.senderName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Mail className="w-12 h-12" />}
                  title="아직 받은 귓속말이 없어요"
                  description="메뉴 올리면 귓속말이 와요"
                  action={
                    <Link href="/menu/register">
                      <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                        메뉴 등록하기
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

        </div>
      </div>


      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
      />

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onConfirm={handleWithdrawal}
        userName={user?.name || ''}
      />
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
      <div className="text-slate-300 mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2">{title}</h3>
      <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6 text-center">{description}</p>
      {action}
    </div>
  )
}
