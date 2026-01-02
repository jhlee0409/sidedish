'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm, Controller, FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft, Sparkles, Hash, Upload, Image as ImageIcon,
  Wand2, ChefHat, Utensils, X, Loader2, Save, Clock, AlertCircle, FlaskConical, Megaphone
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import AiCandidateSelector from '@/components/AiCandidateSelector'
import MultiLinkInput from '@/components/MultiLinkInput'
import { FormField, CharacterCount } from '@/components/form'
import { DraftData, StoreType } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { createProject, uploadImage, getAiUsageInfo, generateAiContent, ApiError, PROMOTION_PLATFORMS, SocialPlatform } from '@/lib/api-client'
import { usePromotion } from '@/contexts/PromotionContext'
import LoginModal from '@/components/LoginModal'
import {
  getOrCreateDraft,
  saveDraft,
  deleteDraft,
  clearCurrentDraftId,
  formatLastSaved,
  hasUnsavedChanges,
  addAiCandidate,
  selectCandidate,
} from '@/lib/draftService'
import { projectFormSchema, projectFormDefaultValues, type ProjectFormData } from '@/lib/schemas'
import { AI_CONSTRAINTS, PROJECT_CONSTRAINTS } from '@/lib/form-constants'
import { PLATFORM_OPTIONS } from '@/lib/platform-config'

export default function MenuRegisterPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { startPromotion } = usePromotion()

  // RHF Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: projectFormDefaultValues,
    mode: 'onChange',
  })

  // Watch form values - 특정 필드만 감시하여 무한 루프 방지
  const formValues = watch()

  // Draft state
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [lastSaved, setLastSaved] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Other state
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [wantsPromotion, setWantsPromotion] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['x', 'linkedin', 'facebook', 'threads'])

  // AI limit state
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize draft on mount
  useEffect(() => {
    if (!authLoading && user?.id) {
      const existingDraft = getOrCreateDraft(user.id)
      setDraft(existingDraft)

      // Load form data from draft
      reset({
        title: existingDraft.title,
        shortDescription: existingDraft.shortDescription,
        description: existingDraft.description,
        tags: existingDraft.tags,
        imageUrl: existingDraft.imageUrl,
        link: existingDraft.link,
        githubUrl: existingDraft.githubUrl,
        links: existingDraft.links || [],
        platform: existingDraft.platform,
        isBeta: existingDraft.isBeta ?? false,
      })

      // If there's a selected candidate, apply its content
      if (existingDraft.selectedCandidateId) {
        const selectedCandidate = existingDraft.aiCandidates.find(
          c => c.id === existingDraft.selectedCandidateId
        )
        if (selectedCandidate) {
          setValue('shortDescription', selectedCandidate.content.shortDescription)
          setValue('description', selectedCandidate.content.description)
          setValue('tags', selectedCandidate.content.tags)
        }
      }

      setLastSaved(formatLastSaved(existingDraft.lastSavedAt))

      // Load promotion settings from draft
      if (existingDraft.wantsPromotion !== undefined) {
        setWantsPromotion(existingDraft.wantsPromotion)
      }
      if (existingDraft.selectedPlatforms?.length) {
        setSelectedPlatforms(existingDraft.selectedPlatforms as SocialPlatform[])
      }

      // Fetch AI usage info
      getAiUsageInfo(existingDraft.id)
        .then(usage => {
          setAiLimitInfo(prev => ({
            ...prev,
            remainingForDraft: usage.remainingForDraft,
            remainingForDay: usage.remainingForDay,
            maxPerDraft: usage.maxPerDraft,
            maxPerDay: usage.maxPerDay,
          }))
        })
        .catch(err => console.error('Failed to fetch AI usage info:', err))
    }
  }, [authLoading, user?.id, reset, setValue])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Ref to track latest form values without causing re-renders
  const formValuesRef = useRef(formValues)
  formValuesRef.current = formValues

  const draftRef = useRef(draft)
  draftRef.current = draft

  // Refs for promotion settings
  const wantsPromotionRef = useRef(wantsPromotion)
  wantsPromotionRef.current = wantsPromotion

  const selectedPlatformsRef = useRef(selectedPlatforms)
  selectedPlatformsRef.current = selectedPlatforms

  // Auto-save draft - stable function that reads from refs
  const autoSaveDraft = useCallback(() => {
    const currentDraft = draftRef.current
    const currentFormValues = formValuesRef.current

    if (!currentDraft || !user?.id) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    setIsSaving(true)
    autoSaveTimerRef.current = setTimeout(() => {
      const updatedDraft: DraftData = {
        ...currentDraft,
        ...currentFormValues,
        links: currentFormValues.links.map(l => ({
          ...l,
          storeType: l.storeType as StoreType,
        })),
        // 홍보 설정 포함
        wantsPromotion: wantsPromotionRef.current,
        selectedPlatforms: selectedPlatformsRef.current,
      }

      saveDraft(updatedDraft)
      setDraft(updatedDraft)
      setLastSaved(formatLastSaved(Date.now()))
      setIsSaving(false)
    }, 1000)
  }, [user?.id])

  // Trigger auto-save on form data change using watch subscription
  useEffect(() => {
    const subscription = watch(() => {
      if (draftRef.current) {
        autoSaveDraft()
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, autoSaveDraft])

  // Trigger auto-save on promotion settings change
  useEffect(() => {
    if (draftRef.current) {
      autoSaveDraft()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsPromotion, selectedPlatforms])

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

  // Before unload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (draft && hasUnsavedChanges(draft)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [draft])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.")
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const currentTags = formValues.tags || []
      if (currentTags.length >= PROJECT_CONSTRAINTS.MAX_TAGS) {
        toast.error(`태그는 최대 ${PROJECT_CONSTRAINTS.MAX_TAGS}개까지 추가할 수 있습니다.`)
        return
      }
      const newTag = tagInput.trim().toLowerCase()
      if (!currentTags.includes(newTag)) {
        setValue('tags', [...currentTags, newTag], { shouldValidate: true })
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValue('tags', formValues.tags.filter(tag => tag !== tagToRemove), { shouldValidate: true })
  }

  const handleAiGenerate = async () => {
    if (!draft || !user?.id) return

    setAiError(null)

    if (formValues.description.length < AI_CONSTRAINTS.MIN_DESC_LENGTH) {
      setAiError(`최소 ${AI_CONSTRAINTS.MIN_DESC_LENGTH}자 이상의 설명을 입력해주세요. (현재 ${formValues.description.length}자)`)
      return
    }

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
      const result = await generateAiContent(draft.id, formValues.description)

      const candidate = addAiCandidate(draft.id, {
        shortDescription: result.shortDescription,
        description: result.description,
        tags: result.tags,
        generatedAt: result.generatedAt,
      })

      const updatedDraft = {
        ...draft,
        aiCandidates: [...draft.aiCandidates, candidate],
        selectedCandidateId: candidate.id,
        generationCount: draft.generationCount + 1,
      }
      setDraft(updatedDraft)

      setValue('shortDescription', result.shortDescription)
      setValue('description', result.description)
      setValue('tags', result.tags)

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
        if (error.status === 429) {
          getAiUsageInfo(draft.id)
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
    if (!draft || !user?.id) return

    selectCandidate(draft.id, candidateId)

    const selectedCandidate = draft.aiCandidates.find(c => c.id === candidateId)
    if (selectedCandidate) {
      setValue('shortDescription', selectedCandidate.content.shortDescription)
      setValue('description', selectedCandidate.content.description)
      setValue('tags', selectedCandidate.content.tags)

      const updatedDraft: DraftData = {
        ...draft,
        selectedCandidateId: candidateId,
        aiCandidates: draft.aiCandidates.map(c => ({
          ...c,
          isSelected: c.id === candidateId,
        })),
      }
      setDraft(updatedDraft)
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!draft) {
      toast.error('임시 저장 정보를 찾을 수 없습니다.')
      return
    }

    try {
      let imageUrl = data.imageUrl

      if (selectedFile) {
        try {
          // Use draft.id as temporary entityId (no projectId yet)
          const uploadResult = await uploadImage(selectedFile, 'project', draft.id)
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Image upload failed:', error)
          toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
          return
        }
      }

      const primaryLink = data.links.find(l => l.isPrimary) || data.links[0]
      const githubLink = data.links.find(l => l.storeType === 'GITHUB')

      const project = await createProject({
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        tags: data.tags,
        imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/600/400`,
        link: primaryLink?.url || data.link,
        githubUrl: githubLink?.url || data.githubUrl,
        links: data.links.map(l => ({
          ...l,
          storeType: l.storeType as StoreType,
        })),
        platform: data.platform,
        isBeta: data.isBeta,
      })

      // Handle promotion if requested (runs in background)
      if (wantsPromotion) {
        startPromotion({
          projectId: project.id,
          projectTitle: data.title,
          projectSummary: data.shortDescription,
          projectDescription: data.description,
          projectTags: data.tags,
          platforms: selectedPlatforms,
        })
      }

      if (draft) {
        deleteDraft(draft.id)
        clearCurrentDraftId()
      }

      router.push(`/menu/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('메뉴 등록에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // Form validation error handler
  const onFormError = (errors: Record<string, unknown>) => {
    console.error('Form validation errors:', errors)

    // Show first error as toast
    const errorMessages: Record<string, string> = {
      title: '메뉴 이름을 확인해주세요.',
      shortDescription: '한 줄 소개를 확인해주세요.',
      description: '상세 설명을 확인해주세요.',
      tags: '태그를 확인해주세요.',
      imageUrl: '메뉴 사진을 확인해주세요.',
      links: '링크를 확인해주세요.',
      platform: '플랫폼을 선택해주세요.',
    }

    const firstErrorKey = Object.keys(errors)[0]
    if (firstErrorKey) {
      toast.error(errorMessages[firstErrorKey] || '입력 내용을 확인해주세요.')
    }
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
              <span className="font-bold text-slate-900 text-sm sm:text-base">새로운 메뉴 등록</span>
            </div>
            <div className="w-16 sm:w-24 flex items-center justify-end gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">저장 중...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="w-3 h-3" />
                  <span className="hidden sm:inline">{lastSaved}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-4xl">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 px-5 sm:px-8 py-8 sm:py-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">새로운 메뉴 등록</h1>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">맛있는 아이디어를 플레이팅해보세요</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit, onFormError)} className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="메뉴 이름 (프로젝트명)"
                    htmlFor="title"
                    required
                    error={errors.title}
                  >
                    <input
                      {...field}
                      id="title"
                      type="text"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-sm sm:text-base ${
                        errors.title ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="예: 제주도 감성 여행 가이드"
                    />
                  </FormField>
                )}
              />
              <FormField label="총괄 셰프 (작성자)">
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 text-sm sm:text-base flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  {user?.name || '로그인이 필요합니다'}
                </div>
              </FormField>
            </div>

            {/* Platform Selection */}
            <Controller
              name="platform"
              control={control}
              render={({ field }) => (
                <FormField label="메뉴 유형" required error={errors.platform}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all text-left ${
                          field.value === opt.value
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
                </FormField>
              )}
            />

            {/* Beta Checkbox */}
            <Controller
              name="isBeta"
              control={control}
              render={({ field }) => (
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                  <div className="flex items-center h-4 sm:h-5">
                    <input
                      type="checkbox"
                      id="isBeta"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 bg-white border-amber-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
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
              )}
            />

            {/* Promotion Checkbox */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-lg sm:rounded-xl">
                <div className="flex items-center h-4 sm:h-5">
                  <input
                    type="checkbox"
                    id="wantsPromotion"
                    checked={wantsPromotion}
                    onChange={(e) => setWantsPromotion(e.target.checked)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 bg-white border-indigo-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="wantsPromotion" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-indigo-800 cursor-pointer">
                    <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    소셜 미디어에 홍보하기
                  </label>
                  <p className="text-[10px] sm:text-xs text-indigo-700 mt-0.5 sm:mt-1 leading-relaxed">
                    선택한 플랫폼에 자동으로 홍보 게시글을 발행합니다.
                  </p>
                </div>
              </div>

              {/* Platform Selection - shown when promotion is enabled */}
              {wantsPromotion && (
                <div className="ml-6 sm:ml-8 p-3 sm:p-4 bg-white border border-indigo-100 rounded-lg sm:rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2.5">홍보할 플랫폼 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTION_PLATFORMS.map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform.id)
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // Prevent deselecting all platforms
                              if (selectedPlatforms.length > 1) {
                                setSelectedPlatforms(prev => prev.filter(p => p !== platform.id))
                              }
                            } else {
                              setSelectedPlatforms(prev => [...prev, platform.id])
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {platform.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    최소 1개 이상의 플랫폼을 선택해야 합니다.
                  </p>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <FormField label="메뉴 사진 (썸네일)" error={errors.imageUrl}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div
                      className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-orange-300 group cursor-pointer transition-all flex items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {(previewUrl || field.value) ? (
                        <>
                          <Image src={previewUrl || field.value} alt="Thumbnail preview" fill className="object-cover" />
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
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                        placeholder="또는 이미지 URL을 직접 입력하세요"
                      />
                      <div className="text-xs text-slate-500 space-y-1 pl-1">
                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 16:9 비율의 썸네일을 권장합니다</p>
                        <p className="flex items-center gap-1.5"><span className="w-1 h-1 bg-slate-400 rounded-full"></span> 5MB 이하의 JPG, PNG 파일을 업로드해주세요.</p>
                      </div>
                    </div>
                  </div>
                </FormField>
              )}
            />

            {/* AI Candidate Selector */}
            {draft && (
              <AiCandidateSelector
                candidates={draft.aiCandidates}
                selectedCandidateId={draft.selectedCandidateId}
                onSelect={handleCandidateSelect}
                maxGenerations={aiLimitInfo.maxPerDraft}
              />
            )}

            {/* Description with AI */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-4 mb-1">
                <div>
                  <label className="text-sm font-bold text-slate-700">상세 레시피 (설명)</label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    최소 {AI_CONSTRAINTS.MIN_DESC_LENGTH}자 이상 작성 후 AI 생성이 가능합니다
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>오늘 {aiLimitInfo.remainingForDay}회 남음</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={
                      formValues.description.length < AI_CONSTRAINTS.MIN_DESC_LENGTH ||
                      isAiLoading ||
                      aiLimitInfo.remainingForDraft === 0 ||
                      aiLimitInfo.cooldownRemaining > 0
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 whitespace-nowrap"
                  >
                    {aiLimitInfo.cooldownRemaining > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        {aiLimitInfo.cooldownRemaining}초
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">AI 셰프가 대신 작성하기</span>
                        <span className="sm:hidden">AI 작성</span>
                        <span>({aiLimitInfo.remainingForDraft}/{aiLimitInfo.maxPerDraft})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="relative group">
                    <textarea
                      {...field}
                      rows={6}
                      className="w-full px-4 py-3 pb-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                      placeholder="프로젝트에 대해 자유롭게 적어주세요. (예: 리액트로 만든 모바일 친화적인 투두리스트예요. 귀여운 고양이 테마가 포인트입니다.)"
                    />
                    <div className={`absolute bottom-3 left-3 text-xs ${field.value.length >= AI_CONSTRAINTS.MIN_DESC_LENGTH ? 'text-green-600' : 'text-slate-400'}`}>
                      <CharacterCount
                        current={field.value.length}
                        max={PROJECT_CONSTRAINTS.DESC_MAX_LENGTH}
                        min={AI_CONSTRAINTS.MIN_DESC_LENGTH}
                      />
                    </div>
                    <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-100">
                      간단히 적고 AI 버튼을 눌러보세요!
                    </div>
                    {isAiLoading && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-20">
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-orange-50 flex flex-col items-center animate-in zoom-in duration-300">
                          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse mb-2" />
                          <span className="text-sm font-bold text-slate-800">AI가 작성 중...</span>
                          <span className="text-xs text-slate-500 mt-1">소개글과 태그를 생성하고 있어요.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Short Description */}
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <FormField
                  label="한 줄 소개"
                  htmlFor="shortDescription"
                  required
                  error={errors.shortDescription}
                >
                  <input
                    {...field}
                    id="shortDescription"
                    type="text"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 ${
                      errors.shortDescription ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="위의 AI 버튼을 누르면 자동으로 생성됩니다."
                  />
                </FormField>
              )}
            />

            {/* Tags */}
            <FormField
              label="주요 재료 (키워드/카테고리)"
              hint={`최대 ${PROJECT_CONSTRAINTS.MAX_TAGS}개`}
              error={errors.tags?.root || errors.tags?.message ? { message: errors.tags.message } as FieldError : undefined}
            >
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[52px] focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition-all bg-white">
                {formValues.tags.map((tag, index) => (
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
                  placeholder={formValues.tags.length === 0 ? "AI 버튼으로 자동 생성하거나 직접 입력" : "태그 추가..."}
                  disabled={formValues.tags.length >= 5}
                />
              </div>
            </FormField>

            {/* Multi Link Input */}
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

            {/* Submit */}
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
                {isSubmitting ? '등록 중...' : '메뉴 등록 완료'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </div>
  )
}
