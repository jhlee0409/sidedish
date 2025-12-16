'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Heart, Calendar, Share2, Hash, MessageCircle, Send,
  Sparkles, Lock, MessageSquareMore, Smartphone, Gamepad2, Palette,
  Globe, Github, User, ChefHat, Utensils, Loader2, Trash2
} from 'lucide-react'
import Markdown from 'react-markdown'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import {
  getProject,
  getProjectComments,
  createComment,
  deleteComment,
  toggleLike,
  checkLiked,
  addReaction,
  createWhisper,
} from '@/lib/api-client'
import { ProjectResponse, CommentResponse } from '@/lib/db-types'
import { REACTION_EMOJI_MAP, REACTION_KEYS, normalizeReactions } from '@/lib/constants'
import { getProjectThumbnail } from '@/lib/og-utils'
import LoginModal from '@/components/LoginModal'

export default function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reactions, setReactions] = useState<{ [key: string]: number }>({})
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [newComment, setNewComment] = useState('')
  const [whisperMessage, setWhisperMessage] = useState('')
  const [isWhisperSent, setIsWhisperSent] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true)
        const [projectData, commentsData] = await Promise.all([
          getProject(id),
          getProjectComments(id),
        ])

        setProject(projectData)
        setReactions(normalizeReactions(projectData.reactions || {}))
        setComments(commentsData)
        setLikeCount(projectData.likes)

        // Check if user has liked this project
        if (isAuthenticated) {
          try {
            const likeStatus = await checkLiked(id)
            setLiked(likeStatus.liked)
          } catch {
            // User might not be authenticated, ignore error
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id, isAuthenticated])

  // Check if this is the user's own project
  const isOwnProject = user?.id === project?.authorId

  const handleReaction = async (reactionKey: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (isOwnProject) {
      return
    }

    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [reactionKey]: (prev[reactionKey] || 0) + 1
    }))

    try {
      const result = await addReaction(id, reactionKey)
      setReactions(result.reactions)
    } catch (error) {
      console.error('Failed to add reaction:', error)
      // Revert on error
      setReactions(prev => ({
        ...prev,
        [reactionKey]: Math.max((prev[reactionKey] || 1) - 1, 0)
      }))
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !project) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      const comment = await createComment(project.id, newComment)
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Failed to post comment:', error)
      alert('댓글 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('댓글 삭제에 실패했습니다.')
    }
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
      alert('비밀 메시지 전송에 실패했습니다.')
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

    if (isOwnProject) {
      return
    }

    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

    try {
      const result = await toggleLike(project.id)
      setLiked(result.liked)
      setLikeCount(result.likes)
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // Revert on error
      setLiked(wasLiked)
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
    }
  }

  const getCTAContent = (platform: string) => {
    switch (platform) {
      case 'APP':
        return { icon: <Smartphone className="w-4 h-4" />, label: '앱 맛보기 (다운로드)' }
      case 'GAME':
        return { icon: <Gamepad2 className="w-4 h-4" />, label: '게임 한 판 하기' }
      case 'DESIGN':
        return { icon: <Palette className="w-4 h-4" />, label: '작품 감상하기' }
      case 'WEB':
      default:
        return { icon: <Globe className="w-4 h-4" />, label: '웹사이트 방문하기' }
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
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">돌아가기</span>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/sidedish_logo.png"
                alt="SideDish"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
              <span className="font-bold text-slate-900">SideDish</span>
            </Link>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="space-y-6 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm md:text-base border-b border-slate-100 pb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
              <ChefHat className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-slate-700">{project.authorName} Chef</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1 text-red-500 font-medium">
              <Heart className="w-4 h-4 fill-current" />
              <span>{likeCount}명이 찜했습니다</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 pb-20">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Hero Image */}
            <div className="rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm aspect-video relative group">
              <Image
                src={getProjectThumbnail(project)}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Description */}
            <div className="prose prose-lg prose-slate max-w-none">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-orange-500" />
                메뉴 소개
              </h3>
              <div className="leading-relaxed text-slate-600 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&_strong]:text-slate-900 [&_strong]:font-semibold [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-5 [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2">
                <Markdown>
                  {project.description || project.shortDescription}
                </Markdown>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Hash className="w-4 h-4" /> Main Ingredients (재료)
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium text-sm hover:border-orange-200 hover:text-orange-600 hover:shadow-sm transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Reaction Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                이 메뉴 맛 평가하기
              </h4>
              {isOwnProject && (
                <p className="text-sm text-slate-400 mb-3">자신의 게시물에는 리액션을 남길 수 없습니다.</p>
              )}
              <div className="flex flex-wrap gap-3">
                {REACTION_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleReaction(key)}
                    disabled={isOwnProject}
                    className={`group flex items-center gap-2 px-4 py-2.5 border rounded-full transition-all ${
                      isOwnProject
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
                        : 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-200 active:scale-95'
                    }`}
                  >
                    <span className={`text-2xl transition-transform block ${!isOwnProject && 'group-hover:scale-110'}`}>{REACTION_EMOJI_MAP[key]}</span>
                    <span className={`text-sm font-bold min-w-[1.2rem] ${isOwnProject ? 'text-slate-400' : 'text-slate-600 group-hover:text-orange-600'}`}>
                      {reactions[key] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-slate-900" />
                <h3 className="text-2xl font-bold text-slate-900">미식가들의 한줄평 ({comments.length})</h3>
              </div>

              <form onSubmit={handleCommentSubmit} className="relative group">
                <div className="absolute top-4 left-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="이 메뉴에 대한 솔직한 감상평을 남겨주세요..."
                  className="w-full pl-16 pr-14 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all resize-none min-h-[100px] placeholder:text-slate-400 text-slate-700"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-4 right-4 p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-30 disabled:hover:bg-orange-600 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100/80">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex-shrink-0 flex items-center justify-center text-orange-600 font-bold text-sm">
                        {comment.authorName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{comment.authorName}</span>
                            <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          {user && comment.authorId === user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">아직 등록된 리뷰가 없습니다.<br />첫 번째 미식가가 되어주세요!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Action Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-bold text-slate-900 mb-2">메뉴 시식하기</h3>
                <p className="text-slate-500 text-sm mb-6">직접 방문해서 셰프의 요리를 맛보세요.</p>

                <div className="space-y-3">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="primary" className="w-full py-4 rounded-xl text-base shadow-lg shadow-orange-500/20 group bg-orange-600 hover:bg-orange-700 border-orange-600">
                        <span className="mr-2">{cta.label}</span>
                        <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">{cta.icon}</span>
                      </Button>
                    </a>
                  )}
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full py-4 rounded-xl text-base group bg-slate-800 text-white border-slate-800 hover:bg-slate-900 hover:border-slate-900 hover:text-white">
                        <span className="mr-2">레시피(코드) 보기</span>
                        <Github className="w-4 h-4" />
                      </Button>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Button
                      variant="secondary"
                      onClick={handleLikeToggle}
                      disabled={isOwnProject}
                      title={isOwnProject ? '자신의 게시물은 찜할 수 없습니다' : undefined}
                      className={`w-full py-4 rounded-xl text-sm transition-all ${
                        isOwnProject
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                          : liked
                            ? 'bg-pink-500 text-white hover:bg-pink-600'
                            : 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-1.5 ${liked ? 'fill-current' : ''}`} />
                      {liked ? '찜함' : '찜하기'}
                    </Button>
                    <Button variant="outline" className="w-full py-4 rounded-xl text-sm">
                      <Share2 className="w-4 h-4 mr-1.5" />
                      공유
                    </Button>
                  </div>
                </div>
              </div>

              {/* Secret Feedback Box */}
              <div className="bg-gradient-to-b from-purple-50 to-white rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <MessageSquareMore className="w-24 h-24 text-purple-600" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><Lock className="w-4 h-4" /></span>
                  셰프에게 보내는 비밀 쪽지
                </h3>
                <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                  작성자에게만 보이는 비밀 메시지입니다.<br />
                  &quot;이 부분은 조금 짠 것 같아요(버그)&quot; 같은 피드백을 남겨주세요.
                </p>

                {!isWhisperSent ? (
                  <form onSubmit={handleWhisperSubmit} className="space-y-3">
                    <textarea
                      value={whisperMessage}
                      onChange={(e) => setWhisperMessage(e.target.value)}
                      placeholder="따뜻한 조언이나 발견한 버그를 제보해주세요."
                      className="w-full p-3 text-sm bg-white/80 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none h-24 placeholder:text-slate-400"
                    />
                    <Button
                      type="submit"
                      disabled={!whisperMessage.trim()}
                      className="w-full py-3 rounded-xl text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      비밀 메시지 보내기
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-36 bg-white/50 rounded-xl border border-purple-100 animate-in fade-in zoom-in">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                      <Send className="w-5 h-5" />
                    </div>
                    <p className="text-slate-800 font-bold text-sm">소중한 의견 감사합니다!</p>
                    <p className="text-slate-500 text-xs mt-1">셰프에게 잘 전달되었습니다.</p>
                  </div>
                )}
              </div>

              {/* Author Card */}
              <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                  {project.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{project.authorName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Head Chef</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}
