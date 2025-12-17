import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window for server-side tests
if (typeof window === 'undefined') {
  global.window = undefined as unknown as Window & typeof globalThis
}

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
