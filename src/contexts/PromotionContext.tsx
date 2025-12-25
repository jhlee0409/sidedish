'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { promoteProject, PromoteProjectData, PromotionResult, ApiError } from '@/lib/api-client'

interface PromotionJob {
  id: string
  projectId: string
  projectTitle: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: PromotionResult
  error?: string
  startedAt: number
}

interface PromotionContextType {
  /** Current promotion jobs */
  jobs: PromotionJob[]
  /** Whether any promotion is in progress */
  isPromoting: boolean
  /** Start a background promotion job */
  startPromotion: (data: PromoteProjectData) => void
  /** Clear completed/failed jobs */
  clearCompletedJobs: () => void
}

const PromotionContext = createContext<PromotionContextType | null>(null)

export function usePromotion() {
  const context = useContext(PromotionContext)
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider')
  }
  return context
}

interface PromotionProviderProps {
  children: React.ReactNode
}

export function PromotionProvider({ children }: PromotionProviderProps) {
  const [jobs, setJobs] = useState<PromotionJob[]>([])

  const isPromoting = jobs.some(job => job.status === 'pending' || job.status === 'in_progress')

  const startPromotion = useCallback((data: PromoteProjectData) => {
    const jobId = `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add job to state
    const newJob: PromotionJob = {
      id: jobId,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      status: 'in_progress',
      startedAt: Date.now(),
    }

    setJobs(prev => [...prev, newJob])

    // Show starting toast
    toast.loading(`"${data.projectTitle}" 홍보 게시 중...`, {
      id: jobId,
      duration: Infinity,
    })

    // Execute promotion in background
    promoteProject(data)
      .then((result) => {
        setJobs(prev =>
          prev.map(job =>
            job.id === jobId
              ? { ...job, status: 'completed', result }
              : job
          )
        )

        if (result.success) {
          const platformCount = data.platforms?.length || 4
          toast.success(
            `"${data.projectTitle}" 홍보 완료! ${platformCount}개 플랫폼에 게시되었습니다.`,
            { id: jobId }
          )
        } else {
          toast.error(`"${data.projectTitle}" 홍보 실패`, { id: jobId })
        }
      })
      .catch((error) => {
        let errorMessage = '홍보 게시에 실패했습니다.'

        if (error instanceof ApiError) {
          if (error.code === 'SERVICE_UNAVAILABLE') {
            errorMessage = '홍보 서비스가 설정되지 않았습니다.'
          } else if (error.status === 429) {
            errorMessage = '홍보 요청 한도를 초과했습니다.'
          }
        }

        setJobs(prev =>
          prev.map(job =>
            job.id === jobId
              ? { ...job, status: 'failed', error: errorMessage }
              : job
          )
        )

        toast.error(`"${data.projectTitle}" ${errorMessage}`, { id: jobId })
      })
  }, [])

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status === 'pending' || job.status === 'in_progress'))
  }, [])

  // Auto-clear old completed jobs after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setJobs(prev =>
        prev.filter(job =>
          (job.status === 'pending' || job.status === 'in_progress') ||
          job.startedAt > fiveMinutesAgo
        )
      )
    }, 60 * 1000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <PromotionContext.Provider
      value={{
        jobs,
        isPromoting,
        startPromotion,
        clearCompletedJobs,
      }}
    >
      {children}
    </PromotionContext.Provider>
  )
}
