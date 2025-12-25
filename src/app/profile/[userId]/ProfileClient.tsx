'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChefHat,
  Calendar,
  Heart,
  Utensils,
  Loader2,
} from 'lucide-react'
import { getUser, getProjects } from '@/lib/api-client'
import { UserResponse, ProjectResponse } from '@/lib/db-types'
import { useAuth } from '@/contexts/AuthContext'
import { PLATFORM_ICONS } from '@/lib/platform-config'

interface ProfileClientProps {
  userId: string
  initialUser: {
    id: string
    name: string
    avatarUrl?: string
    isWithdrawn: boolean
    createdAt: string
  } | null
}

export default function ProfileClient({ userId, initialUser }: ProfileClientProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<UserResponse | null>(
    initialUser ? {
      ...initialUser,
      isProfileComplete: true,
      agreements: { termsOfService: true, privacyPolicy: true, marketing: false, agreedAt: '' },
      updatedAt: initialUser.createdAt,
    } as UserResponse : null
  )
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [error, setError] = useState<string | null>(null)

  // Redirect to mypage if viewing own profile
  useEffect(() => {
    if (currentUser && currentUser.id === userId) {
      router.replace('/mypage')
    }
  }, [currentUser, userId, router])

  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) return

      if (!initialUser) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const [userProfile, projectsResponse] = await Promise.all([
          getUser(userId),
          getProjects({ authorId: userId }),
        ])

        setProfile(userProfile)
        setProjects(projectsResponse.data)
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('프로필을 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [userId, initialUser])

  const totalLikes = projects.reduce((sum, p) => sum + p.likes, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <div className="text-slate-400">프로필을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            프로필을 찾을 수 없습니다
          </h2>
          <p className="text-slate-500 mb-6">
            존재하지 않는 사용자이거나 탈퇴한 사용자입니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            메뉴판으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base hidden sm:inline">뒤로</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <span className="font-bold text-slate-900 text-sm sm:text-base">Chef 프로필</span>
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold backdrop-blur-sm border-3 sm:border-4 border-white/30 overflow-hidden relative">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.name}</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-white/80 text-xs sm:text-sm">
                  <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>SideDish Chef</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-white/60 text-[10px] sm:text-sm">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>
                    {new Date(profile.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                    })}{' '}
                    가입
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="py-4 sm:py-5 text-center">
              <div className="text-lg sm:text-xl font-bold text-slate-900">
                {projects.length}
              </div>
              <div className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-500 flex items-center justify-center gap-1">
                <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">등록한 메뉴</span>
              </div>
            </div>
            <div className="py-4 sm:py-5 text-center">
              <div className="text-lg sm:text-xl font-bold text-slate-900">
                {totalLikes}
              </div>
              <div className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-500 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">받은 찜</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {profile.name} Chef의 메뉴
            </h2>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/menu/${project.id}`)}
                >
                  <div className="flex">
                    <div className="relative w-28 sm:w-40 aspect-[4/3] flex-shrink-0">
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
                            <span className="text-slate-400">
                              {PLATFORM_ICONS[project.platform]}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                              {project.title}
                            </h3>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                            {project.shortDescription}
                          </p>
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
              <div className="text-slate-300 mb-3 sm:mb-4">
                <Utensils className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2">
                아직 등록한 메뉴가 없어요
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm text-center">
                이 Chef는 아직 메뉴를 준비 중이에요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
