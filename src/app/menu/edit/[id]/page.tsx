'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft, Sparkles, Hash, Upload, Image as ImageIcon,
  Wand2, ChefHat, Utensils, X, Loader2, Clock, AlertCircle, FlaskConical
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import AiCandidateSelector from '@/components/AiCandidateSelector'
import MultiLinkInput from '@/components/MultiLinkInput'
import { AiGenerationCandidate, StoreType } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { getProject, updateProject, uploadImage, generateAiContent, getAiUsageInfo, ApiError } from '@/lib/api-client'
import { ProjectResponse } from '@/lib/db-types'
import LoginModal from '@/components/LoginModal'
import { projectFormSchema, type ProjectFormData } from '@/lib/schemas'

// 리팩토링된 상수 및 설정
import { AI_CONSTRAINTS } from '@/lib/form-constants'
import { PLATFORM_OPTIONS } from '@/lib/platform-config'

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

export default function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      shortDescription: '',
      description: '',
      tags: [],
      imageUrl: '',
      links: [],
      platform: 'WEB',
      isBeta: false
    }
  })

  // Watch form values
  const watchedValues = watch()

  // AI limit state (fetched from server)
  const [aiLimitInfo, setAiLimitInfo] = useState<{
    remainingForDraft: number
    remainingForDay: number
    maxPerDraft: number
    maxPerDay: number
    cooldownRemaining: number
  }>({
    remainingForDraft: AI_CONSTRAINTS.MAX_PER_DRAFT,
    remainingForDay: AI_CONSTRAINTS.MAX_PER_DAY,
    maxPerDraft: AI_CONSTRAINTS.MAX_PER_DRAFT,
    maxPerDay: AI_CONSTRAINTS.MAX_PER_DAY,
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
          reset({
            title: found.title,
            shortDescription: found.shortDescription,
            description: found.description,
            tags: found.tags,
            imageUrl: found.imageUrl,
            link: found.link || '',
            githubUrl: found.githubUrl || '',
            links: (found.links || []).map(l => ({
              id: l.id,
              storeType: l.storeType,
              url: l.url,
              label: l.label || '',
              isPrimary: l.isPrimary,
            })),
            platform: found.platform as 'WEB' | 'APP' | 'GAME' | 'EXTENSION' | 'LIBRARY' | 'DESIGN' | 'OTHER',
            isBeta: found.isBeta ?? false
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
  }, [id, reset])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Check ownership when both project and user are loaded
  useEffect(() => {
    if (project && user && project.authorId !== user.id) {
      toast.error('이 메뉴를 수정할 권한이 없습니다.')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.")
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
      const currentTags = watchedValues.tags || []
      if (!currentTags.includes(tagInput.trim()) && currentTags.length < 5) {
        setValue('tags', [...currentTags, tagInput.trim()], { shouldValidate: true })
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = watchedValues.tags || []
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldValidate: true })
  }

  const handleAiGenerate = async () => {
    if (!project || !user?.id) return

    setAiError(null)

    // Validate minimum description length
    if (watchedValues.description.length < AI_CONSTRAINTS.MIN_DESC_LENGTH) {
      setAiError(`최소 ${AI_CONSTRAINTS.MIN_DESC_LENGTH}자 이상의 설명을 입력해주세요. (현재 ${watchedValues.description.length}자)`)
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
      const result = await generateAiContent(project.id, watchedValues.description)

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

      setValue('shortDescription', result.shortDescription, { shouldValidate: true })
      setValue('description', result.description, { shouldValidate: true })
      setValue('tags', result.tags, { shouldValidate: true })

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
    setValue('shortDescription', candidate.content.shortDescription, { shouldValidate: true })
    setValue('description', candidate.content.description, { shouldValidate: true })
    setValue('tags', candidate.content.tags, { shouldValidate: true })
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!project) return

    setIsSubmitting(true)
    try {
      let imageUrl = data.imageUrl

      // Upload image if a new file was selected
      if (selectedFile) {
        try {
          // Use actual project ID as entityId
          const uploadResult = await uploadImage(selectedFile, 'project', id)
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Image upload failed:', error)
          toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
          setIsSubmitting(false)
          return
        }
      }

      // links에서 대표 링크를 link 필드로 설정 (하위 호환성)
      const primaryLink = data.links.find(l => l.isPrimary) || data.links[0]
      const githubLink = data.links.find(l => l.storeType === 'GITHUB')

      // Update project via API
      await updateProject(project.id, {
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        tags: data.tags,
        imageUrl: imageUrl,
        link: primaryLink?.url || '',
        githubUrl: githubLink?.url || '',
        links: data.links.map(l => ({
          ...l,
          storeType: l.storeType as StoreType,
        })),
        platform: data.platform,
        isBeta: data.isBeta,
      })

      router.push('/mypage')
    } catch (error) {
      console.error('Failed to update project:', error)
      toast.error('메뉴 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          onClose={() => setShowLoginModal(false)}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base hidden sm:inline">돌아가기</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <span className="font-bold text-slate-900 text-sm sm:text-base">메뉴 수정</span>
            </div>
            <div className="w-16 sm:w-24" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-4xl">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-5 sm:px-8 py-8 sm:py-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">메뉴 수정</h1>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">등록한 메뉴의 정보를 수정합니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700">메뉴 이름 (프로젝트명) <span className="text-orange-500">*</span></label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-sm sm:text-base"
                      placeholder="예: 제주도 감성 여행 가이드"
                    />
                  )}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  총괄 셰프 (작성자)
                </label>
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 text-sm sm:text-base">
                  {user?.name || '알 수 없음'}
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-bold text-slate-700">메뉴 유형 <span className="text-orange-500">*</span></label>
              <Controller
                name="platform"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all text-left ${field.value === opt.value
                          ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                      >
                        <div className={`shrink-0 ${field.value === opt.value ? 'text-orange-500' : 'text-slate-400'}`}>
                          {opt.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold truncate">{opt.label}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">{opt.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Beta 체크박스 */}
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
              <div className="flex items-center h-4 sm:h-5">
                <Controller
                  name="isBeta"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="isBeta"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 bg-white border-amber-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                    />
                  )}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="isBeta" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-amber-800 cursor-pointer">
                  <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Beta / 개발 중인 프로젝트
                </label>
                <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 sm:mt-1 leading-relaxed">
                  아직 완성되지 않았거나 개선 중인 프로젝트라면 체크해주세요.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">메뉴 사진 (썸네일)</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div
                  className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange-300 group cursor-pointer transition-all flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(previewUrl || watchedValues.imageUrl) ? (
                    <>
                      <Image src={previewUrl || watchedValues.imageUrl} alt="Thumbnail preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-90 group-hover:scale-100">
                          <Upload className="w-4 h-4 text-slate-700" />
                        </div>
                      </div>
                      {isSubmitting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
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
                    <Controller
                      name="imageUrl"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                          placeholder="또는 이미지 URL을 직접 입력하세요"
                        />
                      )}
                    />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 pl-1">
                    <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 보기 좋은 떡이 먹기도 좋습니다 (16:9 권장)</p>
                    <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 5MB 이하의 JPG, PNG 파일을 업로드해주세요.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Candidate Selector - Always show 3 buttons below thumbnail */}
            <AiCandidateSelector
              candidates={aiCandidates}
              selectedCandidateId={selectedCandidateId}
              onSelect={handleCandidateSelect}
              maxGenerations={aiLimitInfo.maxPerDraft}
            />

            {/* AI Generation Section integrated with Description */}
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <div>
                  <label className="text-sm font-bold text-slate-700">상세 레시피 (설명)</label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    최소 {AI_CONSTRAINTS.MIN_DESC_LENGTH}자 이상 작성 후 AI 생성이 가능합니다
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
                      watchedValues.description.length < AI_CONSTRAINTS.MIN_DESC_LENGTH ||
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
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={6}
                      className="w-full px-4 py-3 pb-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                      placeholder="이 메뉴의 특별한 맛과 특징을 자유롭게 적어주세요."
                    />
                  )}
                />

                {/* Character count */}
                <div className={`absolute bottom-3 left-3 text-xs ${watchedValues.description.length >= AI_CONSTRAINTS.MIN_DESC_LENGTH ? 'text-green-600' : 'text-slate-400'}`}>
                  {watchedValues.description.length}자
                  {watchedValues.description.length < AI_CONSTRAINTS.MIN_DESC_LENGTH && (
                    <span className="text-slate-400"> / 최소 {AI_CONSTRAINTS.MIN_DESC_LENGTH}자</span>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">한 줄 소개 <span className="text-orange-500">*</span></label>
              <Controller
                name="shortDescription"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="위의 AI 버튼을 누르면 자동으로 생성됩니다."
                  />
                )}
              />
              {errors.shortDescription && <p className="text-xs text-red-500 mt-1">{errors.shortDescription.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                주요 재료 (키워드/카테고리)
                <span className="text-xs font-normal text-slate-400 ml-1">(최대 5개)</span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition-all bg-white">
                {(watchedValues.tags || []).map((tag, index) => (
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
                  placeholder={(watchedValues.tags || []).length === 0 ? "태그 입력 후 Enter" : "재료 추가..."}
                />
              </div>
            </div>

            {/* 멀티 스토어 링크 입력 */}
            <Controller
              name="links"
              control={control}
              render={({ field }) => (
                <MultiLinkInput
                  links={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto px-6"
                disabled={isSubmitting}
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto px-8"
                disabled={isSubmitting || !isAuthenticated}
                isLoading={isSubmitting}
              >
                수정 완료
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </div>
  )
}
