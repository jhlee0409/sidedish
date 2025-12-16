'use client'

import { Sparkles } from 'lucide-react'
import { AiGenerationCandidate } from '@/lib/types'

interface AiCandidateSelectorProps {
  candidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
  onSelect: (candidateId: string) => void
  maxGenerations: number
}

const AiCandidateSelector: React.FC<AiCandidateSelectorProps> = ({
  candidates,
  selectedCandidateId,
  onSelect,
  maxGenerations,
}) => {
  // Create array of 3 slots (maxGenerations)
  const slots = Array.from({ length: maxGenerations }, (_, index) => {
    return candidates[index] || null
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-bold text-slate-700">AI 생성 후보</span>
        <span className="text-xs text-slate-500">
          (클릭하여 선택)
        </span>
      </div>

      <div className="flex gap-2">
        {slots.map((candidate, index) => {
          const isDisabled = !candidate
          const isSelected = candidate && candidate.id === selectedCandidateId

          return (
            <button
              key={candidate?.id || `slot-${index}`}
              type="button"
              disabled={isDisabled}
              onClick={() => candidate && onSelect(candidate.id)}
              className={`
                flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all
                ${isDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300'
                  : isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-1'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                }
              `}
            >
              {isDisabled ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300" />
                  후보 {index + 1}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${isSelected ? 'bg-white/30' : 'bg-orange-100 text-orange-600'}`}>
                    {index + 1}
                  </span>
                  후보 {index + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AiCandidateSelector
