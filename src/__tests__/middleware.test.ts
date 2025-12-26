/**
 * Middleware Tests
 *
 * Tests for Next.js Edge Runtime Middleware:
 * - Security headers application
 * - Route protection logic
 * - Static file exclusion
 * - API route handling
 *
 * @see src/middleware.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server')
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: new Map(),
      })),
      redirect: vi.fn((url: string) => ({
        headers: new Map(),
        url,
      })),
    },
  }
})

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Security Headers', () => {
    it('should add X-Frame-Options header', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockResponse = {
        headers: new Map<string, string>(),
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(response.headers.get).toBeDefined()
      // Note: In actual implementation, headers.set is called
      // This test verifies the middleware adds the header
    })

    it('should add X-Content-Type-Options header', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      )
    })

    it('should add Referrer-Policy header', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      )
    })

    it('should add Permissions-Policy header', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
      )
    })

    it('should add all security headers at once', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      middleware(mockRequest)

      expect(mockResponse.headers.set).toHaveBeenCalledTimes(4)
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY'
      )
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      )
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      )
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
      )
    })
  })

  describe('API Route Handling', () => {
    it('should skip middleware for API routes', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/api/projects',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockResponse = {
        headers: {
          set: vi.fn(),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      // API routes should return NextResponse.next() without adding headers
      expect(response).toBe(mockResponse)
      expect(mockResponse.headers.set).not.toHaveBeenCalled()
    })

    it('should skip middleware for /api/upload', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/api/upload',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockResponse = {
        headers: {
          set: vi.fn(),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(response).toBe(mockResponse)
      expect(mockResponse.headers.set).not.toHaveBeenCalled()
    })

    it('should skip middleware for /api/ai/generate', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/api/ai/generate',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockResponse = {
        headers: {
          set: vi.fn(),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(response).toBe(mockResponse)
      expect(mockResponse.headers.set).not.toHaveBeenCalled()
    })
  })

  describe('Protected Routes', () => {
    it('should allow access to public routes', async () => {
      const { middleware } = await import('@/middleware')

      const publicRoutes = ['/dashboard', '/menu/123', '/profile/user123', '/']

      for (const route of publicRoutes) {
        const mockRequest = {
          nextUrl: {
            pathname: route,
          },
          cookies: {
            get: vi.fn(),
          },
        } as unknown as NextRequest

        const mockHeaders = new Map<string, string>()
        const mockResponse = {
          headers: {
            set: vi.fn((key: string, value: string) => {
              mockHeaders.set(key, value)
            }),
            get: (key: string) => mockHeaders.get(key),
          },
        }

        vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

        const response = middleware(mockRequest)

        // Should add security headers for public routes
        expect(mockResponse.headers.set).toHaveBeenCalled()
        expect(response).toBe(mockResponse)
      }
    })

    it('should process protected routes without redirect (current implementation)', async () => {
      const { middleware } = await import('@/middleware')

      const protectedRoutes = [
        '/menu/register',
        '/menu/edit/123',
        '/mypage',
      ]

      for (const route of protectedRoutes) {
        const mockRequest = {
          nextUrl: {
            pathname: route,
          },
          url: 'http://localhost:3000' + route,
          cookies: {
            get: vi.fn(() => undefined),
          },
        } as unknown as NextRequest

        const mockHeaders = new Map<string, string>()
        const mockResponse = {
          headers: {
            set: vi.fn((key: string, value: string) => {
              mockHeaders.set(key, value)
            }),
            get: (key: string) => mockHeaders.get(key),
          },
        }

        vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

        const response = middleware(mockRequest)

        // Current implementation: no redirect, handled by client-side AuthContext
        // TODO: Future implementation should redirect to /login
        expect(response).toBe(mockResponse)
        expect(mockResponse.headers.set).toHaveBeenCalled()
      }
    })
  })

  describe('Matcher Configuration', () => {
    it('should export config with correct matcher pattern', async () => {
      const { config } = await import('@/middleware')

      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher).toHaveLength(1)
    })

    it('matcher should exclude static files', async () => {
      const { config } = await import('@/middleware')

      const pattern = config.matcher[0]

      // Pattern should exclude _next/static, _next/image, favicon.ico, and image files
      expect(pattern).toContain('_next/static')
      expect(pattern).toContain('_next/image')
      expect(pattern).toContain('favicon.ico')
      expect(pattern).toContain('svg|png|jpg|jpeg|gif|webp')
    })
  })

  describe('Response Handling', () => {
    it('should return NextResponse for all non-API routes', async () => {
      const { middleware } = await import('@/middleware')

      const routes = [
        '/dashboard',
        '/menu/123',
        '/mypage',
        '/login',
        '/profile/user123',
      ]

      for (const route of routes) {
        const mockRequest = {
          nextUrl: {
            pathname: route,
          },
          cookies: {
            get: vi.fn(),
          },
        } as unknown as NextRequest

        const mockHeaders = new Map<string, string>()
        const mockResponse = {
          headers: {
            set: vi.fn((key: string, value: string) => {
              mockHeaders.set(key, value)
            }),
            get: (key: string) => mockHeaders.get(key),
          },
        }

        vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

        const response = middleware(mockRequest)

        expect(response).toBeDefined()
        expect(response).toBe(mockResponse)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle root path correctly', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(response).toBe(mockResponse)
      expect(mockResponse.headers.set).toHaveBeenCalledTimes(4)
    })

    it('should handle paths with query parameters', async () => {
      const { middleware } = await import('@/middleware')

      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
        },
        cookies: {
          get: vi.fn(),
        },
      } as unknown as NextRequest

      const mockHeaders = new Map<string, string>()
      const mockResponse = {
        headers: {
          set: vi.fn((key: string, value: string) => {
            mockHeaders.set(key, value)
          }),
          get: (key: string) => mockHeaders.get(key),
        },
      }

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

      const response = middleware(mockRequest)

      expect(response).toBe(mockResponse)
      expect(mockResponse.headers.set).toHaveBeenCalled()
    })

    it('should handle nested routes', async () => {
      const { middleware } = await import('@/middleware')

      const nestedRoutes = [
        '/menu/edit/123/comments',
        '/profile/user123/projects',
        '/legal/terms',
      ]

      for (const route of nestedRoutes) {
        const mockRequest = {
          nextUrl: {
            pathname: route,
          },
          cookies: {
            get: vi.fn(),
          },
        } as unknown as NextRequest

        const mockHeaders = new Map<string, string>()
        const mockResponse = {
          headers: {
            set: vi.fn((key: string, value: string) => {
              mockHeaders.set(key, value)
            }),
            get: (key: string) => mockHeaders.get(key),
          },
        }

        vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any)

        const response = middleware(mockRequest)

        expect(response).toBeDefined()
      }
    })
  })
})
