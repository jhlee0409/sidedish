import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client - uploadImage', () => {
  let uploadImage: typeof import('@/lib/api-client').uploadImage
  let initApiClient: typeof import('@/lib/api-client').initApiClient

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Reset the module to get fresh state
    const apiClient = await import('@/lib/api-client')
    uploadImage = apiClient.uploadImage
    initApiClient = apiClient.initApiClient
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should send file with Authorization header when token is available', async () => {
    // Initialize API client with token getter
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token-123')
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ url: 'https://example.com/uploaded.webp' }),
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const result = await uploadImage(file)

    expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-token-123',
      },
      body: expect.any(FormData),
    })
    expect(result.url).toBe('https://example.com/uploaded.webp')
  })

  it('should send file without Authorization header when token is not available', async () => {
    // Initialize API client with token getter that returns null
    const mockGetIdToken = vi.fn().mockResolvedValue(null)
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ url: 'https://example.com/uploaded.webp' }),
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    await uploadImage(file)

    expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
      method: 'POST',
      headers: {},
      body: expect.any(FormData),
    })
  })

  it('should throw ApiError on upload failure', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token-123')
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: '지원하지 않는 파일 형식입니다.' }),
    })

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    await expect(uploadImage(file)).rejects.toThrow()
  })

  it('should throw ApiError on 401 unauthorized', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue(null)
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: '인증이 필요합니다.' }),
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await expect(uploadImage(file)).rejects.toThrow()
  })

  it('should throw ApiError on 429 rate limit', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token-123')
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: '요청이 너무 많습니다.' }),
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    await expect(uploadImage(file)).rejects.toThrow()
  })

  it('should include file in FormData', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('mock-token-123')
    initApiClient(mockGetIdToken)

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ url: 'https://example.com/uploaded.webp' }),
    })

    const file = new File(['test-content'], 'profile.jpg', { type: 'image/jpeg' })
    await uploadImage(file)

    const callArgs = mockFetch.mock.calls[0]
    const formData = callArgs[1].body as FormData

    expect(formData.get('file')).toBe(file)
  })
})
