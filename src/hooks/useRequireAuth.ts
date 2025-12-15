'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface UseRequireAuthOptions {
  redirectTo?: string
  redirectIfFound?: boolean
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', redirectIfFound = false } = options
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && isAuthenticated) ||
      // If redirectIfFound is not set and user was not found
      (!redirectIfFound && !isAuthenticated)
    ) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectIfFound, redirectTo, router])

  return { user, isLoading, isAuthenticated }
}
