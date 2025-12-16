'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Sparkles, Hash, Upload, Image as ImageIcon, Smartphone, Globe, Gamepad2, Palette, Box, Github, Wand2, ChefHat, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import Button from './Button'
import { CreateProjectInput, ProjectPlatform } from '@/lib/types'
import { generateProjectContent } from '@/services/geminiService'

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (project: CreateProjectInput) => void
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    shortDescription: '',
    description: '',
    tags: [],
    imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    author: 'Anonymous',
    link: '',
    githubUrl: '',
    platform: 'WEB'
  })
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB 이하여야 합니다.")
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
      toast.error("상세 설명 칸에 프로젝트에 대한 간단한 내용을 적어주세요!")
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
      toast.error('AI 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.shortDescription) {
      toast.error('필수 항목을 입력해주세요.')
      return
    }
    onSubmit(formData)
    onClose()
    setFormData({
      title: '',
      shortDescription: '',
      description: '',
      tags: [],
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
      author: 'Anonymous',
      link: '',
      githubUrl: '',
      platform: 'WEB'
    })
  }

  const platformOptions: { value: ProjectPlatform; label: string; icon: React.ReactNode }[] = [
    { value: 'WEB', label: '웹 서비스', icon: <Globe className="w-4 h-4" /> },
    { value: 'APP', label: '모바일 앱', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'GAME', label: '게임', icon: <Gamepad2 className="w-4 h-4" /> },
    { value: 'DESIGN', label: '디자인/작품', icon: <Palette className="w-4 h-4" /> },
    { value: 'OTHER', label: '콘텐츠/기타', icon: <Box className="w-4 h-4" /> },
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
          placeholder: 'https://notion.so/... 또는 YouTube, 뉴스레터 등',
          desc: '노션, 유튜브, 뉴스레터, 전자책, 커뮤니티 등 어떤 링크든 괜찮아요.'
        }
    }
  }

  const linkConfig = getLinkConfig(formData.platform)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm px-8 py-5 border-b border-slate-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-orange-500" />
              새로운 메뉴 등록
            </h2>
            <p className="text-sm text-slate-500 mt-1">맛있는 아이디어를 플레이팅해보세요.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

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
                placeholder="프로젝트에 대해 자유롭게 적어주세요. (예: 노션으로 정리한 여행 계획 템플릿이에요 / 피그마로 만든 앱 디자인 시안입니다 / 버블로 만든 예약 서비스예요)"
              />

              <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-100">
                간단한 재료만 적고 AI 버튼을 눌러보세요!
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
                placeholder={formData.tags.length === 0 ? "AI 버튼으로 자동 생성하거나 직접 입력" : "재료 추가..."}
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
                GitHub / 소스 링크 <span className="text-xs font-normal text-slate-400">(선택)</span>
              </label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="코드가 있다면 공유해주세요 (없어도 OK!)"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="px-6">취소</Button>
            <Button type="submit" variant="primary" className="px-8 rounded-xl shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700 text-white">메뉴 등록 완료</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectFormModal
