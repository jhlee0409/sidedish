'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Hash, Upload, Image as ImageIcon, Smartphone, Globe, Gamepad2, Palette, Box, Github, Wand2, ChefHat, Utensils, X } from 'lucide-react'
import Button from '@/components/Button'
import { Project, ProjectPlatform } from '@/lib/types'
import { generateProjectContent } from '@/services/geminiService'
import { getProjectById, saveProject } from '@/lib/storage'

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

export default function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    tags: [] as string[],
    imageUrl: '',
    author: '',
    link: '',
    githubUrl: '',
    platform: 'WEB' as ProjectPlatform
  })
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadProject = () => {
      const found = getProjectById(id)
      if (found) {
        setProject(found)
        setFormData({
          title: found.title,
          shortDescription: found.shortDescription,
          description: found.description,
          tags: found.tags,
          imageUrl: found.imageUrl,
          author: found.author,
          link: found.link,
          githubUrl: found.githubUrl || '',
          platform: found.platform
        })
      }
      setIsLoading(false)
    }
    loadProject()
  }, [id])

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

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleAiGenerate = async () => {
    if (!formData.description) {
      alert("상세 설명 칸에 프로젝트에 대한 간단한 내용을 적어주세요!")
      return
    }

    setIsAiLoading(true)
    try {
      const result = await generateProjectContent(formData.description)

      setFormData(prev => ({
        ...prev,
        shortDescription: result.shortDescription,
        description: result.description,
        tags: result.tags
      }))
    } catch (error) {
      console.error(error)
      alert('AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.shortDescription) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    if (!project) return

    const updatedProject: Project = {
      ...project,
      ...formData,
    }

    saveProject(updatedProject)
    router.push('/mypage')
  }

  const linkConfig = getLinkConfig(formData.platform)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">로딩 중...</div>
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
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="예: 여행작가 김감성"
                />
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
                  {formData.imageUrl ? (
                    <>
                      <Image src={formData.imageUrl} alt="Thumbnail preview" fill className="object-cover" />
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
            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-sm font-bold text-slate-700">상세 레시피 (설명)</label>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={!formData.description || isAiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  AI 셰프가 대신 작성하기
                </button>
              </div>

              <div className="relative group">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 pb-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                  placeholder="이 메뉴의 특별한 맛과 특징을 자유롭게 적어주세요."
                />

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
                <Button type="button" variant="ghost" className="w-full sm:w-auto px-6">취소</Button>
              </Link>
              <Button type="submit" variant="primary" className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 text-white">
                수정 완료
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
