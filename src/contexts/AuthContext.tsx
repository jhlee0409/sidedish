'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  isFirebaseConfigured,
  FirebaseUser,
} from '@/lib/firebase'
import { initApiClient, updateUser } from '@/lib/api-client'

export interface User {
  id: string
  email: string | null
  name: string
  avatarUrl: string
  provider: 'google' | 'github' | null
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  // Determine provider
  let provider: 'google' | 'github' | null = null
  if (firebaseUser.providerData.length > 0) {
    const providerId = firebaseUser.providerData[0].providerId
    if (providerId === 'google.com') provider = 'google'
    else if (providerId === 'github.com') provider = 'github'
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || 'Anonymous Chef',
    avatarUrl: firebaseUser.photoURL || '',
    provider,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured] = useState(() => isFirebaseConfigured())

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        setUser(firebaseUserToUser(fbUser))

        // Sync user profile to Firestore (updateUser creates if not exists)
        try {
          await updateUser(fbUser.uid, {
            name: fbUser.displayName || 'Anonymous Chef',
            avatarUrl: fbUser.photoURL || '',
          })
        } catch (error) {
          console.error('Failed to sync user profile:', error)
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
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

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    isConfigured,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGithub: handleSignInWithGithub,
    signOut: handleSignOut,
    getIdToken,
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
