'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Heart, Calendar, Share2, Hash, MessageCircle, Send,
  Sparkles, Lock, MessageSquareMore, Smartphone, Gamepad2, Palette,
  Globe, Github, User, ChefHat, Utensils, Loader2, Trash2, Pencil, FlaskConical,
  Puzzle, Package, ExternalLink
} from 'lucide-react'
import SafeMarkdown from '@/components/SafeMarkdown'
import ProjectUpdateTimeline from '@/components/ProjectUpdateTimeline'
import { LinkList } from '@/components/StoreBadges'
import { getStoreConfig } from '@/lib/store-config'
import { sanitizePlainText } from '@/lib/sanitize-utils'
import { toast } from 'sonner'
import Button from '@/components/Button'
import UserMenu from '@/components/UserMenu'
import ConfirmModal from '@/components/ConfirmModal'
import { useAuth } from '@/contexts/AuthContext'
import {
  getProject,
  getProjectComments,
  createComment,
  deleteComment,
  toggleLike,
  toggleReaction,
  getUserInteractions,
  createWhisper,
  getUser,
} from '@/lib/api-client'
import { ProjectResponse, CommentResponse, UserResponse, Reactions, ReactionKey, PromotionPostsResponse } from '@/lib/db-types'
import { REACTION_EMOJI_MAP, REACTION_KEYS, normalizeReactions, isReactionKey } from '@/lib/constants'
import { getProjectThumbnail } from '@/lib/og-utils'
import LoginModal from '@/components/LoginModal'
import ShareSheet from '@/components/ShareSheet'
import { ShareData } from '@/lib/share-utils'
import { SocialPlatform } from '@/lib/api-client'

/**
 * Platform display configuration for promotion status
 */
const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string; hoverColor: string }> = {
  x: { label: 'X', color: 'bg-black', hoverColor: 'hover:bg-gray-800' },
  linkedin: { label: 'LinkedIn', color: 'bg-[#0A66C2]', hoverColor: 'hover:bg-[#004182]' },
  facebook: { label: 'Facebook', color: 'bg-[#1877F2]', hoverColor: 'hover:bg-[#0d5bb5]' },
  threads: { label: 'Threads', color: 'bg-black', hoverColor: 'hover:bg-gray-800' },
}

/**
 * Promotion status card showing where the project was promoted
 */
function PromotionStatusCard({ promotionPosts }: { promotionPosts: PromotionPostsResponse }) {
  const successfulPosts = Object.entries(promotionPosts)
    .filter(([key, url]) => key !== 'promotedAt' && url)
    .map(([platform, url]) => ({
      platform: platform as SocialPlatform,
      url: url as string,
    }))

  if (successfulPosts.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-b from-indigo-50 to-white rounded-xl p-3 border border-indigo-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="w-4 h-4 text-indigo-600" />
        <h3 className="text-xs font-bold text-slate-900">홍보 현황</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {successfulPosts.map(({ platform, url }) => {
          const config = PLATFORM_CONFIG[platform]
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${config.color} ${config.hoverColor} text-white text-xs rounded-lg transition-colors`}
            >
              {config.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          )
        })}
      </div>
      {promotionPosts.promotedAt && (
        <p className="text-[10px] text-slate-400 mt-2">
          {new Date(promotionPosts.promotedAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}에 홍보됨
        </p>
      )}
    </div>
  )
}

interface MenuDetailClientProps {
  projectId: string
  initialProject: ProjectResponse | null
  initialAuthor: { id: string; name: string; avatarUrl?: string } | null
}

export default function MenuDetailClient({
  projectId,
  initialProject,
  initialAuthor,
}: MenuDetailClientProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [project, setProject] = useState<ProjectResponse | null>(initialProject)
  const [isLoading, setIsLoading] = useState(!initialProject)
  const [reactions, setReactions] = useState<Reactions>(normalizeReactions(initialProject?.reactions || {}))
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [newComment, setNewComment] = useState('')
  const [whisperMessage, setWhisperMessage] = useState('')
  const [isWhisperSent, setIsWhisperSent] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialProject?.likes || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [authorProfile, setAuthorProfile] = useState<UserResponse | null>(
    initialAuthor ? { ...initialAuthor, isProfileComplete: true, isWithdrawn: false, agreements: { termsOfService: true, privacyPolicy: true, marketing: false, agreedAt: '' }, createdAt: '', updatedAt: '' } as UserResponse : null
  )
  const [userReactions, setUserReactions] = useState<ReactionKey[]>([])
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [showShareSheet, setShowShareSheet] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!initialProject) {
          setIsLoading(true)
        }

        // Load comments and fresh project data
        const [projectData, commentsData] = await Promise.all([
          getProject(projectId),
          getProjectComments(projectId),
        ])

        setProject(projectData)
        setReactions(normalizeReactions(projectData.reactions || {}))
        setComments(commentsData)
        setLikeCount(projectData.likes)

        // Load author profile and user interactions in parallel
        const parallelPromises: Promise<void>[] = []

        if (!initialAuthor) {
          parallelPromises.push(
            getUser(projectData.authorId)
              .then(author => setAuthorProfile(author))
              .catch(() => {})
          )
        }

        if (isAuthenticated) {
          parallelPromises.push(
            getUserInteractions(projectId)
              .then(interactions => {
                setLiked(interactions.liked)
                const validReactions = interactions.userReactions.filter(isReactionKey)
                setUserReactions(validReactions)
              })
              .catch(() => {})
          )
        }

        await Promise.all(parallelPromises)
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectId, isAuthenticated, initialProject, initialAuthor])

  const isOwnProject = user?.id === project?.authorId

  const handleReaction = async (reactionKey: ReactionKey) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (isOwnProject) return

    const hasReacted = userReactions.includes(reactionKey)

    // Optimistic update
    if (hasReacted) {
      setUserReactions(prev => prev.filter(r => r !== reactionKey))
      setReactions(prev => ({
        ...prev,
        [reactionKey]: Math.max((prev[reactionKey] || 1) - 1, 0)
      }))
    } else {
      setUserReactions(prev => [...prev, reactionKey])
      setReactions(prev => ({
        ...prev,
        [reactionKey]: (prev[reactionKey] || 0) + 1
      }))
    }

    try {
      const result = await toggleReaction(projectId, reactionKey)
      setReactions(normalizeReactions(result.reactions))
      if (result.reacted) {
        setUserReactions(prev => prev.includes(reactionKey) ? prev : [...prev, reactionKey])
      } else {
        setUserReactions(prev => prev.filter(r => r !== reactionKey))
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      // Revert on error
      if (hasReacted) {
        setUserReactions(prev => [...prev, reactionKey])
        setReactions(prev => ({
          ...prev,
          [reactionKey]: (prev[reactionKey] || 0) + 1
        }))
      } else {
        setUserReactions(prev => prev.filter(r => r !== reactionKey))
        setReactions(prev => ({
          ...prev,
          [reactionKey]: Math.max((prev[reactionKey] || 1) - 1, 0)
        }))
      }
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !project || !user) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    const commentContent = newComment.trim()
    const tempId = `temp-${Date.now()}`

    const optimisticComment: CommentResponse = {
      id: tempId,
      content: commentContent,
      authorId: user.id,
      authorName: user.name,
      projectId: project.id,
      createdAt: new Date().toISOString(),
    }

    setComments(prev => [optimisticComment, ...prev])
    setNewComment('')
    setIsSubmitting(true)

    try {
      const comment = await createComment(project.id, commentContent)
      setComments(prev => prev.map(c => c.id === tempId ? comment : c))
    } catch (error) {
      console.error('Failed to post comment:', error)
      setComments(prev => prev.filter(c => c.id !== tempId))
      setNewComment(commentContent)
      toast.error('댓글 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('댓글이 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('댓글 삭제에 실패했습니다.')
    }
    setDeleteCommentId(null)
  }

  const handleWhisperSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whisperMessage.trim() || !project) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      await createWhisper({
        projectId: project.id,
        projectTitle: project.title,
        projectAuthorId: project.authorId,
        content: whisperMessage,
      })

      setIsWhisperSent(true)
      setWhisperMessage('')

      setTimeout(() => {
        setIsWhisperSent(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to send whisper:', error)
      toast.error('귓속말 전송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!project) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (isOwnProject) return

    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

    try {
      const result = await toggleLike(project.id)
      setLiked(result.liked)
      setLikeCount(result.likes)
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setLiked(wasLiked)
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
    }
  }

  const getCTAContent = (platform: string) => {
    switch (platform) {
      case 'APP':
        return { icon: <Smartphone className="w-4 h-4" />, label: '설치하기' }
      case 'GAME':
        return { icon: <Gamepad2 className="w-4 h-4" />, label: '플레이' }
      case 'EXTENSION':
        return { icon: <Puzzle className="w-4 h-4" />, label: '추가하기' }
      case 'LIBRARY':
        return { icon: <Package className="w-4 h-4" />, label: '시작하기' }
      case 'DESIGN':
        return { icon: <Palette className="w-4 h-4" />, label: '살펴보기' }
      case 'WEB':
      default:
        return { icon: <Globe className="w-4 h-4" />, label: '바로가기' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <div className="text-slate-400">맛있는 메뉴를 준비하고 있습니다...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">메뉴를 찾을 수 없습니다</h2>
          <p className="text-slate-500 mb-6">요청하신 메뉴가 존재하지 않습니다.</p>
          <Link href="/dashboard">
            <Button variant="primary" className="bg-orange-600 hover:bg-orange-700">
              메뉴판으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const cta = getCTAContent(project.platform)

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
              <span className="font-medium hidden sm:inline">돌아가기</span>
            </button>
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
              <Image
                src="/sidedish_logo.png"
                alt="SideDish"
                width={32}
                height={32}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
              />
              <span className="font-bold text-slate-900 text-sm sm:text-base">SideDish</span>
            </Link>
            <UserMenu onLoginClick={() => setShowLoginModal(true)} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-28 lg:pb-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-10">
          <div className="flex items-start gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
              {project.title}
            </h1>
            {project.isBeta && (
              <span className="mt-1 sm:mt-2 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-full shrink-0">
                <FlaskConical className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Beta
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500 text-xs sm:text-sm md:text-base border-b border-slate-100 pb-5 sm:pb-8">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-50 rounded-full border border-orange-100">
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span className="font-semibold text-slate-700 text-xs sm:text-sm">{authorProfile?.name || project.authorName} Chef</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
            <div className="flex items-center gap-1 text-red-500 font-medium">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>{likeCount}명이 찜</span>
            </div>
          </div>

          {/* Mobile: Quick Actions */}
          <div className="lg:hidden space-y-3">
            {isOwnProject && (
              <Link href={`/menu/edit/${project.id}`} className="block">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-white/20 p-1.5 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">메뉴 수정하기</p>
                        <p className="text-[11px] text-white/70">내용을 수정하거나 업데이트하세요</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              </Link>
            )}

            {/* Promotion Status - Mobile */}
            {isOwnProject && project.promotionPosts && (
              <PromotionStatusCard promotionPosts={project.promotionPosts} />
            )}

            {project.links && project.links.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                <LinkList links={project.links} compact />
              </div>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-16 pb-24 sm:pb-20">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-12">
            {/* Hero Image */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm aspect-video relative group -mx-3 sm:mx-0">
              <Image
                src={getProjectThumbnail(project)}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </div>

            {/* Description */}
            <div className="prose prose-sm sm:prose-lg prose-slate max-w-none">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                메뉴 소개
              </h3>
              <div className="leading-relaxed text-slate-600 text-sm sm:text-base [&>p]:mb-3 sm:[&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-4 sm:[&>ul]:pl-5 [&>ul]:mb-3 sm:[&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-4 sm:[&>ol]:pl-5 [&>ol]:mb-3 sm:[&>ol]:mb-4 [&_strong]:text-slate-900 [&_strong]:font-semibold [&>h1]:text-lg sm:[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mt-4 sm:[&>h1]:mt-6 [&>h1]:mb-2 sm:[&>h1]:mb-3 [&>h2]:text-base sm:[&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-4 sm:[&>h2]:mt-5 [&>h2]:mb-2 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-3 sm:[&>h3]:mt-4 [&>h3]:mb-2">
                <SafeMarkdown>
                  {project.description || project.shortDescription}
                </SafeMarkdown>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Main Ingredients (재료)
              </h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-xs sm:text-sm hover:border-orange-200 hover:text-orange-600 hover:shadow-sm transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Reaction Bar */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                이 메뉴 맛 평가하기
              </h4>
              {isOwnProject && (
                <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3">자신의 게시물에는 리액션을 남길 수 없습니다.</p>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {REACTION_KEYS.map((key) => {
                  const hasReacted = userReactions.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => handleReaction(key)}
                      disabled={isOwnProject}
                      className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border rounded-full transition-all ${
                        isOwnProject
                          ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
                          : hasReacted
                            ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-400 ring-offset-1'
                            : 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-200 active:scale-95'
                      }`}
                    >
                      <span className={`text-xl sm:text-2xl transition-transform block ${!isOwnProject && 'group-hover:scale-110'}`}>{REACTION_EMOJI_MAP[key]}</span>
                      <span className={`text-xs sm:text-sm font-bold min-w-[1rem] sm:min-w-[1.2rem] ${
                        isOwnProject
                          ? 'text-slate-400'
                          : hasReacted
                            ? 'text-orange-600'
                            : 'text-slate-600 group-hover:text-orange-600'
                      }`}>
                        {reactions[key] || 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Project Updates Timeline */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-6">
              <ProjectUpdateTimeline
                projectId={project.id}
                projectAuthorId={project.authorId}
              />
            </div>

            {/* Comments Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900">미식가들의 한줄평 ({comments.length})</h3>
              </div>

              <form onSubmit={handleCommentSubmit} className="relative group">
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="어땠어요?"
                  className="w-full pl-12 sm:pl-16 pr-12 sm:pr-14 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all resize-none min-h-[80px] sm:min-h-[100px] placeholder:text-slate-400 text-slate-700 text-sm sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 p-1.5 sm:p-2 bg-orange-600 text-white rounded-lg sm:rounded-xl hover:bg-orange-700 disabled:opacity-30 disabled:hover:bg-orange-600 transition-colors shadow-md"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </form>

              <div className="space-y-3 sm:space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100/80">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex-shrink-0 flex items-center justify-center text-orange-600 font-bold text-xs sm:text-sm">
                        {comment.authorName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{comment.authorName}</span>
                            <span className="text-[10px] sm:text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          {user && comment.authorId === user.id && (
                            <button
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{sanitizePlainText(comment.content)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-10 bg-slate-50/50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs sm:text-sm">아직 리뷰가 없어요.<br />첫 리뷰 남겨볼래요?</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {isOwnProject && (
                <Link href={`/menu/edit/${project.id}`} className="block">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">메뉴 수정하기</p>
                          <p className="text-[11px] text-white/70">내용을 수정하거나 업데이트하세요</p>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Promotion Status - Owner only */}
              {isOwnProject && project.promotionPosts && (
                <PromotionStatusCard promotionPosts={project.promotionPosts} />
              )}

              {/* Action Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-lg shadow-slate-200/40">
                <h3 className="text-base font-bold text-slate-900 mb-1">메뉴 시식하기</h3>
                <p className="text-slate-500 text-xs mb-4">직접 맛보러 가기</p>

                <div className="space-y-2">
                  {project.links && project.links.length > 0 ? (
                    <LinkList links={project.links} compact />
                  ) : (
                    <>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="primary" className="w-full py-2.5 rounded-lg text-sm shadow-md shadow-orange-500/20 group bg-orange-600 hover:bg-orange-700 border-orange-600">
                            <span className="mr-2">{cta.label}</span>
                            <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">{cta.icon}</span>
                          </Button>
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="outline" className="w-full py-2.5 rounded-lg text-sm group bg-slate-800 text-white border-slate-800 hover:bg-slate-900 hover:border-slate-900 hover:text-white">
                            <span className="mr-2">레시피(코드) 보기</span>
                            <Github className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant="secondary"
                      onClick={handleLikeToggle}
                      disabled={isOwnProject}
                      title={isOwnProject ? '자신의 게시물은 찜할 수 없습니다' : undefined}
                      className={`w-full py-2.5 rounded-lg text-xs transition-all ${
                        isOwnProject
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                          : liked
                            ? 'bg-pink-500 text-white hover:bg-pink-600'
                            : 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 mr-1 ${liked ? 'fill-current' : ''}`} />
                      {liked ? '찜함' : '찜하기'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full py-2.5 rounded-lg text-xs"
                      onClick={() => setShowShareSheet(true)}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      공유
                    </Button>
                  </div>
                </div>
              </div>

              {/* Secret Feedback Box */}
              <div className="bg-gradient-to-b from-purple-50 to-white rounded-2xl p-4 border border-purple-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                  <MessageSquareMore className="w-16 h-16 text-purple-600" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="bg-purple-100 p-1 rounded-md text-purple-600"><Lock className="w-3 h-3" /></span>
                  셰프에게 귓속말
                </h3>
                <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">
                  작성자에게만 보이는 귓속말이에요.
                </p>

                {!isWhisperSent ? (
                  <form onSubmit={handleWhisperSubmit} className="space-y-2">
                    <textarea
                      value={whisperMessage}
                      onChange={(e) => setWhisperMessage(e.target.value)}
                      placeholder="버그 제보나 개선 아이디어를 남겨주세요."
                      className="w-full p-2.5 text-xs bg-white/80 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none h-20 placeholder:text-slate-400"
                    />
                    <Button
                      type="submit"
                      disabled={!whisperMessage.trim()}
                      className="w-full py-2 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      귓속말 보내기
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 bg-white/50 rounded-lg border border-purple-100 animate-in fade-in zoom-in">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1.5">
                      <Send className="w-4 h-4" />
                    </div>
                    <p className="text-slate-800 font-bold text-xs">메시지 보냈어요!</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">셰프가 곧 확인할 거예요</p>
                  </div>
                )}
              </div>

              {/* Author Card */}
              <Link
                href={`/profile/${project.authorId}`}
                className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex items-center gap-3 hover:bg-slate-100/50 hover:border-orange-200 transition-colors group"
              >
                {authorProfile?.avatarUrl ? (
                  <Image
                    src={authorProfile.avatarUrl}
                    alt={authorProfile?.name || project.authorName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:ring-2 group-hover:ring-orange-300 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm shrink-0 group-hover:ring-2 group-hover:ring-orange-300 transition-all">
                    {(authorProfile?.name || project.authorName).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-xs group-hover:text-orange-600 transition-colors">{authorProfile?.name || project.authorName}</div>
                  <div className="text-[11px] text-slate-500">Head Chef</div>
                </div>
                <div className="text-slate-400 group-hover:text-orange-500 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: Sidebar Content */}
        <div className="lg:hidden space-y-4 mt-6 mb-20">
          {/* Secret Feedback Box - Mobile */}
          <div className="bg-gradient-to-b from-purple-50 to-white rounded-xl p-4 border border-purple-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
              <MessageSquareMore className="w-12 h-12 text-purple-600" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="bg-purple-100 p-1 rounded-md text-purple-600"><Lock className="w-3 h-3" /></span>
              셰프에게 귓속말
            </h3>
            <p className="text-slate-500 text-[11px] mb-3">
              작성자에게만 보이는 귓속말이에요.
            </p>

            {!isWhisperSent ? (
              <form onSubmit={handleWhisperSubmit} className="space-y-2">
                <textarea
                  value={whisperMessage}
                  onChange={(e) => setWhisperMessage(e.target.value)}
                  placeholder="버그 제보나 개선 아이디어를 남겨주세요."
                  className="w-full p-2.5 text-xs bg-white/80 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none h-20 placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  disabled={!whisperMessage.trim()}
                  className="w-full py-2 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  귓속말 보내기
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 bg-white/50 rounded-lg border border-purple-100 animate-in fade-in zoom-in">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1.5">
                  <Send className="w-4 h-4" />
                </div>
                <p className="text-slate-800 font-bold text-xs">메시지 보냈어요!</p>
              </div>
            )}
          </div>

          {/* Author Card - Mobile */}
          <Link
            href={`/profile/${project.authorId}`}
            className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex items-center gap-3 hover:bg-slate-100/50 transition-colors group"
          >
            {authorProfile?.avatarUrl ? (
              <Image
                src={authorProfile.avatarUrl}
                alt={authorProfile?.name || project.authorName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                {(authorProfile?.name || project.authorName).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-xs">{authorProfile?.name || project.authorName}</div>
              <div className="text-[11px] text-slate-500">Head Chef</div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* Primary CTA - 링크가 있을 때 */}
          {(project.links?.length ?? 0) > 0 ? (() => {
            const primaryLink = project.links?.find(l => l.isPrimary) || project.links?.[0]
            const config = primaryLink ? getStoreConfig(primaryLink.storeType) : null
            const ctaLabel = primaryLink?.label || config?.shortLabel || '방문하기'
            return (
              <a
                href={primaryLink?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 text-white font-semibold rounded-xl shadow-md active:scale-[0.98] transition-transform"
              >
                {config?.icon || <Globe className="w-4 h-4" />}
                <span className="text-sm">{ctaLabel}</span>
              </a>
            )
          })() : project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 text-white font-semibold rounded-xl shadow-md active:scale-[0.98] transition-transform"
            >
              {cta.icon}
              <span className="text-sm">{cta.label}</span>
            </a>
          ) : (
            /* 링크가 없을 때 찜 버튼을 넓게 */
            <button
              onClick={handleLikeToggle}
              disabled={isOwnProject}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                isOwnProject
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : liked
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-pink-50 text-pink-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{liked ? '찜함' : '찜하기'} ({likeCount})</span>
            </button>
          )}

          {/* 링크가 있을 때만 별도의 찜 버튼 표시 */}
          {((project.links?.length ?? 0) > 0 || project.link) && (
            <button
              onClick={handleLikeToggle}
              disabled={isOwnProject}
              className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-medium transition-all active:scale-[0.98] ${
                isOwnProject
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : liked
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-50 text-pink-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
          )}

          <button
            onClick={() => setShowShareSheet(true)}
            className="flex items-center justify-center py-3 px-4 rounded-xl bg-slate-100 text-slate-600 active:scale-[0.98] transition-transform"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <ConfirmModal
        isOpen={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
        title="댓글 삭제"
        message="댓글을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        data={{
          title: project.title,
          text: project.shortDescription,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }}
      />
    </div>
  )
}
