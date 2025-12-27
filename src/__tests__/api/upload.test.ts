import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing route handler
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
  getAdminApp: vi.fn(() => ({})),
}))

vi.mock('@/lib/auth-utils', () => ({
  verifyAuth: vi.fn(),
  unauthorizedResponse: vi.fn(
    () => new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 })
  ),
}))

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9, resetMs: 60000 })),
  rateLimitResponse: vi.fn(
    () => new Response(JSON.stringify({ error: '요청이 너무 많습니다.' }), { status: 429 })
  ),
  RATE_LIMIT_CONFIGS: { UPLOAD: { maxRequests: 10, windowMs: 60000 } },
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
  createRateLimitKey: vi.fn((userId, ip) => `${userId}:${ip}`),
}))

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://test.public.blob.vercel-storage.com/sidedish/test-image.webp',
  }),
}))

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    gif: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image')),
  })),
}))

vi.mock('@/lib/file-validation', () => ({
  validateMagicNumber: vi.fn(() => true),
}))

describe('Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/upload', () => {
    it('should require authentication', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue(null)

      const { POST } = await import('@/app/api/upload/route')

      // Create a mock file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should reject request without file', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { POST } = await import('@/app/api/upload/route')

      const formData = new FormData()
      // No file appended

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('파일')
    })

    it('should reject unsupported file types', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { POST } = await import('@/app/api/upload/route')

      // Create a PDF file (not allowed)
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('지원하지 않는 파일 형식')
    })

    it('should reject files exceeding size limit', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { POST } = await import('@/app/api/upload/route')

      // Create a large file (6MB)
      const largeContent = new Uint8Array(6 * 1024 * 1024)
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('5MB')
    })

    it('should reject files with invalid magic number', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { validateMagicNumber } = await import('@/lib/file-validation')
      vi.mocked(validateMagicNumber).mockReturnValue(false)

      const { POST } = await import('@/app/api/upload/route')

      // File claims to be JPEG but content doesn't match
      const file = new File(['not-a-real-image'], 'fake.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const body = await response.json()
      expect(body.error).toContain('파일 형식이 올바르지 않습니다')
    })

    it('should apply rate limiting', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { checkRateLimit, rateLimitResponse } = await import('@/lib/rate-limiter')
      vi.mocked(checkRateLimit).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetMs: 30000,
      })

      const { POST } = await import('@/app/api/upload/route')

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      await POST(request)
      expect(rateLimitResponse).toHaveBeenCalled()
    })

    it('should upload valid image successfully', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { validateMagicNumber } = await import('@/lib/file-validation')
      vi.mocked(validateMagicNumber).mockReturnValue(true)

      const { checkRateLimit } = await import('@/lib/rate-limiter')
      vi.mocked(checkRateLimit).mockReturnValue({
        allowed: true,
        remaining: 9,
        resetMs: 60000,
      })

      const { put } = await import('@vercel/blob')
      vi.mocked(put).mockResolvedValue({
        url: 'https://test.public.blob.vercel-storage.com/sidedish/uploaded.webp',
        downloadUrl: 'https://test.public.blob.vercel-storage.com/sidedish/uploaded.webp',
        pathname: 'sidedish/uploaded.webp',
        contentType: 'image/webp',
        contentDisposition: 'inline',
      })

      const { POST } = await import('@/app/api/upload/route')

      // Create valid JPEG file with proper magic number
      const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
      const file = new File([jpegMagic], 'valid.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const body = await response.json()
      expect(body.url).toContain('vercel-storage.com')
      expect(put).toHaveBeenCalled()
    })

    it('should handle different image types correctly', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { validateMagicNumber } = await import('@/lib/file-validation')
      vi.mocked(validateMagicNumber).mockReturnValue(true)

      const { put } = await import('@vercel/blob')

      const { POST } = await import('@/app/api/upload/route')

      // Test PNG
      const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
      const pngFile = new File([pngMagic], 'test.png', { type: 'image/png' })
      const pngFormData = new FormData()
      pngFormData.append('file', pngFile)

      const pngRequest = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: pngFormData,
      })

      const pngResponse = await POST(pngRequest)
      expect(pngResponse.status).toBe(200)

      // Verify put was called with correct content type (webp for non-gif)
      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('.webp'),
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'image/webp' })
      )
    })

    it('should preserve GIF format for animated images', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { validateMagicNumber } = await import('@/lib/file-validation')
      vi.mocked(validateMagicNumber).mockReturnValue(true)

      const { put } = await import('@vercel/blob')
      vi.mocked(put).mockClear()

      const { POST } = await import('@/app/api/upload/route')

      // GIF magic number
      const gifMagic = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00])
      const gifFile = new File([gifMagic], 'animated.gif', { type: 'image/gif' })
      const gifFormData = new FormData()
      gifFormData.append('file', gifFile)

      const gifRequest = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: gifFormData,
      })

      const gifResponse = await POST(gifRequest)
      expect(gifResponse.status).toBe(200)

      // Verify GIF format is preserved
      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('.gif'),
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'image/gif' })
      )
    })
  })
})

describe('Upload API - Allowed file types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const disallowedTypes = [
    'application/pdf',
    'text/plain',
    'application/javascript',
    'image/svg+xml',
    'image/bmp',
    'video/mp4',
  ]

  it.each(allowedTypes)('should accept %s files', async (mimeType) => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const { validateMagicNumber } = await import('@/lib/file-validation')
    vi.mocked(validateMagicNumber).mockReturnValue(true)

    const { POST } = await import('@/app/api/upload/route')

    const file = new File(['test-content-padding'], `test.${mimeType.split('/')[1]}`, {
      type: mimeType,
    })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it.each(disallowedTypes)('should reject %s files', async (mimeType) => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const { POST } = await import('@/app/api/upload/route')

    const file = new File(['test'], `test.${mimeType.split('/')[1]}`, { type: mimeType })
    const formData = new FormData()
    formData.append('file', file)

    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
