'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  isFirebaseConfigured,
  handleRedirectResult,
  FirebaseUser,
} from '@/lib/firebase'
import { initApiClient, updateUser, getUser, reactivateUser } from '@/lib/api-client'
import { CreateUserAgreementsInput } from '@/lib/db-types'
import { UserRole } from '@/lib/admin-constants'

export interface User {
  id: string
  email: string | null
  name: string
  avatarUrl: string
  originalAvatarUrl: string // 소셜 로그인 기본 프로필 사진
  provider: 'google' | 'github' | null
  isProfileComplete: boolean
  role: UserRole // 유저 역할 (user, admin, master)
}

// 탈퇴 계정 정보 (복구 가능 여부 판단용)
export interface WithdrawnAccountInfo {
  withdrawnAt: string
  daysRemaining: number // 복구 가능 남은 일수
  canReactivate: boolean // 30일 이내 복구 가능 여부
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  needsProfileSetup: boolean // 신규 사용자 프로필 설정 필요 여부
  withdrawnAccountInfo: WithdrawnAccountInfo | null // 탈퇴 계정 정보
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
  updateProfile: (data: { name?: string; avatarUrl?: string }) => void
  completeSignup: (data: {
    name: string
    avatarUrl: string
    agreements: CreateUserAgreementsInput
  }) => Promise<void>
  cancelSignup: () => Promise<void>
  reactivateAccount: () => Promise<void> // 탈퇴 계정 복구
  dismissReactivation: () => Promise<void> // 복구 거부 (로그아웃)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function firebaseUserToUser(
  firebaseUser: FirebaseUser,
  customAvatarUrl?: string,
  customName?: string,
  isProfileComplete: boolean = false,
  role: UserRole = 'user'
): User {
  // Determine provider
  let provider: 'google' | 'github' | null = null
  if (firebaseUser.providerData.length > 0) {
    const providerId = firebaseUser.providerData[0].providerId
    if (providerId === 'google.com') provider = 'google'
    else if (providerId === 'github.com') provider = 'github'
  }

  const originalAvatarUrl = firebaseUser.photoURL || ''

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: customName || 'Anonymous Chef',
    avatarUrl: customAvatarUrl || '',
    originalAvatarUrl,
    provider,
    isProfileComplete,
    role,
  }
}

// 탈퇴 후 복구 가능 기간 (30일)
const REACTIVATION_WINDOW_DAYS = 30

// 탈퇴 계정 정보 계산 헬퍼 함수
function calculateWithdrawnInfo(withdrawnAt: string): WithdrawnAccountInfo {
  const withdrawnDate = new Date(withdrawnAt)
  const now = new Date()
  const diffMs = now.getTime() - withdrawnDate.getTime()
  const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const daysRemaining = Math.max(0, REACTIVATION_WINDOW_DAYS - daysPassed)

  return {
    withdrawnAt,
    daysRemaining,
    canReactivate: daysRemaining > 0,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured] = useState(() => isFirebaseConfigured())
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const [withdrawnAccountInfo, setWithdrawnAccountInfo] = useState<WithdrawnAccountInfo | null>(null)

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    // WebView에서 redirect 로그인 후 돌아왔을 때 결과 처리
    handleRedirectResult().catch((error) => {
      console.error('Failed to handle redirect result:', error)
    })

    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)

        // Firestore에서 기존 사용자 정보 확인
        try {
          const existingUser = await getUser(fbUser.uid)

          // 탈퇴한 계정인지 확인
          if (existingUser.isWithdrawn && existingUser.withdrawnAt) {
            const withdrawnInfo = calculateWithdrawnInfo(existingUser.withdrawnAt)
            setWithdrawnAccountInfo(withdrawnInfo)

            // 복구 가능한 경우: 임시 사용자 정보만 설정 (모달에서 선택하게 함)
            if (withdrawnInfo.canReactivate) {
              setUser(firebaseUserToUser(fbUser, '', '', false, 'user'))
              setNeedsProfileSetup(false)
            } else {
              // 복구 불가능한 경우: 로그아웃 처리
              await signOut()
              setWithdrawnAccountInfo(null)
            }
            setIsLoading(false)
            return
          }

          // 탈퇴 상태 초기화 (탈퇴하지 않은 정상 계정)
          setWithdrawnAccountInfo(null)

          // 기존 사용자가 있고 프로필 설정이 완료된 경우
          if (existingUser.isProfileComplete) {
            setUser(
              firebaseUserToUser(
                fbUser,
                existingUser.avatarUrl,
                existingUser.name,
                existingUser.isProfileComplete,
                existingUser.role || 'user'
              )
            )
            setNeedsProfileSetup(false)
          } else {
            // 프로필 설정이 완료되지 않은 경우
            setUser(firebaseUserToUser(fbUser, '', '', false, 'user'))
            setNeedsProfileSetup(true)
          }
        } catch {
          // 신규 사용자 - 프로필 설정 필요
          setWithdrawnAccountInfo(null)
          setUser(firebaseUserToUser(fbUser, '', '', false, 'user'))
          setNeedsProfileSetup(true)
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
        setNeedsProfileSetup(false)
        setWithdrawnAccountInfo(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [isConfigured])

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSignInWithGithub = useCallback(async () => {
    try {
      setIsLoading(true)
      await signInWithGithub()
    } catch (error) {
      console.error('GitHub sign-in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      setIsLoading(true)
      await signOut()
      setNeedsProfileSetup(false)
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null
    try {
      return await firebaseUser.getIdToken()
    } catch {
      return null
    }
  }, [firebaseUser])

  // Initialize API client with token getter
  useEffect(() => {
    initApiClient(getIdToken)
  }, [getIdToken])

  // 프로필 업데이트 시 로컬 상태도 동기화
  const handleUpdateProfile = useCallback(
    (data: { name?: string; avatarUrl?: string }) => {
      setUser((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          name: data.name ?? prev.name,
          avatarUrl: data.avatarUrl ?? prev.avatarUrl,
        }
      })
    },
    []
  )

  // 회원가입 완료 (프로필 설정 + 약관 동의)
  const handleCompleteSignup = useCallback(
    async (data: {
      name: string
      avatarUrl: string
      agreements: CreateUserAgreementsInput
    }) => {
      if (!firebaseUser) {
        throw new Error('로그인이 필요합니다.')
      }

      try {
        await updateUser(firebaseUser.uid, {
          name: data.name,
          avatarUrl: data.avatarUrl,
          agreements: data.agreements,
          isProfileComplete: true,
        })

        setUser((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            name: data.name,
            avatarUrl: data.avatarUrl,
            isProfileComplete: true,
          }
        })
        setNeedsProfileSetup(false)
      } catch (error) {
        console.error('Failed to complete signup:', error)
        throw error
      }
    },
    [firebaseUser]
  )

  // 회원가입 취소 (로그아웃)
  const handleCancelSignup = useCallback(async () => {
    await handleSignOut()
  }, [handleSignOut])

  // 탈퇴 계정 복구
  const handleReactivateAccount = useCallback(async () => {
    if (!firebaseUser) {
      throw new Error('로그인이 필요합니다.')
    }

    try {
      setIsLoading(true)
      await reactivateUser(firebaseUser.uid)

      // 복구 성공 - 프로필 재설정 필요
      setWithdrawnAccountInfo(null)
      setNeedsProfileSetup(true)
      setUser(firebaseUserToUser(firebaseUser, '', '', false, 'user'))
    } catch (error) {
      console.error('Failed to reactivate account:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  // 탈퇴 계정 복구 거부 (로그아웃)
  const handleDismissReactivation = useCallback(async () => {
    setWithdrawnAccountInfo(null)
    await handleSignOut()
  }, [handleSignOut])

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && user.isProfileComplete,
    isConfigured,
    needsProfileSetup,
    withdrawnAccountInfo,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGithub: handleSignInWithGithub,
    signOut: handleSignOut,
    getIdToken,
    updateProfile: handleUpdateProfile,
    completeSignup: handleCompleteSignup,
    cancelSignup: handleCancelSignup,
    reactivateAccount: handleReactivateAccount,
    dismissReactivation: handleDismissReactivation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
