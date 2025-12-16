'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Hash, Upload, Image as ImageIcon, Smartphone, Globe, Gamepad2, Palette, Box, Github, Wand2, ChefHat, Utensils, X, Loader2, Clock, AlertCircle } from 'lucide-react'
import Button from '@/components/Button'
import AiCandidateSelector from '@/components/AiCandidateSelector'
import { ProjectPlatform, AiGenerationCandidate, AiGeneratedContent } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { getProject, updateProject, uploadImage, generateAiContent, getAiUsageInfo, ApiError } from '@/lib/api-client'
import { ProjectResponse } from '@/lib/db-types'
import LoginModal from '@/components/LoginModal'

// Helper functions for managing AI candidates in localStorage (per project)
const AI_CANDIDATES_KEY = 'sidedish_edit_ai_candidates'

interface ProjectAiCandidates {
  projectId: string
  candidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
}

const getProjectAiCandidates = (projectId: string): ProjectAiCandidates | null => {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(`${AI_CANDIDATES_KEY}_${projectId}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const saveProjectAiCandidates = (data: ProjectAiCandidates): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${AI_CANDIDATES_KEY}_${data.projectId}`, JSON.stringify(data))
}

const generateCandidateId = (): string => {
  return `candidate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const MIN_DESCRIPTION_LENGTH = 30
const DEFAULT_MAX_PER_DRAFT = 3
const DEFAULT_MAX_PER_DAY = 10

const platformOptions: { value: ProjectPlatform; label: string; icon: React.ReactNode }[] = [
  { value: 'WEB', label: '웹 서비스', icon: <Globe className="w-4 h-4" /> },
  { value: 'APP', label: '모바일 앱', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'GAME', label: '게임', icon: <Gamepad2 className="w-4 h-4" /> },
  { value: 'DESIGN', label: '디자인/작품', icon: <Palette className="w-4 h-4" /> },
  { value: 'OTHER', label: '기타', icon: <Box className="w-4 h-4" /> },
]

const getLinkConfig = (platform: ProjectPlatform) => {
  switch (platform) {
    case 'WEB':
      return {
        label: '서비스 주소 (URL)',
        placeholder: 'https://myservice.com',
        desc: '유저들이 맛볼 수 있는 웹사이트 주소를 입력해주세요.'
      }
    case 'APP':
      return {
        label: '다운로드 링크 (App Store/Play Store)',
        placeholder: 'https://apps.apple.com/... 또는 https://play.google.com/...',
        desc: '앱을 설치할 수 있는 스토어 링크를 입력해주세요.'
      }
    case 'GAME':
      return {
        label: '플레이 / 다운로드 링크',
        placeholder: 'https://store.steampowered.com/... 또는 https://itch.io/...',
        desc: '게임을 바로 즐길 수 있는 링크를 입력해주세요.'
      }
    case 'DESIGN':
      return {
        label: '포트폴리오 주소',
        placeholder: 'https://behance.net/... 또는 https://notion.so/...',
        desc: '작품을 감상할 수 있는 페이지 링크를 입력해주세요.'
      }
    default:
      return {
        label: '프로젝트 링크',
        placeholder: '프로젝트를 확인할 수 있는 URL',
        desc: '프로젝트와 관련된 웹페이지 주소를 입력해주세요.'
      }
  }
}

interface FormData {
  title: string
  shortDescription: string
  description: string
  tags: string[]
  imageUrl: string
  link: string
  githubUrl: string
  platform: ProjectPlatform
}

export default function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    shortDescription: '',
    description: '',
    tags: [],
    imageUrl: '',
    link: '',
    githubUrl: '',
    platform: 'WEB'
  })
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // AI limit state (fetched from server)
  const [aiLimitInfo, setAiLimitInfo] = useState({
    remainingForDraft: DEFAULT_MAX_PER_DRAFT,
    remainingForDay: DEFAULT_MAX_PER_DAY,
    maxPerDraft: DEFAULT_MAX_PER_DRAFT,
    maxPerDay: DEFAULT_MAX_PER_DAY,
    cooldownRemaining: 0,
  })
  const [aiError, setAiError] = useState<string | null>(null)

  // AI candidates state
  const [aiCandidates, setAiCandidates] = useState<AiGenerationCandidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const found = await getProject(id)
        if (found) {
          setProject(found)
          setFormData({
            title: found.title,
            shortDescription: found.shortDescription,
            description: found.description,
            tags: found.tags,
            imageUrl: found.imageUrl,
            link: found.link,
            githubUrl: found.githubUrl || '',
            platform: found.platform
          })

          // Load saved AI candidates for this project
          const savedCandidates = getProjectAiCandidates(found.id)
          if (savedCandidates) {
            setAiCandidates(savedCandidates.candidates)
            setSelectedCandidateId(savedCandidates.selectedCandidateId)
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProject()
  }, [id])

  // Check if user is authorized to edit
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginModal(true)
    }
  }, [authLoading, isAuthenticated])

  // Check ownership when both project and user are loaded
  useEffect(() => {
    if (project && user && project.authorId !== user.id) {
      alert('이 메뉴를 수정할 권한이 없습니다.')
      router.push('/mypage')
    }
  }, [project, user, router])

  // Fetch AI usage info when project is loaded
  useEffect(() => {
    if (project && user) {
      // Use project ID as draft ID for edit page
      getAiUsageInfo(project.id)
        .then(usage => {
          setAiLimitInfo(prev => ({
            ...prev,
            remainingForDraft: usage.remainingForDraft,
            remainingForDay: usage.remainingForDay,
            maxPerDraft: usage.maxPerDraft,
            maxPerDay: usage.maxPerDay,
          }))
        })
        .catch(err => {
          console.error('Failed to fetch AI usage info:', err)
        })
    }
  }, [project, user])

  // Cooldown timer
  useEffect(() => {
    if (aiLimitInfo.cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setAiLimitInfo(prev => ({
          ...prev,
          cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1),
        }))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [aiLimitInfo.cooldownRemaining])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.")
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim()) && formData.tags.length < 5) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleAiGenerate = async () => {
    if (!project || !user?.id) return

    setAiError(null)

    // Validate minimum description length
    if (formData.description.length < MIN_DESCRIPTION_LENGTH) {
      setAiError(`최소 ${MIN_DESCRIPTION_LENGTH}자 이상의 설명을 입력해주세요. (현재 ${formData.description.length}자)`)
      return
    }

    // Pre-check limits (client-side, for UX)
    if (aiLimitInfo.remainingForDraft <= 0) {
      setAiError(`이 프로젝트는 이미 ${aiLimitInfo.maxPerDraft}번 AI 생성을 사용했습니다.`)
      return
    }

    if (aiLimitInfo.remainingForDay <= 0) {
      setAiError(`오늘의 AI 생성 한도(${aiLimitInfo.maxPerDay}회)를 모두 사용했습니다.`)
      return
    }

    setIsAiLoading(true)
    try {
      // Use project ID as draft ID for edit page
      const result = await generateAiContent(project.id, formData.description)

      // Create new candidate
      const newCandidate: AiGenerationCandidate = {
        id: generateCandidateId(),
        content: {
          shortDescription: result.shortDescription,
          description: result.description,
          tags: result.tags,
          generatedAt: result.generatedAt,
        },
        isSelected: true,
      }

      // Update candidates: deselect all previous, add new one
      const updatedCandidates = aiCandidates.map(c => ({ ...c, isSelected: false }))
      updatedCandidates.push(newCandidate)

      setAiCandidates(updatedCandidates)
      setSelectedCandidateId(newCandidate.id)

      // Save to localStorage
      saveProjectAiCandidates({
        projectId: project.id,
        candidates: updatedCandidates,
        selectedCandidateId: newCandidate.id,
      })

      setFormData(prev => ({
        ...prev,
        shortDescription: result.shortDescription,
        description: result.description,
        tags: result.tags
      }))

      // Update limit info from server response
      setAiLimitInfo(prev => ({
        ...prev,
        remainingForDraft: result.usage.remainingForDraft,
        remainingForDay: result.usage.remainingForDay,
        maxPerDraft: result.usage.maxPerDraft,
        maxPerDay: result.usage.maxPerDay,
        cooldownRemaining: 5,
      }))
    } catch (error) {
      console.error(error)
      if (error instanceof ApiError) {
        setAiError(error.message)
        if (error.status === 429 && project) {
          getAiUsageInfo(project.id)
            .then(usage => {
              setAiLimitInfo(prev => ({
                ...prev,
                remainingForDraft: usage.remainingForDraft,
                remainingForDay: usage.remainingForDay,
              }))
            })
            .catch(() => {})
        }
      } else {
        setAiError('AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCandidateSelect = (candidateId: string) => {
    if (!project) return

    const candidate = aiCandidates.find(c => c.id === candidateId)
    if (!candidate) return

    // Update candidates selection state
    const updatedCandidates = aiCandidates.map(c => ({
      ...c,
      isSelected: c.id === candidateId,
    }))

    setAiCandidates(updatedCandidates)
    setSelectedCandidateId(candidateId)

    // Save to localStorage
    saveProjectAiCandidates({
      projectId: project.id,
      candidates: updatedCandidates,
      selectedCandidateId: candidateId,
    })

    // Apply selected candidate's content to form
    setFormData(prev => ({
      ...prev,
      shortDescription: candidate.content.shortDescription,
      description: candidate.content.description,
      tags: candidate.content.tags,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!formData.title || !formData.shortDescription) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    if (!project) return

    setIsSubmitting(true)
    try {
      let imageUrl = formData.imageUrl

      // Upload image if a new file was selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadImage(selectedFile)
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Image upload failed:', error)
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
          setIsSubmitting(false)
          return
        }
      }

      // Update project via API
      await updateProject(project.id, {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        tags: formData.tags,
        imageUrl: imageUrl,
        link: formData.link,
        githubUrl: formData.githubUrl,
        platform: formData.platform,
      })

      router.push('/mypage')
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('메뉴 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const linkConfig = getLinkConfig(formData.platform)

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <div className="text-slate-400">로딩 중...</div>
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
          <Link href="/mypage">
            <Button variant="primary" className="bg-orange-600 hover:bg-orange-700">
              마이페이지로 돌아가기
            </Button>
          </Link>
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
            <p className="text-slate-500 mb-6">메뉴를 수정하려면 로그인해주세요.</p>
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
          onClose={() => {
            setShowLoginModal(false)
            router.push('/dashboard')
          }}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/mypage"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-slate-900">메뉴 수정</span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <ChefHat className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">메뉴 수정</h1>
                  <p className="text-white/80 mt-1">등록한 메뉴의 정보를 수정합니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">메뉴 이름 (프로젝트명) <span className="text-orange-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="예: 제주도 감성 여행 가이드"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <ChefHat className="w-4 h-4 text-slate-500" />
                  총괄 셰프 (작성자)
                </label>
                <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600">
                  {user?.name || '알 수 없음'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">메뉴 유형 <span className="text-orange-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {platformOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, platform: opt.value }))}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${formData.platform === opt.value
                      ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    <div className="mb-1">{opt.icon}</div>
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">메뉴 사진 (썸네일)</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div
                  className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange-300 group cursor-pointer transition-all flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(previewUrl || formData.imageUrl) ? (
                    <>
                      <Image src={previewUrl || formData.imageUrl} alt="Thumbnail preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-90 group-hover:scale-100">
                          <Upload className="w-4 h-4 text-slate-700" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">사진 업로드</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-3">
                  <div className="space-y-1">
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                      placeholder="또는 이미지 URL을 직접 입력하세요"
                    />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 pl-1">
                    <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 보기 좋은 떡이 먹기도 좋습니다 (16:9 권장)</p>
                    <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 5MB 이하의 JPG, PNG 파일을 업로드해주세요.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generation Section integrated with Description */}
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <div>
                  <label className="text-sm font-bold text-slate-700">상세 레시피 (설명)</label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    최소 {MIN_DESCRIPTION_LENGTH}자 이상 작성 후 AI 생성이 가능합니다
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>오늘 {aiLimitInfo.remainingForDay}회 남음</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={
                      formData.description.length < MIN_DESCRIPTION_LENGTH ||
                      isAiLoading ||
                      aiLimitInfo.remainingForDraft === 0 ||
                      aiLimitInfo.cooldownRemaining > 0
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                  >
                    {aiLimitInfo.cooldownRemaining > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        {aiLimitInfo.cooldownRemaining}초
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        AI 셰프가 대신 작성하기 ({aiLimitInfo.remainingForDraft}/{aiLimitInfo.maxPerDraft})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Error Message */}
              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="relative group">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 pb-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                  placeholder="이 메뉴의 특별한 맛과 특징을 자유롭게 적어주세요."
                />

                {/* Character count */}
                <div className={`absolute bottom-3 left-3 text-xs ${formData.description.length >= MIN_DESCRIPTION_LENGTH ? 'text-green-600' : 'text-slate-400'}`}>
                  {formData.description.length}자
                  {formData.description.length < MIN_DESCRIPTION_LENGTH && (
                    <span className="text-slate-400"> / 최소 {MIN_DESCRIPTION_LENGTH}자</span>
                  )}
                </div>

                {isAiLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-20">
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-orange-50 flex flex-col items-center animate-in zoom-in duration-300">
                      <Sparkles className="w-8 h-8 text-orange-500 animate-pulse mb-2" />
                      <span className="text-sm font-bold text-slate-800">AI 셰프가 요리 중...</span>
                      <span className="text-xs text-slate-500 mt-1">맛깔난 소개글과 재료를 준비하고 있습니다.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Candidate Selector */}
              {aiCandidates.length > 0 && (
                <AiCandidateSelector
                  candidates={aiCandidates}
                  selectedCandidateId={selectedCandidateId}
                  onSelect={handleCandidateSelect}
                  remainingGenerations={aiLimitInfo.remainingForDraft}
                  maxGenerations={aiLimitInfo.maxPerDraft}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">한 줄 소개 <span className="text-orange-500">*</span></label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="위의 AI 버튼을 누르면 자동으로 생성됩니다."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                주요 재료 (키워드/카테고리)
                <span className="text-xs font-normal text-slate-400 ml-1">(최대 5개)</span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition-all bg-white">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-white border border-slate-200 text-slate-700 text-sm px-3 py-1 rounded-lg flex items-center shadow-sm animate-in zoom-in duration-200">
                    <Hash className="w-3 h-3 mr-1 text-slate-400" />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 outline-none min-w-[120px] bg-transparent text-sm py-1 placeholder:text-slate-400"
                  placeholder={formData.tags.length === 0 ? "태그 입력 후 Enter" : "재료 추가..."}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{linkConfig.label} (선택)</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder={linkConfig.placeholder}
                />
                <p className="text-xs text-slate-500 px-1">{linkConfig.desc}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  GitHub 링크 <span className="text-xs font-normal text-slate-400">(선택)</span>
                </label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="소스코드가 있다면 공유해주세요"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <Link href="/mypage">
                <Button type="button" variant="ghost" className="w-full sm:w-auto px-6" disabled={isSubmitting}>취소</Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                disabled={isSubmitting || !isAuthenticated}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    수정 중...
                  </span>
                ) : (
                  '수정 완료'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          if (!isAuthenticated) {
            router.push('/dashboard')
          }
        }}
        onSuccess={() => setShowLoginModal(false)}
      />
    </div>
  )
}
