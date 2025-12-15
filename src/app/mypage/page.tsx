'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Utensils, MessageCircle, Heart, Mail,
  Edit3, Trash2, ChefHat, Calendar, Check, X, Settings,
  Globe, Smartphone, Gamepad2, Palette, Box, ExternalLink
} from 'lucide-react'
import Button from '@/components/Button'
import { Project, User as UserType, UserComment, Whisper } from '@/lib/types'
import {
  getUser, updateUser, getMyProjects, deleteProject,
  getUserComments, deleteUserComment, getWhispers, markWhisperAsRead,
  getLikedProjectIds
} from '@/lib/storage'
import { MOCK_PROJECTS } from '@/lib/constants'

type TabType = 'menus' | 'reviews' | 'likes' | 'whispers'

const platformIcons = {
  WEB: <Globe className="w-4 h-4" />,
  APP: <Smartphone className="w-4 h-4" />,
  GAME: <Gamepad2 className="w-4 h-4" />,
  DESIGN: <Palette className="w-4 h-4" />,
  OTHER: <Box className="w-4 h-4" />,
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('menus')
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [myComments, setMyComments] = useState<UserComment[]>([])
  const [likedProjects, setLikedProjects] = useState<Project[]>([])
  const [whispers, setWhispers] = useState<Whisper[]>([])
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    const userData = getUser()
    setUser(userData)
    setEditedName(userData.name)

    // Load my projects
    setMyProjects(getMyProjects())

    // Load my comments
    setMyComments(getUserComments())

    // Load liked projects
    const likedIds = getLikedProjectIds()
    const myProjectsList = getMyProjects()
    const allProjects = [...myProjectsList, ...MOCK_PROJECTS]
    setLikedProjects(allProjects.filter(p => likedIds.includes(p.id)))

    // Load whispers
    setWhispers(getWhispers())
  }, [])

  const handleSaveName = () => {
    if (editedName.trim()) {
      const updated = updateUser({ name: editedName.trim() })
      setUser(updated)
      setIsEditingName(false)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId)
    setMyProjects(prev => prev.filter(p => p.id !== projectId))
    setDeleteConfirmId(null)
  }

  const handleDeleteComment = (commentId: string) => {
    deleteUserComment(commentId)
    setMyComments(prev => prev.filter(c => c.id !== commentId))
  }

  const handleReadWhisper = (whisperId: string) => {
    markWhisperAsRead(whisperId)
    setWhispers(prev => prev.map(w =>
      w.id === whisperId ? { ...w, isRead: true } : w
    ))
  }

  const tabs = [
    { id: 'menus' as TabType, label: '내 메뉴', icon: <Utensils className="w-4 h-4" />, count: myProjects.length },
    { id: 'reviews' as TabType, label: '내 리뷰', icon: <MessageCircle className="w-4 h-4" />, count: myComments.length },
    { id: 'likes' as TabType, label: '찜한 메뉴', icon: <Heart className="w-4 h-4" />, count: likedProjects.length },
    { id: 'whispers' as TabType, label: '받은 피드백', icon: <Mail className="w-4 h-4" />, count: whispers.filter(w => !w.isRead).length },
  ]

  const unreadWhispers = whispers.filter(w => !w.isRead).length

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">홈으로</span>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-900">마이페이지</span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/50 text-xl font-bold"
                      placeholder="닉네임 입력"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false)
                        setEditedName(user.name)
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-white/80">
                  <ChefHat className="w-4 h-4" />
                  <span>SideDish Chef</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 divide-x divide-slate-100">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-6 text-center transition-colors ${
                  activeTab === tab.id ? 'bg-orange-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`text-2xl font-bold ${
                  activeTab === tab.id ? 'text-orange-600' : 'text-slate-900'
                }`}>
                  {tab.id === 'whispers' ? (
                    <span className="relative">
                      {whispers.length}
                      {unreadWhispers > 0 && (
                        <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadWhispers}
                        </span>
                      )}
                    </span>
                  ) : (
                    tab.count
                  )}
                </div>
                <div className={`text-sm mt-1 flex items-center justify-center gap-1 ${
                  activeTab === tab.id ? 'text-orange-600 font-semibold' : 'text-slate-500'
                }`}>
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {/* My Menus Tab */}
          {activeTab === 'menus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">내가 등록한 메뉴</h2>
                <Link href="/menu/register">
                  <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                    새 메뉴 등록
                  </Button>
                </Link>
              </div>

              {myProjects.length > 0 ? (
                <div className="space-y-4">
                  {myProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex">
                        <div className="relative w-48 h-32 flex-shrink-0">
                          <Image
                            src={project.imageUrl}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-400">{platformIcons[project.platform]}</span>
                                <h3 className="font-bold text-slate-900">{project.title}</h3>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2">{project.shortDescription}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {project.likes}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/menu/edit/${project.id}`}>
                                <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </Link>
                              {deleteConfirmId === project.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(project.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                  description="첫 번째 요리를 등록하고 셰프가 되어보세요!"
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

          {/* My Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6">내가 남긴 리뷰</h2>

              {myComments.length > 0 ? (
                <div className="space-y-4">
                  {myComments.map(comment => (
                    <div
                      key={comment.id}
                      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/?project=${comment.projectId}`}
                          className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <Utensils className="w-3 h-3" />
                          {comment.projectTitle}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<MessageCircle className="w-12 h-12" />}
                  title="아직 남긴 리뷰가 없어요"
                  description="다른 셰프들의 요리를 맛보고 리뷰를 남겨보세요!"
                  action={
                    <Link href="/">
                      <Button variant="primary" className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                        메뉴판 둘러보기
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>
          )}

          {/* Liked Menus Tab */}
          {activeTab === 'likes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6">찜한 메뉴</h2>

              {likedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {likedProjects.map(project => (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/?project=${project.id}`)}
                    >
                      <div className="relative h-32">
                        <Image
                          src={project.imageUrl}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-red-500">
                          <Heart className="w-3 h-3 fill-current" />
                          {project.likes}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-400">{platformIcons[project.platform]}</span>
                          <h3 className="font-bold text-slate-900 truncate">{project.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1">{project.shortDescription}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <ChefHat className="w-3 h-3" />
                          <span>{project.author}</span>
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
                    <Link href="/">
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
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-6">받은 비밀 피드백</h2>

              {whispers.length > 0 ? (
                <div className="space-y-4">
                  {whispers.map(whisper => (
                    <div
                      key={whisper.id}
                      className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
                        whisper.isRead ? 'border-slate-100' : 'border-purple-200 bg-purple-50/30'
                      }`}
                      onClick={() => !whisper.isRead && handleReadWhisper(whisper.id)}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {!whisper.isRead && (
                              <span className="w-2 h-2 bg-purple-500 rounded-full" />
                            )}
                            <span className="text-sm font-semibold text-purple-600 flex items-center gap-1">
                              <Utensils className="w-3 h-3" />
                              {whisper.projectTitle}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(whisper.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{whisper.content}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{whisper.senderName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Mail className="w-12 h-12" />}
                  title="아직 받은 피드백이 없어요"
                  description="메뉴를 등록하면 다른 사용자들의 피드백을 받을 수 있어요!"
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
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
      <div className="text-slate-300 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 text-center">{description}</p>
      {action}
    </div>
  )
}
