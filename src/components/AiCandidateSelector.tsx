'use client'

import { useState } from 'react'
import { Check, Sparkles, ChevronDown, ChevronUp, Edit3, Hash } from 'lucide-react'
import { AiGenerationCandidate } from '@/lib/types'

interface AiCandidateSelectorProps {
  candidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
  onSelect: (candidateId: string) => void
  remainingGenerations: number
  maxGenerations: number
}

const AiCandidateSelector: React.FC<AiCandidateSelectorProps> = ({
  candidates,
  selectedCandidateId,
  onSelect,
  remainingGenerations,
  maxGenerations,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (candidates.length === 0) {
    return null
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-slate-700">AI 생성 후보</span>
          <span className="text-xs text-slate-500">
            ({candidates.length}/{maxGenerations}개 생성됨)
          </span>
        </div>
        {remainingGenerations > 0 && (
          <span className="text-xs text-slate-500">
            {remainingGenerations}회 생성 가능
          </span>
        )}
      </div>

      <div className="grid gap-2">
        {candidates.map((candidate, index) => {
          const isSelected = candidate.id === selectedCandidateId
          const isExpanded = expandedId === candidate.id

          return (
            <div
              key={candidate.id}
              className={`
                border rounded-xl overflow-hidden transition-all
                ${isSelected
                  ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => onSelect(candidate.id)}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {candidate.content.shortDescription || '(한 줄 소개 없음)'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(candidate.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-100">
                  <div className="mt-3 space-y-3">
                    {/* Description Preview */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                        <Edit3 className="w-3 h-3" />
                        상세 설명 미리보기
                      </label>
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {candidate.content.description || '(상세 설명 없음)'}
                      </div>
                    </div>

                    {/* Tags */}
                    {candidate.content.tags.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1">
                          <Hash className="w-3 h-3" />
                          태그
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {candidate.content.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Time */}
                    <div className="text-[10px] text-slate-400 pt-1">
                      생성 시간: {new Date(candidate.content.generatedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {remainingGenerations === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          이 프로젝트의 AI 생성 한도({maxGenerations}회)를 모두 사용했습니다.
          위의 후보 중에서 선택하거나 직접 수정해주세요.
        </p>
      )}
    </div>
  )
}

export default AiCandidateSelector
