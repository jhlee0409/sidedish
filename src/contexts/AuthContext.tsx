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
import { initApiClient, updateUser, getUser } from '@/lib/api-client'
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

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  needsProfileSetup: boolean // 신규 사용자 프로필 설정 필요 여부
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured] = useState(() => isFirebaseConfigured())
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

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
          setUser(firebaseUserToUser(fbUser, '', '', false, 'user'))
          setNeedsProfileSetup(true)
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
        setNeedsProfileSetup(false)
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

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && user.isProfileComplete,
    isConfigured,
    needsProfileSetup,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGithub: handleSignInWithGithub,
    signOut: handleSignOut,
    getIdToken,
    updateProfile: handleUpdateProfile,
    completeSignup: handleCompleteSignup,
    cancelSignup: handleCancelSignup,
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
